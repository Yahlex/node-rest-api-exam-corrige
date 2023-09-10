# Corrigé de l'examen *API RESTful*

L'implémentation (avec node.js/Express/MySQL) du sujet d'examen du module API *RESTful*.

- [Corrigé de l'examen *API RESTful*](#corrigé-de-lexamen-api-restful)
  - [Sujet (Spécifications du système)](#sujet-spécifications-du-système)
  - [Documentation sur la conception et les choix d'implémentation](#documentation-sur-la-conception-et-les-choix-dimplémentation)
  - [Prérequis](#prérequis)
  - [Lancer le projet avec Compose](#lancer-le-projet-avec-compose)
  - [Base de données](#base-de-données)
    - [Client graphique Adminer pour la base de données MySQL](#client-graphique-adminer-pour-la-base-de-données-mysql)
    - [Créer la base de données test](#créer-la-base-de-données-test)
  - [Tester l'installation](#tester-linstallation)
  - [Tester l'API](#tester-lapi)
  - [Documentation de l'API avec Swagger](#documentation-de-lapi-avec-swagger)
  - [Installer et servir de nouvelles dépendances](#installer-et-servir-de-nouvelles-dépendances)
  - [Remarques](#remarques)
  - [Arrêter le projet](#arrêter-le-projet)
  - [Déboguer](#déboguer)
  - [Librairies JS notables installées via npm](#librairies-js-notables-installées-via-npm)
  - [Autorisations gérées avec JWT](#autorisations-gérées-avec-jwt)
  - [Ressources](#ressources)
    - [HTTP](#http)
    - [Docker](#docker)
    - [Express](#express)
    - [Swagger](#swagger)
    - [SGBDR](#sgbdr)


## Sujet (Spécifications du système)

On désire mettre en ligne un service de réservation de billets de concert. Le service ne gère pas de base de données des utilisateurs : un·e utilisateur·ice est simplement identifié·e par un pseudo au moment de la réservation.

Les cas d'utilisation définis sont :

1. L'utilisateur·ice consulte la liste des concerts disponibles
2. L'utilisateur·ice consulte les informations d'un concert
3. L'utilisateur·ice réserve une place pour un concert avec un pseudo
4. L'utilisateur·ice annule sa réservation
5. L'utilisateur·ice confirme sa réservation
6. Le gestionnaire du site consulte la liste des réservations confirmées pour un concert.

Attention, **un utilisateur qui a confirmé sa réservation ne peut plus l'annuler !**

> Le sujet original est consultable sur le site de [David Gayerie](https://gayerie.dev/epsi-poe-201703/web-services/07_rest.html#contraintes_rest)

## Documentation sur la conception et les choix d'implémentation

[Accéder à la documentation du projet.](./documentation.md)

## Prérequis

- Installer [node.js](https://nodejs.org/en)
- Installer [Docker](https://www.docker.com/get-started/) et [Compose](https://docs.docker.com/compose/)
- Clôner le dépôt et se placer à la racine du projet

>N'oubliez pas de supprimer le dossier `.git` si vous désirez créer votre propre dépôt à partir des sources

~~~
rm -R .git
git init
~~~

## Lancer le projet avec Compose

Créer un fichier d'environnement `.env` local à partir du fichier `.env.dist`

~~~
cp .env.dist .env
~~~

> Vous pouvez modifier les variables d'environnement si vous le souhaitez (des valeurs par défaut sont fournies)

Installer les dépendances de l'application node et générer la doc swagger

~~~
pushd api
npm install
npm run swagger-autogen
popd
~~~

Démarrer le projet

~~~
docker-compose up -d
~~~

## Base de données

L'`host` de la base de données est le nom du service sur le réseau du projet crée par Docker, soit `db`.

Se connecter avec le client mysql

~~~
mysql -uroot -proot -Dmydb -h127.0.0.1 -P5002
~~~

Pour exécuter un script SQL en *Batch mode*

~~~
mysql -uroot -proot -Dmydb -h127.0.0.1 -P5002 < script.sql
~~~

>Penser à modifier la valeur du port si vous l'avez changé dans le `.env`

### Client graphique Adminer pour la base de données MySQL

Se rendre à l'url [http://localhost:5003](http://localhost:5003) et se connecter avec les credentials *root* (login *root* et mot de passe *root* par défaut)

### Créer la base de données test

Se placer à la racine du projet. Créer le schéma de la base de données en *batch mode* :

~~~
mysql -uroot -proot -h127.0.0.1 -P5002 < scripts-sql/schema.sql
~~~

Insérer le jeu de données test :

~~~
mysql -uroot -proot -h127.0.0.1 -P5002 < scripts-sql/dataset.sql
~~~

Ou utiliser Adminer.

## Tester l'installation

**Il se peut que le serveur MySQl mette un peu de temps à démarrer, résultant en une erreur (`ECONNREFUSED`) de la tentative de connexion de l'application node qui est déjà active. Il suffit de sauvegarder un fichier source js (par exemple `app.js`) pour réinitialiser l'état de l'application et de la connexion à MySQL**


Se rendre à l'URL [localhost:5001/concerts](http://localhost:5001), ou tester (avec [curl](https://curl.se/))

~~~
# API (JSON) : lister les utilisateur·ices
curl --include localhost:5001/concerts
~~~

## Tester l'API

Se rendre à l'URL /doc pour accéder à la documentation de l'API générée avec Swagger ou utiliser directement curl

~~~
curl -X <verbe HTTP> -i <URI> -d <formulaire>
~~~

Par exemple, pour effectuer une réservation

~~~
curl -X POST -i localhost:5001/concerts/1/reservation -d 'pseudo=jenny'
~~~

## Documentation de l'API avec Swagger

Générer automatiquement la documentation de vos routes avec le module Swagger. Dans le dossier `api` : 

~~~
node swagger.js
~~~

ou

~~~
npm run swagger-autogen
~~~

Se rendre à l'URL `/doc` pour accéder à l'UI de Swagger

## Installer et servir de nouvelles dépendances

- Stopper les containers avec Compose
- À la racine de l'application (`api/`), *installer* les dépendances désirées via `npm`
- Reconstruire le conteneur `api`
- Relancer les containers avec Compose

~~~
docker-compose down
pushd api
#Installer les dépendances
npm install --save votre-dependance
popd
docker-compose build api
docker-compose up -d
~~~

## Remarques

- Actuellement le projet utilise la libraire [mysql](https://github.com/mysqljs/mysql) node.js. Cette libraire est bien mais elle nous force à se retrouver dans un *callback hell*, car elle n'utilise pas l'[API des Promesses](https://developer.mozilla.org/fr/docs/Web/JavaScript/Guide/Using_promises). Il pourrait être intéressant soit de passer à [mysql2](https://www.npmjs.com/package/mysql2) (évolution du driver mysql, avec une gestion des promesses et de meilleures performances), soit d'utiliser l'ORM [sequlezise](https://sequelize.org/) (bonus 2 de l'examen)
- La correction se concentre sur la conception de l'API et sur son interface (représentations échangées et respect des contraintes REST). Il y a beaucoup à faire concernant le code applicatif (factorisation, élimination des callbacks hell, création de nombreuses fonctions, etc.) Cette tâche est laissée en exercice.
- Vous l'aurez compris, *cette solution (et les specs !) ne se concentre pas sur les aspects de sécurité* pour des raisons pédagogiques. Par exemple, *il ne faut jamais stocker les mots de passe en clair en base de données* ! De nombreux points d'amélioration sont laissés en guise d'exercice. 

## Arrêter le projet

~~~
docker-compose down
~~~

## Déboguer

Pour débuger votre API, ne pas hésiter à *consulter les logs* de votre conteneur docker qui héberge l'application node.js :

~~~
docker logs -f billeterie-api
~~~

[Voir la documentation officielle de Docker](https://docs.docker.com/engine/reference/commandline/logs/) pour consulter plus d'options sur les logs.

## Librairies JS notables installées via npm

- [bodyParser](https://www.npmjs.com/package/body-parser), un parser du corps de requête pour les applications node. On s'en sert pour parser les représentations envoyées par le client dans nos contrôleurs avec l'instruction `app.use(bodyParser.urlencoded({ extended: true }));`
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken), une implémentation JavaScript du standard JSON Web Token, voir [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
- [mysql](https://github.com/mysqljs/mysql), driver node.js pour MySQL

## Autorisations gérées avec JWT

>JSON Web Token (JWT) is a compact, URL-safe means of *representing claims to be transferred between two parties* (Source: RFC7519)

Pour **autoriser** (et donc authentifier) l'utilisateur à interagir avec les ressources, on utilise un JSON Web Token. Implémentée dans le projet avec le package [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken).

## Ressources

### HTTP

- [La liste des codes statut HTTP (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

### Docker

- [Image Docker Node](https://hub.docker.com/_/node)
- [Dockerizing a Node.js web app](https://nodejs.org/en/docs/guides/nodejs-docker-webapp)
- [Nodemon](https://www.npmjs.com/package/nodemon), outil de développement d'applications node.js pour redémarrer le process du serveur web automatiquement lorsque les sources changent

### Express

- [Générateur d’applications Express](https://expressjs.com/fr/starter/generator.html), générer un projet pour démarrer
- [Routage](https://expressjs.com/fr/guide/routing.html), la documentation sur le routage d'Express
- [Pug](https://pugjs.org/api/getting-started.html), moteur de templates JavaScript installé par défaut avec Express

### Swagger

- [Swagger UI](https://github.com/swagger-api/swagger-ui), documenter une web API RESTful (même si elle devrait être *par définition* autodocumentée et *autodescriptive*)
- [Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express), module node.js pour générer la documentation de l'API avec Express
- [Swagger auto-gen](https://www.npmjs.com/package/swagger-autogen), module de génération *automatique* de la documentation de l'API dans une application node.js/Express. Voir notamment la documentation pour documenter automatiquement les endpoints (résumé, description, paramètres)
- [Swagger auto-gen: décrire des paramètres de formulaire POST](https://www.npmjs.com/package/swagger-autogen#parameters)
- [OpenAPI Specification](https://github.com/OAI/OpenAPI-Specification), un standard de description d'une web API compatible avec REST

### SGBDR

- [MySQL Docker Image, quick reference](https://hub.docker.com/_/mysql/)
- [mysql js](https://www.npmjs.com/package/mysql), le driver node.js pour les SGBDR MySQL
- [mysql js, escaping output !](https://www.npmjs.com/package/mysql#escaping-query-values)
- [Sequelize, Getting Started](https://sequelize.org/docs/v6/getting-started/), Sequelize, un ORM pour node.js