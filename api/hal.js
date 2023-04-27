/**
 * Export des fonctions utils hal
 */

/**
 * Retourne un Link Object
 * @param {*} url 
 * @param {*} type 
 * @param {*} name 
 * @param {*} templated 
 * @param {*} deprecation 
 * @returns 
 */
function halLinkObject(url, type = '', name = '', templated = false, deprecation = false) {

    return {
        "href": url,
        "templated": templated,
        ...(type && { "type": type }),
        ...(name && { "name": name }),
        ...(deprecation && { "deprecation": deprecation })
    }
}

/**
 * Retourne une représentation Ressource Object (HAL) d'un concert
 * @param {*} concertData Données brutes d'un concert
 * @returns un Ressource Object Concert (spec HAL)
 */
function mapConcertoResourceObject(concertData, baseURL) {


    console.log(concertData)

    return {
        "_links": [{
            "self": halLinkObject(baseURL + '/concerts' + '/' + concertData.id, 'string'),
            "reservation": halLinkObject(baseURL + '/concerts' + '/' + concertData.id + '/reservation', 'string')
        }],

        "artiste": concertData.artiste,
        "date": concertData.date_debut,
        "nb_places_restantes": concertData.nb_places - concertData.nb_reservations,
        "lieu": concertData.lieu,
        "description": concertData.description
    }
}

/**
 * Retourne un Resource Object d'un utilisateur
 * @param {*} utilisateurData 
 * @param {*} baseURL 
 * @returns 
 */
function mapUtilisateurtoResourceObject(utilisateurData, baseURL) {

    return {
        "_links": [{
            "self": halLinkObject(baseURL + '/utilisateurs' + '/' + utilisateurData.pseudo, 'string'),
        }],
        "_embedded": {
            "pseudo": utilisateurData.pseudo
        }
    }

}

module.exports = { halLinkObject, mapConcertoResourceObject, mapUtilisateurtoResourceObject };
