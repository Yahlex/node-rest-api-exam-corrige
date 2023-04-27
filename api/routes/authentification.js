var express = require('express');
var router = express.Router();
var connection = require('../db');
var hal = require('../hal')
var jwt = require('jsonwebtoken')

/**
 * Secret conservé côté serveur pour signer les JWT
 */
const SECRET = 'mykey'

/**
 * Simulation d'un compte avec un role
 */
const users = [
    { id: 1, username: 'foo', role: 'admin', password: 'password123' }
]

/* Ressource "S'authentifier": fournit un json webtoken POST /login */
router.post('/login', (req, res) => {
    // Pas d'information à traiter
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: 'Error. Please enter the correct username and password' })
    }

    // Checking
    const user = users.find(u => u.username === req.body.username && u.password === req.body.password)

    // Pas bon
    if (!user) {
        return res.status(400).json({ message: 'Error. Wrong login or password' })
    }

    const token = jwt.sign({
        id: user.id,
        username: user.username
    }, SECRET, { expiresIn: '3 hours' })

    return res.json({ access_token: token })
})

/* Récupération du header bearer */
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
        return res.status(401).json({ message: 'Error. Need a token' })
    }

    // Véracité du token
    jwt.verify(token, SECRET, (err, decodedToken) => {
        if (err) {
            res.status(401).json({ message: 'Error. Bad token' })
        } else {
            return next() //appeler la fonction middleware suivante (enregistrée dans le routeur)
        }
    })
}

// /**
//  * Démo de route protégée
//  * @param {} headerValue 
//  * @returns 
//  */
// router.get('/protected', checkTokenMiddleware, (req, res, next) => {

//     /**
//      * A faire: trouver dans swagger-autogen comment indiquer Authorization: Bearer dans le header
//      * pour insérer le token. En attendant, on peut toujours tester avec curl:
//      * curl -X GET -H 'Authorization: Bearer <le jwt token généré sur la route /login>' http://localhost:5001/protected
//      */

//     /* #swagger.security = [{
//                    [{ "Bearer": [] }]
//             }] */
//     // Récupération du token
//     const token = req.headers.authorization && extractBearerToken(req.headers.authorization)
//     // Décodage du token
//     const decoded = jwt.decode(token, { complete: false })
//     return res.json({ content: decoded })
// })


module.exports = router;