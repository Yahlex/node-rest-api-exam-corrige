var express = require('express');
var router = express.Router();
var connection = require('../db');
var hal = require('../hal')



/**
 * Dummy: exemple de requete POST auto documentée par Swagger-autogen
 */
router.post('/foobar', function (req, res, next) {

  /*  #swagger.parameters['obj'] = {
                in: 'body',
                description: 'Some description...',
                schema: {
                    $name: 'Jhon Doe',
                    $age: 29,
                    about: ''
                }
        } */

  console.log(req.body)
  res.status(200).set('Content-Type', 'text/html').send('POST /concerts/{id}')
})



/* GET /concerts */
router.get('/concerts', function (req, res, next) {

  // #swagger.summary = "Liste des concerts"

  connection.query('SELECT * FROM Concert;', (error, rows, fields) => {

    if (error) {
      console.error('Error connecting: ' + err.stack);
      return;
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

});

/* GET /concerts */
router.get('/concerts/:id', function (req, res, next) {

  // #swagger.summary = "Détail d'un concert"

  console.log(req.params.id)

  //Non ! Sensible aux injection SQL. Essayer une injection SQL avec :name=AAA OR 1=1
  // connection.query('SELECT * FROM Concert WHERE nom = ' + req.params.name, (error, rows, fields) => {

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
 * Créer une reservation pour le concert
 * GET /concerts/:name/reservation
 */
router.get('/concerts/:id/reservation', function (req, res, next) {


})


/**
 * Créer une reservation pour le concert
 * PUT /concerts/:name/reservation
 */
router.put('/concerts/:id/reservation', function (req, res, next) {

})

/**
 * Créer une reservation pour le concert
 * POST /concerts/:name/reservation
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

  console.log(req.body)

  const pseudo = req.body.pseudo

  console.log(pseudo)

  //Verifier qu'il y'a bien un pseudo (Representation envoyée par le client)

  //Verifier que l'utilisateur existe

  //Verifier que la reservation n'existe pas encore

  //Créer la réservation avec status 'à confirmer',

  res.set('Content-Type', 'application/hal+json');
  res.status(201);
  res.json({});  

})


//GET /utilisateurs (pour le role d'admin)
router.get('/utilisateurs', function (req, res, next) {

  // #swagger.summary = "Liste des utilisateurs"

  connection.query('SELECT pseudo FROM Utilisateur;', (error, rows, fields) => {

    if (error) {
      console.error('Error connecting: ' + err.stack);
      return;
    }

    // //Fabriquer Ressource Object Utilisateurs (Root Document) en respectant la spec HAL
    const utilisateursResourceObject = {
      "_embedded": {
        "utilisateurs": rows.map(row => hal.mapUtilisateurtoResourceObject(row, req.baseUrl))
      }
    }

    res.set('Content-Type', 'application/hal+json');
    res.status(200);
    res.json(utilisateursResourceObject);
  })

});

module.exports = router;
