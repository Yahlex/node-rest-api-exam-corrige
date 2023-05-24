var express = require('express');
var router = express.Router();
var connection = require('../db');
var hal = require('../hal')


/* Les concerts à venir GET /concerts */
router.get('/concerts', function (req, res, next) {

  // #swagger.summary = "Les concerts à venir"

  //Liste des concerts avec le nombre de reservations non annulées en cours
  connection.query("SELECT id, lieu, artiste, date_debut, nb_places, COUNT(*) as nb_reservations FROM Concert c LEFT JOIN Reservation r ON c.id=r.id_concert WHERE (r.statut != 'annule' OR r.statut IS NULL) GROUP BY (c.id)", (error, rows, fields) => {
    if (error) {
      console.error('Error connecting: ' + error.stack);
      res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
    }

    //Fabriquer Ressource Object Concerts en respectant la spec HAL
    const concertsResourceObject = {
      "_embedded": {
        "concerts": rows.map(row => hal.mapConcertoResourceObject(row, req.baseUrl))
      }
    }
    res.set('Content-Type', 'application/hal+json');
    res.status(200);
    res.json(concertsResourceObject);
  })
})

/* Informations sur un concert : GET /concert/{id} */
router.get('/concerts/:id', function (req, res, next) {

  // #swagger.summary = "Détail d'un concert"

  //Les détails d'un concert avec le nombre de places restantes
  connection.query("SELECT id, lieu, artiste, date_debut, nb_places, description, COUNT(*) as nb_reservations FROM Concert c INNER JOIN Reservation r ON c.id=r.id_concert WHERE r.statut != 'annule' AND c.id= ? GROUP BY (c.id)", [req.params.id], (error, rows, fields) => {

    if (error || rows.length !== 1) {
      console.error('Error connecting: ' + err.stack);
      res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
    }

    //Fabriquer Ressource Object Concert (Root Document) en respectant la spec HAL
    const concertResourceObject = {
      "_embedded": {
        "concert": hal.mapConcertoResourceObject(rows[0], req.baseUrl)
      }
    }

    res.set('Content-Type', 'application/hal+json');
    res.status(200);
    res.json(concertResourceObject);
  })

});



/**
 * Réservation d'une place de concert
 * Confirmer la réservation pour un concert : PUT /concerts/:id/reservation
 */
router.put('/concerts/:id/reservation', function (req, res, next) {
  // #swagger.summary = "Confirmer une reservation pour une place de concert"

  //Verifier qu'il y'a bien un pseudo (Representation envoyée par le client)
  if (!req.body.pseudo) {
    console.error('Pseudo non fourni pour la reservation');
    res.status(400).json({ "msg": "Merci de fournir un pseudo pour confirmer votre réservation." });
  }

  //Vérifier qu'il y a bien une reservation a confirmer pour ce pseudo et ce concert
  //Lister toutes les reservations en cours non annulées pour ce concert. S'il y'en a, rejeter la demande
  connection.query("SELECT id, date_reservation FROM Utilisateur u INNER JOIN Reservation r ON u.id=r.id_utilisateur WHERE id_concert= ? AND r.statut = 'a_confirme' AND u.pseudo= ?", [req.params.id, req.body.pseudo], (error, rows, fields) => {

    if (error) {
      console.error('Error connecting: ' + err.stack);
      res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
      return
    }

    if (rows.length === 0) {
      //Ici on pourrait envoyer le lien pour effectuer une réservation
      res.status(403).json({ "msg": "Vous n'avez aucune réservation à confirmer pour ce concert" });
      return
    }

    const userId = (rows[0]).id
    const dateReservation = (rows[0]).date_reservation

    connection.query("UPDATE Reservation SET statut='confirme' WHERE id_concert=? AND id_utilisateur=?;", [req.params.id, userId], (error, rows, fields) => {

      if (error) {
        console.error('Error connecting: ' + err.stack);
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
        return
      }
      res.status(201).json({
        "_links": [{
          "self": hal.halLinkObject("/concerts/1/reservations", 'string'),
          "concert": hal.halLinkObject("/concerts/1", 'string'),
        }],
        "dateReservation": dateReservation,
        "pseudo": req.body.pseudo,
        "status": "confirme",
      });
    })
  })
})

/**
 * Réservation d'une place de concert
 * Annuler la réservation pour un concert : DELETE /concerts/:id/reservation
 */
