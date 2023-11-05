# Documentation du projet: choix de conception et d'implémentation

- [Documentation du projet: choix de conception et d'implémentation](#documentation-du-projet-choix-de-conception-et-dimplémentation)
  - [Conception de l'API](#conception-de-lapi)
    - [1. Déterminer l'ensemble des données](#1-déterminer-lensemble-des-données)
    - [2. **Décomposer** l'ensemble de données en ressources](#2-décomposer-lensemble-de-données-en-ressources)
    - [3. **Nommer** les ressources avec des URI](#3-nommer-les-ressources-avec-des-uri)
    - [4. **Implémenter** un sous-ensemble de l'interface uniforme (`GET`, `POST`, `DELETE`, `PUT`) pour chaque ressource](#4-implémenter-un-sous-ensemble-de-linterface-uniforme-get-post-delete-put-pour-chaque-ressource)
    - [Récapitulatif](#récapitulatif)
    - [5. **Étudier** la ou les représentations acceptées par les clients](#5-étudier-la-ou-les-représentations-acceptées-par-les-clients)
      - [Ressource *Les concerts à venir* `/concerts` :](#ressource-les-concerts-à-venir-concerts-)
      - [Ressource *Informations sur un concert* `/concerts/{id}`](#ressource-informations-sur-un-concert-concertsid)
      - [Ressource *Réservation d'une place de concert* `/concerts/{id}/reservations`](#ressource-réservation-dune-place-de-concert-concertsidreservations)
      - [Ressource *S'authentifier* : `POST /login`](#ressource-sauthentifier--post-login)
    - [6. **Concevoir** la ou les représentations à mettre à disposition des clients](#6-concevoir-la-ou-les-représentations-à-mettre-à-disposition-des-clients)
      - [Faire une réservation](#faire-une-réservation)
      - [Confirmer une réservation](#confirmer-une-réservation)
      - [Annuler une réservation](#annuler-une-réservation)
    - [S'authentifier](#sauthentifier)
    - [8. Envisager la progression typique des évènements](#8-envisager-la-progression-typique-des-évènements)
    - [9. Envisager les cas d'erreurs](#9-envisager-les-cas-derreurs)
  - [Conception de la base de données relationnelle](#conception-de-la-base-de-données-relationnelle)
    - [Conception de la base de données: du MCD au MPD](#conception-de-la-base-de-données-du-mcd-au-mpd)
    - [Utilisateurs MySQL](#utilisateurs-mysql)
    - [Liste des requêtes SQL](#liste-des-requêtes-sql)
  - [Requêtes HTTP avec cURL (tests de l'API)](#requêtes-http-avec-curl-tests-de-lapi)
    - [Progression typique des évènements pour un client de l'API](#progression-typique-des-évènements-pour-un-client-de-lapi)
    - [Partie authentification pour le gestionnaire de site](#partie-authentification-pour-le-gestionnaire-de-site)


## Conception de l'API

Nous reprenons la démarche générale, proposée par [Leonard Richardson](https://www.oreilly.com/pub/au/2556) et [Sam Ruby](https://en.wikipedia.org/wiki/Sam_Ruby)

1. **Déterminer** l'ensemble de données
2. **Décomposer** l'ensemble de données en ressource

**Pour chaque type de ressource**:

3. **Nommer** les ressources avec des URI
4. **Implémenter** un sous-ensemble de l'interface uniforme (GET, POST, DELETE, PUT)
5. **Étudier** la ou les représentations acceptées par les clients
6. **Concevoir** la ou les représentations à mettre à disposition des clients
7. **Intégrer** la ressource parmi celles qui existent déjà, en utilisant des hypermédias
8. **Envisager** la progression typique des évènements: qu'est-ce qui est censé se produire ? [Le flux de contrôle standard comme le protocole de publication Atom](https://www.ibm.com/docs/fr/integration-designer/8.5.5?topic=formats-atom-feed-format) peut aider.
9. **Considérer** les cas d'erreurs: qu'est-ce qui peut mal se passer ? Encore une fois, les flux de contrôle standard peuvent aider.

### 1. Déterminer l'ensemble des données

Commençons par un [dictionnaire des données](https://www.univ-constantine2.dz/CoursOnLine/Benelhadj-Mohamed/co/grain3_2.html)

Légende:

- AN : alphanumérique
- N: numérique
- A: alphabétique
- D: Date (et datetime)
- B: Booléen


|  Code 	| Désignation  	| Type  	|  Taille (nombre de caractères ou de *bytes* (octets)) 	| Remarque  	| Obligatoire |
|---	|---	|---	|---	|---	|---	|
|   `pseudo`	|  L'identifiant d’un utilisateur 	|   AN	|   12	|    Identifie de manière *unique* l’utilisateur	| Oui |
|   `description`	|  Un texte court qui décrit le concert, son contexte 	|   AN	|   1000	|   	| Non |
|   `artist_name`	|   Le nom de l'artiste qui se produit lors du concert	|   AN	|  50 	|   	|Oui |
|   `music_style`	|   Style musical de l'artiste	|   AN	|  50 	|  Ne peut prendre qu'un ensemble fini de valeurs (Rock, Rap, Classique, Jazz, Pop)	|Oui |
|   `date_start`	|   Date et horaire du concert	|  D 	|   20	|  Au format `YYYY-mm-dd HH:mm:ss` (et TimeZone)	|Oui |
|   `date_booking`	|   Date à laquelle l’utilisateur réserve sa place	|  D 	|   20	|   Attention, ce n'est pas la date à laquelle iel confirme la réservation.	|Oui |
|   `location`	|  Lieu, salle où se déroule le concert  	|   AN	|   120	|   	|Oui |
|   `nb_seats`	|  Le nombre de places disponibles à la réservation pour un concert  	|   N	| 	| Doit être positif  	|Oui |
|   `statut`*	|  État d’une réservation. 3 valeurs possibles : `À confirmer`, `Confirmée` ou `Annulée`  	|   N	|   14	|  Lorsqu’une réservation est créée, elle a par défaut le statut `to_confirm`. Elle doit ensuite être confirmée par l'utilisateur. Un utilisateur qui a confirmé sa réservation ne peut plus l’annuler ! 	|Oui |
|   `to_confirm`	|  Statut d’une réservation en attente de confirmation, valeur `À confirmer`  	|   A	|   14	|   Ce statut peut passer à `to_confirm` ou `canceled`	|Oui |
|   `confirmed`	|  Statut d’une réservation confirmée, valeur `Confirmée`  	|   A	|   14	|   Ne peut s’appliquer que sur un statut dans l’état `to_confirm`. Cet état ne peut plus changer par la suite	|Oui |
|   `canceled`	|  Statut d’une réservation annulée , valeur `Annulée` 	|   A	|   14	|   Ce statut ne peut plus changer par la suite	|Oui |
|   `is_admin`	| Détermine si l'utilisateur du système est administrateur (gestionnaire)  	|   B	|   14	|   Vrai si l'utilisateur est l'administrateur, faux sinon. Le gestionnaire a un rôle administrateur du système (et non de la base de données !)	|Oui |
|   `id_concert`	|  L'identifiant d’un concert 	|   N	|  Entier encodé sur 64 bits 	|    Identifie de manière *unique* un concert	| Oui |
|   `id_reservation`	|  L'identifiant d’une réservation 	|   N	|  Entier encodé sur 64 bits 	|    Identifie de manière *unique* une réservation	| Oui |


>* le mot *status* est un mot-clef réservé par MySQL. On utilise donc le mot français *statut* ici.

### 2. **Décomposer** l'ensemble de données en ressources

Décomposons ces données en ressources :

- *Les liste des concerts à venir* 
- *Les informations sur un concert* 
- *La réservation d'une place de concert*
- *La liste des réservations pour un concert*

> Ces ressources nous permettront de créer le schéma de la base de données également. Les utilisateurs **ne sont pas** une ressource, ce ne sont pas des informations exposées par le système !

### 3. **Nommer** les ressources avec des URI

- *Les liste des concerts à venir* : `/concerts`, avec la variation `/concerts?order-by=date&sort=desc,asc` pour ordonner la liste par date (bonus car non demandé)
- *Les informations sur un concert*  : `/concerts/{id-concert}`
- *La réservation d'une place de concert* : `/concerts/{id-concert}/reservations/{id-reservation}`
- *La liste des réservations pour un concert* : `/concerts/{id-concert}/reservations`

### 4. **Implémenter** un sous-ensemble de l'interface uniforme (`GET`, `POST`, `DELETE`, `PUT`) pour chaque ressource


- *Les liste des concerts à venir* : GET
- *Les informations sur un concert*  : GET
- *La réservation d'une place de concert* : GET, DELETE, PUT
- *La liste des réservations pour un concert* : POST, GET (authentifié)

> `GET /concerts/{id}/reservations` est protégée, seul le gestionnaire du site pourra lister les réservations effectuées pour un concert (et donc la liste des pseudos des utilisateurs).

### Récapitulatif

| Ressource  | URL  | Méthodes HTTP  | Paramètres d'URL (variations)  | Commentaires  |
|---|---|---|---|---|
| *Les liste des concerts à venir*  | `/concerts`  | GET  |  `order-by=date&sort=desc,asc` | Seuls les concerts *à venir* sont affichés, complets ou non  |
| *Les informations sur un concert* | `/concerts/{id-concert}`  |  GET | X  |   |
| *La réservation d'une place de concert*  | `/concerts/{id-concert}/reservations/{id-reservation}`  | GET, DELETE, PUT  | X  | Ne doit être accessible qu’au propriétaire de la réservation |
| *La liste des réservations pour un concert*  | `/concerts/{id-concert}/reservations`  | POST, GET  | X  | GET est réservé au gestionnaire du site  |

### 5. **Étudier** la ou les représentations acceptées par les clients

L'API renverra des données au format `application/hal+json`, en suivant la spécification [HAL](https://datatracker.ietf.org/doc/html/draft-kelly-json-hal-08)

On définit ici les représentations des ressources envoyées par le serveur au client.

#### Ressource *Les concerts à venir* `/concerts` : 

Schéma type

~~~JSON
{
     "_links": {
       "self": { "href": "/concerts" },
     },
     "_embedded": {
       "concerts": [{
           "_links": {
             "self": { "href": "/concerts/1" },
           },
            "date_start": '2023-02-17 21:00:00',
            "location": "Rennes, Salle de la Cité",
            "artist": "Eels",
         },{
           "_links": {
             "self": { "href": "/concerts/2" },
           },
            "date_start": '2023-06-22 20:30:00',
            "location": "Nantes, Stéréolux",
            "artist": "Cat Stevens",
         }]
     },
     "nbConcerts": 2
   }
~~~

> La ressource a deux ressources "embarquées" qui sont les "concerts", sous la clef [`_embeded`](https://datatracker.ietf.org/doc/html/draft-kelly-json-hal-08#section-4.1.2). On donne ici seulement les informations essentielles sur chaque concert. La ressource "Liste des concerts à venir" a pour propriété propre le nombre total de concerts à venir.

#### Ressource *Informations sur un concert* `/concerts/{id}` 

Schéma type

~~~JSON
{
     "_links": {
       "self": { "href": "/concerts/1" },
       "reservation" : {"href" : "/concerts/1/reservations"}
     },
    "id": 1,
    "date_start": '2023-02-17 21:00:00',
    "nb_seats": 400,
    "nb_seats_available": 250,
    "location": "Rennes, Salle de la Cité",
    "artist": "Eels",
    "music_style" : "Rock",
    "description": "Lore ipsum" 
}
~~~

#### Ressource *Réservation d'une place de concert* `/concerts/{id}/reservations`

Lister les réservations d'un concert : `GET /concerts/{id}/reservations`

~~~JSON
{
     "_links": {
       "self": { "href": "/concerts/1/reservations" },
       "concert" : {"href" : "/concerts/1"}
     },
     "_embedded" : 
        "reservations": [{
            "pseudo" : "john",
            "statut" : "À confirmer"
        },
        {
            "pseudo" : "eve44",
            "statut" : "Confirmée"
        },
     ],
     "nbReservations": 2,
}
~~~

>Cette ressource n'est accessible qu'au gestionnaire du site !

Effectuer une réservation `POST /concerts/{id}/reservations`

~~~JSON
{
     "_links": {
       "self": { "href": "/concerts/1/reservations" },
       "concert": { "href": "/concerts/1" },
       "confirm": { "href": "/concerts/1/reservations" },
       "cancel": { "href": "/concerts/1/reservations" },
     },
     "_embedded" : 
        "concert": {
            "location": "Rennes, Salle de la Cité",
            "artist": "Eels",
            "date_start": '2023-02-17 21:00:00',
        },
     ],
     "date_booking": '2023-01-03 17:32:22'
     "pseudo": "john",
     "statut": "À confirmer",
}
~~~

Annuler une réservation : `DELETE /concerts/{id}/reservations`

>Même schéma que précédemment

Confirmer une réservation : `PUT /concerts/{id}/reservations`

>Même schéma que précédemment

>Ici, sous la clef `_links` on indique les ressources connexes, notamment les liens pour confirmer ou annuler la réservation. Vous remarquerez que ce sont les mêmes que `self`, alors pourquoi les mettre ? Pour indiquer à l'agent qui consomme l'API les actions possibles (on appelle ça le [link relation type](https://datatracker.ietf.org/doc/html/rfc5988#section-4), comme le contenu d'une balise a HTML). On n'indique pas la méthode HTTP, car on sait qu'on se conforte à l'interface uniforme (GET, POST, PUT, DELETE). Une requête `OPTIONS` sur la ressource indiquera à l'agent les verbes autorisés. Ici on a GET, POST, PUT et DELETE. GET est réservé pour lister les réservations d'un concert (route protégée), `POST` est utilisé pour effectuer une réservation. Il reste donc PUT et DELETE. DELETE va servir à annuler une réservation. Donc on peut facilement en déduire que PUT va confirmer la réservation. Si on a un doute, on peut toujours tester ! 

#### Ressource *S'authentifier* : `POST /login`

Schéma type :

~~~JSON
{
     "_links": {
       "self": { "href": "/login" },
       "concerts": { "href": "/concerts/" },
       "reservations": { "href": "/concerts/{id}/reservations", "templated": true },
     },
     "token": "XXXX.YYYYY.ZZZZZ",
}
~~~

### 6. **Concevoir** la ou les représentations à mettre à disposition des clients

Maintenant, il faut déterminer les représentations que les clients peuvent fabriquer et qui seront comprises par le serveur. Il faut définir la représentation pour :

- Une réservation
- Une authentification

Le client enverra sa représentation au format `application/x-www-form-urlencoded` (formulaire), soit de simples `clef=valeur` dans le corps de la requête HTTP.

#### Faire une réservation 

>pseudo requête HTTP

~~~HTTP
POST /concerts/1/reservations HTTP/1.1

pseudo=john
~~~

#### Confirmer une réservation 

>pseudo requête HTTP 

~~~HTTP
PUT /concerts/1/reservations HTTP/1.1

pseudo=john
~~~

#### Annuler une réservation 

>pseudo requête HTTP

~~~HTTP
DELETE /concerts/1/reservations HTTP/1.1

pseudo=john
~~~

### S'authentifier

>pseudo requête HTTP

~~~HTTP
POST /login HTTP/1.1

pseudo=ed
password=password
~~~

### 8. Envisager la progression typique des évènements

Scénario nominal (où tout se passe bien)

- Un utilisateur accède à la liste des concerts
- L'utilisateur repère un concert qui l'intéresse, accède aux détails sur le concert
- L'utilisateur décide de réserver le concert
- L'utilisateur confirme sa réservation

### 9. Envisager les cas d'erreurs

> Beaucoup de cas à envisager, en ai-je oublié ?

- L'utilisateur essaie d'effectuer une réservation pour un concert alors qu'il en a déjà une (confirmée) : le système doit rejeter la demande
- L'utilisateur essaie d'effectuer une réservation pour un concert alors qu'il en a déjà une (annulée) : le système doit autoriser la demande, il peut avoir changé d'avis
- Il n'y a plus de places disponibles pour le concert : le système doit rejeter toute demande de réservation tant qu'une réservation n'est pas annulée
- Un utilisateur essaie d'effectuer une réservation pour un concert déjà passé : le système doit rejeter la demande
- Un utilisateur essaie d'annuler une réservation confirmée : le système doit rejeter la demande (voir specs)
- Un utilisateur essaie de confirmer une réservation annulée : le système doit rejeter la demande (voir specs)


> Évidemment, nous n'abordons pas ici les points liés à la sécurité, étant donné qu'il n'y a pas de système d'authentification et donc d'autorisations sur le système ! (hormis pour le gestionnaire de site).

Prévoir ces cas permet notamment de s'assurer de l'idempotence des requête `POST` qui ne sont ni sûres ni idempotentes.

## Conception de la base de données relationnelle

D'après notre travail sur le dictionnaire des données et sur les ressources, on dégage 3 relations :

- `User: **pseudo**, is_admin`
- `Concert: **id_concert**,  artist_name, date_start, location, nb_seats, description, music_style`
- `Reservation: **id_concert**, **id_user**, **statut**, date_booking`

> Les attributs entre `*` sont les clés primaires des relations.

> Ces relations pourraient être étoffées et de nouvelles relations pourraient être ajoutées (Artist, Location, etc.)

### Conception de la base de données: du MCD au MPD

Voici un schéma UML du modèle conceptuel des données :

<img src="./diagramme-uml-MCD.svg" width="600px" alt="Diagramme UML du MCD">

Voici un schéma UML du modèle relationnel (traduction du modèle conceptuel (objet) dans le modèle relationnel) :

<img src="./diagramme-uml-ModeleRelationnel.svg" width="600px" alt ="Diagramme UML du Modèle relationnel des données">

De ce travail, nous en déduisons le niveau physique, et [le script SQL (pour MySQL ici)](./scripts-sql/schema.sql).

~~~SQL
DROP DATABASE IF EXISTS ticketing;
CREATE DATABASE ticketing CHARACTER SET='utf8_general_ci';

USE ticketing

DROP TABLE IF EXISTS Reservation;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Concert;

CREATE TABLE IF NOT EXISTS Concert(
    -- BIGINT est encodé sur 8 bytes (2^{64} - 1)
    id_concert BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nb_seats INT NOT NULL,
    date_start DATETIME NOT NULL,
    location TEXT NOT NULL,
    artist VARCHAR(120) NOT NULL,
    music_style ENUM('Rock','Pop','Rap') NOT NULL,
    description TEXT NOT NULL,
    CONSTRAINT ck_nb_seats CHECK (nb_seats > 0)
);

-- Remarque: en pratique on évite d'utiliser une clef avec un type CHAR ou VARCHAR pour des questions de performances (on préférera un entier)
CREATE TABLE IF NOT EXISTS User(
    pseudo CHAR(12) NOT NULL PRIMARY KEY,
    is_admin BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS Reservation(
    id_concert BIGINT UNSIGNED NOT NULL,
    id_user CHAR(12) NOT NULL,
    -- le mot 'status' est un mot réservé par MySQL, on utilise donc 'statut' ici
    statut ENUM('to_confirm','confirmed','canceled') NOT NULL,
    date_booking DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_reservation PRIMARY KEY(id_concert, id_user, statut),
    CONSTRAINT fk_reservation_is_for_concert FOREIGN KEY (id_concert) REFERENCES Concert(id_concert),
    CONSTRAINT fk_reservation_is_made_by_user FOREIGN KEY (id_user) REFERENCES User(pseudo)
);
~~~


> Préférez [consulter directement le script](./scripts-sql/schema.sql) qui est certain d'être mis à jour, contrairement à cet exemple.

Créer le schéma de la base 

~~~bash
mysql -uroot -p -h127.0.0.1 -P5002 < documentation/scripts-sql/schema.sql
~~~

Insérer le jeu de données test

~~~bash
mysql -uroot -p -h127.0.0.1 -P5002 < documentation/scripts-sql/dataset.sql
~~~

### Utilisateurs MySQL

MySQL vient avec deux utilisateurs : `root` et `user`. Vous devriez utiliser `user` avec des privilèges restreints (`SELECT, INSERT, UPDATE`) sur la base `ticketing`. Pensez à ajouter les privilèges de `user` sur la base `ticketing` ou à créer un nouvel user dédié à l'utilisation de cette base par le système.

~~~SQL
# ou via Adminer
GRANT SELECT, INSERT, UPDATE ON ticketing.* TO 'user'@'%';
~~~

### Liste des requêtes SQL

~~~SQL
-- La liste des concerts à venir, complets ou non avec le nombre de réservations
SELECT c.id_concert, location, artist, date_start, nb_seats, COUNT(*) as nb_reservations 
FROM Concert c 
LEFT JOIN Reservation r 
ON c.id_concert=r.id_concert 
WHERE (r.statut != 'cancelled' OR r.statut IS NULL) AND c.date_start > CURDATE() 
GROUP BY (c.id_concert);

-- Le détail d'un concert avec le nombre de places restantes
SELECT c.id_concert, location, artist, music_style, date_start, nb_seats, description, COUNT(*) as nb_reservations 
FROM Concert c 
LEFT JOIN Reservation r 
ON c.id_concert = r.id_concert 
WHERE (r.statut != 'cancelled' OR r.statut IS NULL) AND c.id_concert = ? AND c.date_start > CURDATE() 
GROUP BY (c.id_concert);

-- Récupérer la réservation à confirmer d'un user pour un concert donné
SELECT pseudo, date_booking 
FROM User u 
INNER JOIN Reservation r 
ON u.pseudo = r.id_user 
WHERE id_concert= ? 
AND r.statut = 'to_confirm' 
AND u.pseudo = ?;

-- Récupérer le nombre de places disponibles pour un concert donné (avec requête imbriquée)
SELECT c.nb_seats - (SELECT COUNT(*) FROM Concert c INNER JOIN Reservation r on c.id_concert = r.id_concert WHERE r.statut != 'canceled' AND c.id_concert = ?) 
FROM Concert c WHERE c.id_concert = ?
~~~

> Conseil : lorsque vous développez l'API, ouvrez une session MySQL pour tester vos requêtes *avant* de les mettre dans votre code.

## Requêtes HTTP avec cURL (tests de l'API)

### Progression typique des évènements pour un client de l'API

~~~bash
# Variable bash pour stocker le nom de domaine (a adapter à vos besoins)
baseURL=localhost:5001
# Arrivée sur l'API
curl $baseURL
# Consulter les concerts à venir
curl $baseURL/concerts
# Consulter les concerts à venir avec filtre par date 
# (attention à bien mettre l'URL entre guillemets pour échapper le caractère '&')
curl "$baseURL/concerts?order-by=date&sort=desc"
# Consulter le détail d'un concert
curl $baseURL/concerts/3
# Effectuer une réservation pour un concert
curl -X POST -d "pseudo=john" $baseURL/concerts/3/reservations
# Confirmer la réservation
curl -X PUT -d "pseudo=john" $baseURL/concerts/3/reservation
# Ou Annuler la réservation
curl -X DELETE -d "pseudo=john" $baseURL/concerts/3/reservation
~~~

### Partie authentification pour le gestionnaire de site

Modifier le schéma pour ajouter la colonne `password` à la table `User` :

~~~bash
mysql -uroot -p -h127.0.0.1 -P5002 -Dticketing < documentation/scripts-sql/addpassword.sql
~~~

Enfin, effectuer les requêtes HTTP suivantes :

~~~bash
# S'authentifier et récupérer un token (a effectuer sur une connexion sécurisée par TLS, site en https)
curl -X POST -d"pseudo=ed&password=astrongpassword" $baseURL/login
# Accéder à la ressource protégée avec son token
token={le token récupéré}
# Demander la ressource protégée avec le token placé dans le header 'Authorization: Bearer'
curl $baseURL/concerts/1/reservations -H "Authorization: Bearer $token"
~~~