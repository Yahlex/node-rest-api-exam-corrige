var express = require('express');
var router = express.Router();
var connection = require('../db');
var hal = require('../hal')


/* GET /concerts */
router.get('/concerts', function (req, res, next) {
    res.status(200).set('Content-Type', 'text/html').send('GET /concerts')
})

/* GET /concerts/{id} */
router.get('/concerts/:id', function (req, res, next) {
    //:id : identifiant primaire en base. Ici, on devra rajouter sur la regex 'que des caractères numériques'
    console.log(req.params.id)
    res.status(200).set('Content-Type', 'text/html').send('GET /concerts/{id}')
})

router.post('/foobar', function (req, res, next) {

    /*  #swagger.parameters['obj'] = {
                  in: 'body',
                  description: 'Some description...',
                  schema: {
                      $name: 'John Doe',
                      $age: 29,
                      about: ''
                  }
          } */

    console.log(req.body)
    res.status(200).set('Content-Type', 'text/html').send('POST /concerts/{id}')
})

/**
 * Créer une reservation pour le concert
 * POST /concerts/:name/reservation
 */
router.post('/concerts/:id/reservation', function (req, res, next) {

    //On doit récupérer la représentation du client: le pseudo de l'utilisateur qui reserve

    //Verifier que l'utilisateur existe

    //Verifier que la reservation n'existe pas encore

    //Créer la réservation avec status à confirmer,

    if (error) {
        console.error('Error connecting: ' + err.stack);
        return;
    }

    console.log(req.body)
    res.status(201).set('Content-Type', 'text/html').send('POST /concerts/{id}/reservation')

})


/**
 * Modifier une reservation pour le concert: confirmer ou annuler
 * PUT /concerts/:name/reservation
 */
router.put('/concerts/:id/reservation', function (req, res, next) {

    if (error) {
        console.error('Error connecting: ' + err.stack);
        return;
    }

    res.status(201).set('Content-Type', 'text/html').send('PUT /concerts/{id}/reservation')

})

module.exports = router;