router.delete('/concerts/:id/reservation', function (req, res, next) {
  // #swagger.summary = "Annuler une reservation pour une place de concert"

  //Verifier qu'il y'a bien un pseudo (Representation envoyée par le client)
  if (!req.body.pseudo) {
    console.error('Pseudo non fourni pour la reservation');
    res.status(400).json({ "msg": "Merci de fournir un pseudo pour annuler votre réservation." });
    return
  }

  //Verifier que l'utilisateur existe
  connection.query("SELECT id, pseudo FROM Utilisateur WHERE pseudo = ?", [req.body.pseudo], (error, rows, fields) => {

    if (error || rows.length === 0) {
      console.error('Pseudo non reconnu');
      res.status(403).json({ "msg": "Impossible de vous identifier, vous ne pouvez gérer vos réservations." });
      return
    }

    const userId = (rows[0]).id
    const dateReservation = (rows[0]).date_reservation

    //Verifier que la reservation exite avec le statut 'a_confirmer'

    //Lister toutes les reservations en cours non annulées pour ce concert. S'il y'en a pas, rejeter la demande
    connection.query("SELECT * FROM Utilisateur u INNER JOIN Reservation r ON u.id=r.id_utilisateur WHERE id_concert= ? AND r.statut = 'a_confirme' AND u.pseudo= ?", [req.params.id, req.body.pseudo], (error, rows, fields) => {

      if (error) {
        console.error('Error connecting: ' + err.stack);
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
        return
      }

      if (rows.length === 0) {
        //Ici on pourrait indiquer s'il y a reservation ou non (déjà confirmée.)
        res.status(400).json({ "msg": "Vous ne pouvez pas annuler votre reservation pour ce concert" });
        return
      }

      connection.query("UPDATE Reservation SET statut='annule' WHERE id_concert=? AND id_utilisateur=?;", [req.params.id, userId], (error, rows, fields) => {

        if (error) {
          console.error('Error connecting: ' + err.stack);
          res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
          return
        }
        res.status(201).json({
          "_links": [{
            "self": hal.halLinkObject("/concerts/1/reservations", 'string'),
            "concert": hal.halLinkObject("/concerts/1", 'string'),
          }],
          "dateReservation": dateReservation,
          "pseudo": req.body.pseudo,
          "status": "annule",
        });
      })
    })
  })
})

/**
 * Réservation d'une place de concert
 * Effectuer une réservation pour un concert : POST /concerts/:id/reservation
 */
router.post('/concerts/:id/reservation', function (req, res, next) {
  // #swagger.summary = "Réserver une place de concert"
  /* #swagger.parameters['pseudo'] = {
          in: 'formData',
          description: 'Le pseudo de l\'utilisateur qui effectue la réservation',
          required: 'true',
          type: 'string',
          format: 'application/x-www-form-urlencoded',
  } */

  //Verifier qu'il y'a bien un pseudo (Representation envoyée par le client)
  if (!req.body.pseudo) {
    console.error('Pseudo non fourni pour la reservation');
    res.status(400).json({ "msg": "Merci de fournir un pseudo pour effectuer une réservation." });
  }

  //Verifier que l'utilisateur existe
  connection.query("SELECT id, pseudo FROM Utilisateur WHERE pseudo = ?", [req.body.pseudo], (error, rows, fields) => {

    if (error || rows.length === 0) {
      console.error('Pseudo non reconnu');
      res.status(403).json({ "msg": "Impossible de vous identifier, vous ne pouvez pas effectuer de réservation." });
      return
    }

    const userId = (rows[0]).id

    //Vérifier qu'il reste des places disponibles
    connection.query("SELECT c.nb_places - COUNT(*) as 'nb_places_disponibles' FROM Concert c INNER JOIN Reservation r ON r.id_concert=c.id WHERE r.statut != 'annule' AND c.id=? GROUP BY c.id;", [req.params.id], (error, rows, fields) => {

      if (error) {
        console.error('Error connecting: ' + error.stack);
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
        return
      }

      const availableSeats = (rows[0]).nb_places_disponibles

      if (availableSeats === 0) {
        res.status(400).json({ "msg": "Nous sommes désolés, le concert est déjà complet." });
        return
      }

      //Verifier que la reservation avec le statut 'a_confirmer' ou 'confirme' n'existe pas encore

      //Lister toutes les reservations en cours non annulées pour ce concert. S'il y'en a, rejeter la demande
      connection.query("SELECT * FROM Utilisateur u INNER JOIN Reservation r ON u.id=r.id_utilisateur WHERE id_concert= ? AND (r.statut = 'a_confirme' OR r.statut = 'confirme') AND u.pseudo= ?", [req.params.id, req.body.pseudo], (error, rows, fields) => {

        if (error) {
          console.error('Error connecting: ' + err.stack);
          res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
          return
        }

        if (rows.length !== 0) {
          //On pourrait rappeler ici les détails de la réservation (lien vers le concert, date de reservation)
          res.status(400).json({ "msg": "Vous avez déjà effectué une réservation pour ce concert." });
          return
        }

        //Créer la réservation avec status 'a_confirmer',
        connection.query("INSERT INTO Reservation (id_concert, id_utilisateur, statut) VALUES (?, ?, 'a_confirme');", [req.params.id, userId], (error, rows, fields) => {

          if (error) {
            console.error('Error connecting: ' + err.stack);
            res.status(500).json({ "msg": "Malheureusement, nous n'avons pas pu effectuer votre réservation. Merci de rééssayer plus tard." });
            return
          }

          res.set('Content-Type', 'application/hal+json');
          res.status(201);
          res.json({
            "_links": [{
              "self": hal.halLinkObject("/concerts/1/reservations", 'string'),
              "concert": hal.halLinkObject("/concerts/1", 'string'),
              "confirmer": hal.halLinkObject("/concerts/1/reservations", 'string'),
              "annuler": hal.halLinkObject("/concerts/1/reservations", 'string'),
            }],
            "dateReservation": new Date(),
            "pseudo": req.body.pseudo,
            "status": "a_confirmer",
          });
        })
      })
    })
  }) //<---- Bienvenue dans le callback hell !
})

module.exports = router;
