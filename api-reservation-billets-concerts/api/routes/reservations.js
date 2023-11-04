var express = require('express');
var router = express.Router();
var db = require('../db')
var hal = require('../hal');
const { checkTokenMiddleware } = require('./authentification');

/**
 * Routing des ressources liées aux réservations de places de concert
 */


/**
 * Réservation d'une place de concert
 * Confirmer la réservation pour un concert : PUT /concerts/:id/reservation
 */
router.put('/concerts/:id/reservations', async function (req, res, next) {

    /*  #swagger.summary = "Confirmer une réservation à une place de concert"
         #swagger.requestBody = {
         required: false
     }
         #swagger.parameters['pseudo'] = {
             in: 'formData',
             description: 'Le pseudo de l\'utilisateur qui confirme sa réservation',
             required: 'true',
             type: 'string',
             format: 'application/x-www-form-urlencoded',
     } */

    //Verifier qu'il y'a bien un pseudo (Representation envoyée par le client)
    if (!req.body.pseudo) {
        res.status(400).json({ "msg": "Merci de fournir un pseudo pour confirmer votre réservation." });
        return
    }

    try {
        const conn = await db.mysql.createConnection(db.dsn);

        //Récuperer la réservation à confirmer
        let [rows] = await conn.execute(`SELECT pseudo, date_booking FROM User u INNER JOIN Reservation r ON u.pseudo=r.id_user WHERE id_concert= ? AND r.statut = 'to_confirm' AND u.pseudo= ?`, [req.params.id, req.body.pseudo]);

        if (rows.length === 0) {
            //Remarque : ici on pourrait envoyer le lien pour effectuer une réservation
            res.status(403).json({ "msg": "Vous n'avez aucune réservation à confirmer pour ce concert" });
            return
        }

        const dateReservation = (rows[0]).date_booking

        await conn.execute(`UPDATE Reservation SET statut='confirmed' WHERE id_concert = ? AND id_user= ?`, [req.params.id, req.body.pseudo]);

        const resourceObject = {
            "_links": [{
                "self": hal.halLinkObject(`/concerts/${req.params.id}/reservations`, 'string'),
                "concert": hal.halLinkObject(`/concerts/${req.params.id}`, 'string'),
            }],
            "dateReservation": dateReservation,
            "pseudo": req.body.pseudo,
            "status": "Réservation confirmée",
        }

        res.status(201).json(resourceObject);

    } catch (error) {
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
    }

})

/**
 * Réservation d'une place de concert
 * Annuler la réservation pour un concert : DELETE /concerts/:id/reservation
 */
router.delete('/concerts/:id/reservations', async function (req, res, next) {

    /*  #swagger.summary = "Annuler une réservation à une place de concert"
        #swagger.requestBody = {
        required: false
    }
        #swagger.parameters['pseudo'] = {
            in: 'formData',
            description: 'Le pseudo de l\'utilisateur qui annule sa réservation',
            required: 'true',
            type: 'string',
            format: 'application/x-www-form-urlencoded',
    } */

    //Verifier que l'utilisateur a envoyé son pseudo pour s'identifier
    if (!req.body.pseudo) {
        res.status(400).json({ "msg": "Merci de fournir un pseudo pour annuler votre réservation." });
        return
    }

    try {
        const conn = await db.mysql.createConnection(db.dsn);

        //Récupérer l'utilisateur identifié par le pseudo
        let [rows] = await conn.execute(`SELECT pseudo FROM User WHERE pseudo = ?`, [req.body.pseudo]);

        if (rows.length === 0) {
            res.status(403).json({ "msg": "Impossible de vous identifier, vous ne pouvez gérer vos réservations." });
            return
        }

        const dateReservation = (rows[0]).date_reservation

        //Verifier que la reservation existe avec le statut 'a_confirmer'

        //Récupérer la réservation en attende confirmation pour cet utilisateur et ce concert
        let [rows2] = await conn.execute(`SELECT * FROM User u INNER JOIN Reservation r ON u.pseudo=r.id_user WHERE id_concert= ? AND r.statut = 'to_confirm' AND u.pseudo= ?`, [req.params.id, req.body.pseudo]);

        if (rows2.length === 0) {
            //Ici on pourrait indiquer s'il y a reservation ou non (déjà confirmée.)
            res.status(400).json({ "msg": "Vous ne pouvez pas annuler votre reservation pour ce concert" });
            return
        }

        //Annuler la réservation
        let [rows3] = await conn.execute(`UPDATE Reservation SET statut='canceled' WHERE id_concert= ? AND id_user = ?`, [req.params.id, req.body.pseudo]);

        res.status(201).json({
            "_links": [{
                "self": hal.halLinkObject("/concerts/1/reservations", 'string'),
                "concert": hal.halLinkObject("/concerts/1", 'string'),
            }],
            "dateReservation": dateReservation,
            "pseudo": req.body.pseudo,
            "status": "Réservation annulée",
        });
    } catch (e) {
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
    }
});


