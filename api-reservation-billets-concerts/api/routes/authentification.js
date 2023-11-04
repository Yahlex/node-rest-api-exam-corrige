var express = require('express');
var router = express.Router();
var db = require('../db')
var hal = require('../hal')
var jwt = require('jsonwebtoken')

/**
 * Secret conservé côté serveur pour signer les JWT
 */
const SECRET = 'mysecretkey'


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

/* Fonction middleware de Vérification du token */
const checkTokenMiddleware = (req, res, next) => {

    // Récupération du token
    const token = req.headers.authorization && extractBearerToken(req.headers.authorization)

    // Présence d'un token
    if (!token) {
        return res.status(401).json({ "msg": "Vous n'êtes pas autorisé·e à accéder à cette ressource" })
    }

    // Véracité du token (token non modifié)
    jwt.verify(token, SECRET, (err, decodedToken) => {
        if (err) {
            res.status(401).json({ "msg": "Vous n'êtes pas autorisé·e à accéder à cette ressource" })
        } else {
            return next() //appeler la fonction middleware suivante (enregistrée dans le routeur)
        }
    })
}

/* Ressource "S'authentifier": fournit un JWT au client s'il s'authentifie et est un administrateur du système */
router.post('/login', async (req, res) => {

    // #swagger.summary = "S'authentifier"

    // Pas d'information à traiter
    if (!req.body.pseudo || !req.body.password) {
        return res.status(400).json({ message: 'Impossible de vous authentifier: mauvais pseudo ou mot de passe' })
    }

    const conn = await db.mysql.createConnection(db.dsn);

    try {
        // Identification et authentification
        // Remarque : ici le mot de passe est en clair dans la base. A ne pas reproduire dans la vraie vie. Il faudrait le hasher et comparer les hash pour plus de sécurité
        const [rows] = await conn.execute('SELECT pseudo FROM User WHERE pseudo = ? AND password = ? AND is_admin = 1', [req.body.pseudo, req.body.password]);

        user = {
            "pseudo": (rows[0]).pseudo,
            "is_admin": 1,
        }

        const token = jwt.sign({
            username: user.pseudo,
            is_admin: user.is_admin,
        }, SECRET, { expiresIn: 120 }) //Token valide 2min

        return res.status(201).json({
            "_links": {
                "self": hal.halLinkObject('/login'),
                "concerts": hal.halLinkObject('/concerts'),
                "reservations": hal.halLinkObject('/concerts/{id}/reservations', 'string', 'Liste des réservations pour un concert donné', true),
            },
            "access_token": token
        })

    } catch (error) {
        res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
    }
});

module.exports = { router, checkTokenMiddleware };
