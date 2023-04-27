var express = require('express');
var router = express.Router();
var connection = require('../db');
var hal = require('../hal')
var jwt = require('jsonwebtoken')

/**
 * Secret conservé côté serveur pour signer les JWT
 */
const SECRET = 'mysecretkey'

/* Ressource "S'authentifier": fournit un json webtoken POST /login */
router.post('/login', (req, res) => {
    // Pas d'information à traiter
    if (!req.body.pseudo || !req.body.password) {
        return res.status(400).json({ message: 'Impossible de vous authentifier: mauvais pseudo ou mot de passe' })
    }

    // Identification et authentification

    connection.query("SELECT id, pseudo, role FROM Utilisateur WHERE pseudo = ? AND password = ? AND role='admin'", [req.body.pseudo, req.body.password], (error, rows, fields) => {
        if (error || rows.length === 0) {
            console.error('Pseudo non reconnu');
            res.status(400).json({ "msg": "Impossible de vous authentifier: mauvais pseudo ou mot de passe" });
            return
        }

        user = {
            "id": (rows[0]).id,
            "pseudo": (rows[0]).pseudo,
            "role": (rows[0]).role,
        }

        const token = jwt.sign({
            id: user.id,
            username: user.pseudo,
            role: user.role,
        }, SECRET, { expiresIn: '3 hours' })

        return res.status(201).json({
            "_links": {
                "self": hal.halLinkObject('/login'),
                "concerts": hal.halLinkObject('/concerts'),
                "reservations": hal.halLinkObject('/concerts/{id}/reservations', 'string', 'Liste des réservations pour un concert donné', true),
            },
            "access_token": token
        })
    })
})

/**
 * Récupère le bearer token
 * @param {*} headerValue 
 * @returns 
 */
const extractBearerToken = headerValue => {
    if (typeof headerValue !== 'string') {
        return false
    }

    const matches = headerValue.match(/(bearer)\s+(\S+)/i)

    return matches && matches[2]
}

/* Vérification du token */
const checkTokenMiddleware = (req, res, next) => {
    // Récupération du token
    const token = req.headers.authorization && extractBearerToken(req.headers.authorization)

    // Présence d'un token
    if (!token) {
        return res.status(401).json({ "msg": "Vous n'êtes pas autorisé·e à accéder à cette ressource" })
    }

    // Véracité du token
    jwt.verify(token, SECRET, (err, decodedToken) => {
        if (err) {
            res.status(401).json({ "msg": "Vous n'êtes pas autorisé·e à accéder à cette ressource" })
        } else {
            return next() //appeler la fonction middleware suivante (enregistrée dans le routeur)
        }
    })
}

/**
 * Réservation d'une place de concert
 * Toutes les réservations d'un concert : GET /concerts/:id/reservation
 * Cette route ne doit être accessible qu'au gestionnaire du site
 */
router.get('/concerts/:id/reservations', checkTokenMiddleware, function (req, res, next) {
    // #swagger.summary = "Lister toutes les réservations d'un concert "

    connection.query("SELECT u.pseudo, r.date_reservation, r.statut, c.id FROM Reservation r INNER JOIN Concert c ON r.id_concert=c.id INNER JOIN Utilisateur u ON r.id_utilisateur=u.id WHERE id_concert= ?", [req.params.id], (error, rows, fields) => {
        if (error) {
            res.status(400).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
            return
        }

        res.status(200).json({
            "_links": {
                "self": { "href": "/concerts/" + req.params.id + "/reservations" },
                "concert": { "href": "/concerts/" + req.params.id }
            },
            "_embedded": {
                "reservations": rows.map(row => hal.mapReservationToResourceObject(row, req.baseUrl)),
            },
            "nbReservations" : rows.length
        })
    })
})

module.exports = router;