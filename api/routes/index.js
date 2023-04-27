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
      res.status(500).json('Une erreur est survenue');
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
      res.status(500).json('Une erreur est survenue');
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


})


/**
 * Réservation d'une place de concert
 * Confirmer la réservation pour un concert : PUT /concerts/:id/reservation
 */
router.put('/concerts/:id/reservation', function (req, res, next) {

})

/**
 * Réservation d'une place de concert
 * Annuler la réservation pour un concert : DELETE /concerts/:id/reservation
 */
router.delete('/concerts/:id/reservation', function (req, res, next) {

})

/**
 * Réservation d'une place de concert
 * Effectuer une réservation pour un concert : POST /concerts/:id/reservation
 */
router.post('/concerts/:id/reservation', function (req, res, next) {
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

  //Les détails d'un concert avec le nombre de places restantes
  connection.query("SELECT pseudo FROM Utilisateur WHERE pseudo = ?", [req.body.pseudo], (error, rows, fields) => {

    if (error || rows.length === 0) {
      console.error('Pseudo non reconnu');
      res.status(403).json({ "msg": "Impossible de vous identifier, vous ne pouvez pas effectuer de réservation." });
    }


    //Verifier que la reservation avec le statut 'a_confirmer' ou 'confirme' n'existe pas encore

    //Créer la réservation avec status 'a_confirmer',

    res.set('Content-Type', 'application/hal+json');
    res.status(201);
    res.json("OK");
  })





})

module.exports = router;
