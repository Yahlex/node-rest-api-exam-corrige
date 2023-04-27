var express = require('express');
var router = express.Router();
var connection = require('../db');
var hal = require('../hal')
var repo = require('../queries')


/* Les concerts à venir GET /concerts */
router.get('/concerts', function (req, res, next) {

  // #swagger.summary = "Liste des concerts"

  concerts = repo.findAllConcerts(req)

  console.log(concerts)

  //Fabriquer Ressource Object Concerts en respectant la spec HAL
  const concertsResourceObject = {
    "_embedded": {
      "concerts": rows.map(row => hal.mapConcertoResourceObject(row, req.baseUrl))
    }
  }

  res.set('Content-Type', 'application/hal+json');
  res.status(200);
  res.json(concertsResourceObject);
});

/* Informations sur un concert : GET /concert/{id} */
router.get('/concerts/:id', function (req, res, next) {

  // #swagger.summary = "Détail d'un concert"

  connection.query('SELECT * FROM Concert WHERE id = ?;', [req.params.id], (error, rows, fields) => {

    if (error) {
      console.error('Error connecting: ' + err.stack);
      return;
    }

    //On devrait n'avoir qu'un concert (l'URI désigne uniquement la ressource concert :name)
    if (rows.length !== 1) {
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

  //On doit récupérer la représentation du client: le pseudo de l'utilisateur qui reserve

  const pseudo = req.body.pseudo

  //Verifier qu'il y'a bien un pseudo (Representation envoyée par le client)

  //Verifier que l'utilisateur existe

  //Verifier que la reservation n'existe pas encore

  //Créer la réservation avec status 'à confirmer',

  res.set('Content-Type', 'application/hal+json');
  res.status(201);
  res.json({});

})

module.exports = router;
