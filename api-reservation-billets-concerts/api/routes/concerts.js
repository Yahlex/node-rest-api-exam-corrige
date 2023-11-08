var express = require('express');
var router = express.Router();
var db = require('../db')
var hal = require('../hal')

/**
 * Routing des ressources liées aux concerts
 */

/* La liste des concerts à venir */
router.get('/concerts', async function (req, res, next) {

    // #swagger.summary = "La liste des concerts à venir"

    /**
     * Validation des paramètres de requête d'URL
     */
    const orderByEnum = ['date'];
    const sortEnum = ['asc', 'desc'];

    var query = {};

    if (orderByEnum.includes(req.query['order-by'])) {

        if (req.query['order-by'] === 'date') {
            query['orderBy'] = 'date_start';
        }
        if (sortEnum.includes(req.query['sort'])) {
            query['sort'] = req.query['sort'].toLocaleUpperCase();
        } else {
            query['sort'] = 'desc'
        }
    }

    const conn = await db.mysql.createConnection(db.dsn);

    //Remarque : ORDER BY ne peut pas être paramétrisée par des placeholders (avec ?). Il faut donc directement intégrer
    //des chaines de caractères interpolées dans la requête. D'où l'importante de la validation en amont.

    try {
        let [rows] = await conn.execute(`SELECT c.id_concert, location, artist, date_start, nb_seats, COUNT(*) as nb_reservations FROM  Concert c LEFT JOIN Reservation r ON c.id_concert=r.id_concert WHERE (r.statut != 'canceled' OR r.statut IS NULL) AND c.date_start > CURDATE() GROUP BY (c.id_concert) ORDER BY c.${query.orderBy} ${query.sort}`);

        //Fabriquer Ressource Object Concerts en respectant la spec HAL
        const ressourceObject = {
            "_embedded": {
                "concerts": rows.map(row => hal.mapConcertoResourceObject(row, req.baseUrl))
            }
        }

        res.set('Content-Type', 'application/hal+json');
        res.status(200);
        res.json(ressourceObject);

    } catch (error) {
        console.log(error)
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
    }
});

/* Informations sur un concert : GET /concert/{id} */
//Remarque: on a mis un regex ici pour que la route ne match que des paramètres
//d'url qui soient des nombres entiers (1, 120, 12901, etc.).
//Le pattern dit [0-9] soit un caractère qui est 0,1,2,.. ou 9. Le '+' indique répète le pattern précédent 1 fois ou plus
router.get('/concerts/:id([0-9]+)', async function (req, res, next) {

    // #swagger.summary = "Détail d'un concert"

    const conn = await db.mysql.createConnection(db.dsn);

    //Les détails d'un concert avec le nombre de places restantes
    try {

        let [rows, fields] = await conn.execute(`
        SELECT c.id_concert, location, artist, music_style, date_start, nb_seats, description, COUNT(*) as nb_reservations 
        FROM Concert c 
        LEFT JOIN Reservation r 
        ON c.id_concert = r.id_concert 
        WHERE (r.statut != 'cancelled' OR r.statut IS NULL) AND c.id_concert = ? AND c.date_start > CURDATE() 
        GROUP BY (c.id_concert)`, [req.params.id]);


        if (rows.length === 0) {
            res.status(404).json({ "msg": "La ressource que vous recherchez n'existe pas" });
            //Remarque: il faudrait utiliser res.end() pour être en accord
            //complet avec la philosophie du framework plutôt que 'return'
            return;
        }

        if (rows.length !== 1) {
            res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
            return;
        }

        //Fabriquer Ressource Object Concert (Root Document) en respectant la spec HAL
        const resourceObject = {
            "_embedded": {
                "concert": hal.mapConcertoResourceObject(rows[0], req.baseUrl)
            }
        }

        res.set('Content-Type', 'application/hal+json');
        res.status(200);
        res.json(resourceObject);

    } catch (error) {
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
    }
});



module.exports = router;
