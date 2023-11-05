/**
 * Export des fonctions helpers pour la spécification HAL
 * Voir la spécification HAL : https://stateless.group/hal_specification.html
 * Voir la spécification HAL (RFC, source) : https://datatracker.ietf.org/doc/html/draft-kelly-json-hal
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
    return {
        "_links": [{
            "self": halLinkObject(baseURL + '/concerts' + '/' + concertData.id_concert, 'string'),
            "reservation": halLinkObject(baseURL + '/concerts' + '/' + concertData.id_concert + '/reservation', 'string')
        }],

        "artist": concertData.artist,
        "date": concertData.date_start,
        "nb_seats_available": concertData.nb_seats - concertData.nb_reservations,
        "location": concertData.location,
        "description": concertData.description
    }
}

/**
 * Retourne une représentation Ressource Object (HAL) d'une réservation
 * @param {*} reservationData Données brutes d'une reservation
 * @returns un Ressource Object Concert (spec HAL)
 */
function mapReservationToResourceObject(data, baseURL) {
    console.log(data)
    return {
        "_links": [{
            "self": halLinkObject(`${baseURL}/concerts/${data.id_concert}/reservations/?`, 'string')
        }],
        "pseudo": data.id_user,
        "date_reservation" : data.date_booking,
        "status": data.statut,
    }
}

/**
 * Retourne un Resource Object d'un utilisateur
 * @param {*} utilisateurData 
 * @param {*} baseURL 
 * @returns 
 */
function mapUserToResourceObject(utilisateurData, baseURL) {

    return {
        "_links": [{
            "self": halLinkObject(baseURL + '/utilisateurs' + '/' + utilisateurData.pseudo, 'string'),
        }],
        "_embedded": {
            "pseudo": utilisateurData.pseudo
        }
    }

}

module.exports = { halLinkObject, mapConcertoResourceObject, mapUserToResourceObject, mapReservationToResourceObject };
