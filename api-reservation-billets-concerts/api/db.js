/**
 * Export et test de la connexion à la base de données MySQL
 */

//Module mysql2 avec l'api des promesses
const mysql = require('mysql2/promise');

//On utilise l'utilisateur 'user' qui a des droits restreints (DQL, DML)
//Remarque : il faudrait déplacer le DSN en dehors du code dans un fichier d'environnement (laissé en exercice)
const dsn = {
    host: 'db',
    database: 'ticketing',
    user: 'user',
    password: 'password',
}

module.exports = {dsn, mysql}