/**
 * Réservation d'une place de concert
 * Effectuer une réservation pour un concert : POST /concerts/:id/reservation
 * Pour la doc swagger-autogen : https://swagger-autogen.github.io/docs/openapi-3/request-body
 */
router.post('/concerts/:id/reservations', async function (req, res, next) {

    /*  #swagger.summary = "Réserver une place de concert"
        #swagger.requestBody = {
        required: false
    }
        #swagger.parameters['pseudo'] = {
            in: 'formData',
            description: 'Le pseudo de l\'utilisateur qui effectue la réservation',
            required: 'true',
            type: 'string',
            format: 'application/x-www-form-urlencoded',
    } */

    //Verifier qu'il y'a bien un pseudo (Representation envoyée par le client)
    if (!req.body.pseudo) {
        res.status(400).json({ "msg": "Merci de fournir un pseudo pour effectuer une réservation." });
    }

    try {

        const conn = await db.mysql.createConnection(db.dsn);

        //Récupérer l'utilisateur identifié par le pseudo
        let [users] = await conn.execute(`SELECT pseudo FROM User WHERE pseudo = ?`, [req.body.pseudo]);

        if (users.length === 0) {
            res.status(403).json({ "msg": "Impossible de vous identifier, vous ne pouvez gérer vos réservations." });
            return
        }
        //Vérifier qu'il reste des places disponibles.PB ici
        let [rows2] = await conn.execute(`SELECT c.nb_seats - (SELECT COUNT(*) FROM Concert c INNER JOIN Reservation r on c.id_concert = r.id_concert WHERE r.statut != 'canceled' AND c.id_concert = ?) as nb_available_seats FROM Concert c WHERE c.id_concert = ?`, [req.params.id, req.params.id]);

        const availableSeats = (rows2[0]).nb_available_seats

        console.log(availableSeats)

        if (availableSeats === 0) {
            res.status(400).json({ "msg": "Nous sommes désolés, le concert est déjà complet." });
            return
        }

        //Verifier que la reservation avec le statut 'a_confirmer' ou 'confirme' n'existe pas encore
        //Lister toutes les reservations en cours non annulées pour ce concert. S'il y'en a, rejeter la demande

        let [rows3] = await conn.execute(`SELECT * FROM User u INNER JOIN Reservation r ON u.pseudo=r.id_user WHERE id_concert= ? AND (r.statut = 'to_confirm' OR r.statut = 'confirmed') AND u.pseudo= ?;`, [req.params.id, req.body.pseudo]);

        if (rows3.length !== 0) {
            //On pourrait rappeler ici les détails de la réservation (lien vers le concert, date de reservation)
            res.status(400).json({ "msg": "Vous avez déjà effectué une réservation pour ce concert." });
            return
        }

        let [rows4] = await conn.execute(`INSERT INTO Reservation (id_concert, id_user, statut) VALUES (?, ?, 'to_confirm')`, [req.params.id, req.body.pseudo]);

        res.set('Content-Type', 'application/hal+json');
        res.status(201);
        res.json({
            "_links": [{
                "self": hal.halLinkObject(`/concerts/${req.params.id}/reservations`, 'string'),
                "concert": hal.halLinkObject(`/concerts/${req.params.id}`, 'string'),
                "confirmer": hal.halLinkObject(`/concerts/${req.params.id}/reservations`, 'string'),
                "annuler": hal.halLinkObject(`/concerts/${req.params.id}/reservations`, 'string'),
            }],
            "dateBooking": new Date(),
            "for": req.body.pseudo,
            "status": "Réservation à confirmer",
        });

    } catch (error) {
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
    }

});

/**
 * Liste toutes les réservations d'un concert
 * Réservé à l'administrateur du site
 * Route authentifiée par JSON Web Token (JWT)
 * La fonction middleware checkTokenMiddleware vérifie d'abord la présence et validité du token
 * avant d’exécuter la fonction middleware suivante
 */
router.get('/concerts/:id/reservations', checkTokenMiddleware, async function (req, res, next) {

    // #swagger.summary = "Lister toutes les réservations d'un concert "

    console.log('OK')

    const conn = await db.mysql.createConnection(db.dsn)

    try {
        const [rows] = await conn.execute('SELECT * FROM Reservation WHERE id_concert = ?', [req.params.id]);

        if (rows.length === 0) {
            res.status(404).json({ "msg": "Il n'y a aucune réservations pour ce concert" })
            return
        }

        res.status(200).json({
            "_links": {
                "self": { "href": `/concerts/${req.params.id}/reservations`},
                "concert": { "href": `/concerts/${req.params.id}`}
            },
            "_embedded": {
                "reservations": rows.map(row => hal.mapReservationToResourceObject(row, req.baseUrl)),
            },
            "nbReservations": rows.length
        })

    } catch (error) {
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
    }
});

module.exports = router;
