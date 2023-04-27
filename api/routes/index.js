var express = require('express');
var router = express.Router();
var connection = require('../db');
var hal = require('../hal')


/* Les concerts à venir GET /concerts */
router.get('/concerts', function (req, res, next) {

  // #swagger.summary = "Les concerts à venir"

  //Liste des concerts avec le nombre de reservations non annulées en cours
  connection.query("SELECT id, lieu, artiste, date_debut, nb_places, COUNT(*) as nb_reservations FROM Concert c INNER JOIN Reservation r ON c.id=r.id_concert WHERE r.statut != 'annule' GROUP BY (c.id)", (error, rows, fields) => {
    if (error) {
      console.error('Error connecting: ' + error.stack);
      res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
    }

    //Calculer le nombre de places disponibles: nb places - nb reservation non annulées

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
 * Toutes les réservations d'un concert : GET /concerts/:id/reservation
 * Cette route ne doit être accessible qu'au gestionnaire du site
 */
router.get('/concerts/:id/reservation', function (req, res, next) {
  // #swagger.summary = "Lister toutes les réservations d'un concert "

})


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

    if(rows.length === 0){
      //Ici on pourrait envoyer le lien pour effectuer une réservation
      res.status(403).json({ "msg": "Vous n'avez aucune réservation à confirmer pour ce concert" });
      return
    }

    const userId = (rows[0]).id
    const dateReservation = (rows[0]).date_reservation
    console.log(rows[0])


    connection.query("UPDATE Reservation SET statut='confirme' WHERE id_concert=? AND id_utilisateur=?;", [req.params.id, userId], (error, rows, fields) => {

      if (error) {
        console.error('Error connecting: ' + err.stack);
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
        return
      }
      res.json({
        "_links": [{
          "self": hal.halLinkObject("/concerts/1/reservations", 'string'),
          "concert": hal.halLinkObject("/concerts/1", 'string'),
          "confirmer": hal.halLinkObject("/concerts/1/reservations", 'string'),
          "annuler": hal.halLinkObject("/concerts/1/reservations", 'string'),
        }],
        "dateReservation": dateReservation,
        "pseudo": userId,
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

    //Verifier que la reservation exite avec le statut 'a_confirmer'

    //Lister toutes les reservations en cours non annulées pour ce concert. S'il y'en a, rejeter la demande
    connection.query("SELECT * FROM Utilisateur u INNER JOIN Reservation r ON u.id=r.id_utilisateur WHERE id_concert= ? AND r.statut = 'a_confirme' AND u.pseudo= ?", [req.params.id, req.body.pseudo], (error, rows, fields) => {

      if (error) {
        console.error('Error connecting: ' + err.stack);
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de rééssayer plus tard." });
        return
      }

      if(rows.length === 0){
        res.status(400).json({ "msg": "Vous n'avez aucune reservation à confirmer sur ce concert" });
        return
      }

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
        res.status(500).json({ "msg": "Vous avez déjà effectué une réservation pour ce concert." });
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
          "pseudo": userId,
          "status": "a_confirmer",
        });
      })
    })
  }) //<---- Bienvenue dans le callback hell !
})

module.exports = router;
