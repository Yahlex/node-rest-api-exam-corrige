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

    const conn = await db.mysql.createConnection(db.dsn);

    try {
        let [rows] = await conn.execute(`
        SELECT 
        c.id_concert,location, artist, date_start, nb_seats, COUNT(*) as nb_reservations
        FROM 
        Concert c 
        LEFT JOIN 
        Reservation r 
        ON c.id_concert=r.id_concert 
        WHERE (r.statut != 'cancelled' OR r.statut IS NULL) 
        AND c.date_start > CURDATE() 
        GROUP BY (c.id_concert)`);

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
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
    }
});

/* Informations sur un concert : GET /concert/{id} */
router.get('/concerts/:id',  async function (req, res, next) {

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
