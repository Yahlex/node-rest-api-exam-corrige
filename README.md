# Application de réservation de billets de concerts

Suggestion de correction de l'exercice 2 (conception) et l'exercice 4 (implémentation).

Le projet est réalisé en partant du [starterpack (Node.js, MySQL, Adminer)](https://github.com/paul-schuhm/starterpack-api-nodejs).

- [Application de réservation de billets de concerts](#application-de-réservation-de-billets-de-concerts)
  - [Énoncé](#énoncé)
    - [Conception](#conception)
    - [Implémentation](#implémentation)
  - [Documentation](#documentation)
  - [Lancer le projet](#lancer-le-projet)
  - [Générer la documentation de l'API avec swagger-autgoen](#générer-la-documentation-de-lapi-avec-swagger-autgoen)
  - [Remarques](#remarques)
  - [Arrêter le projet](#arrêter-le-projet)
  - [Dépendances notables du projets](#dépendances-notables-du-projets)
  - [Autorisations gérées avec JWT](#autorisations-gérées-avec-jwt)
  - [Ressources](#ressources)
    - [HTTP](#http)
    - [Express](#express)
    - [Swagger](#swagger)
    - [SGBDR](#sgbdr)


## Énoncé

### Conception

On désire mettre en ligne un service de réservation de billets de concert. Le service ne gère pas de base de données des utilisateurs : un·e utilisateur·ice est simplement identifié·e par un pseudo au moment de la réservation.

Les cas d'utilisation définis sont :

1. L'utilisateur·ice consulte la liste des concerts disponibles
2. L'utilisateur·ice consulte les informations d'un concert
3. L'utilisateur·ice réserve une place pour un concert avec un pseudo
4. L'utilisateur·ice annule sa réservation
5. L'utilisateur·ice confirme sa réservation
6. Le gestionnaire du site consulte la liste des réservations confirmées pour un concert.

Attention, **un utilisateur qui a confirmé sa réservation ne peut plus l'annuler !**

**Décrire** une API Web RESTful **par des exemples de requêtes/réponses HTTP** permettant de réaliser les cas d'utilisation ci-dessus.

1. Déterminer l'ensemble de données
2. Décomposer l'ensemble de données en ressources
3. Pour chaque ressource :
  1. La nommer avec des URI et préciser l'*archétype* de la ressource
  2. Implémenter un sous-ensemble de l'interface uniforme (GET, POST, DELETE, PUT)
  3. Concevoir la ou les représentations acceptées par les clients, en utilisant la spécification HAL.
  4. Concevoir la ou les représentations à mettre à disposition des clients (*formulaires*) sous la forme de pseudo requêtes HTTP de la forme
~~~bash
METHODE /login HTTP/1.1

clef=valeur
clef2=valeur2
~~~
4. Envisager la progression typique des évènements: qu'est-ce qui est censé se produire ? Définir les code retours pour chaque requête HTTP
5. Considérer les cas d'erreurs: qu'est-ce qui peut mal se passer ? 

### Implémentation

1. **Implémenter** [l'API de l'exercice 2](#exercice-2---design-dune-api-restful) avec node.js et Express.js. **Concevoir** le schéma de base de données et implémenter la base relationnelle.
2. *Bonus* : **Développer** un ensemble de *ressources* pour qu'un agent *humain* puisse réaliser les cas d'utilisation exposés par l'API (via des pages web)

## Documentation

[Accéder à la documentation du projet](./documentation/documentation.md).

## Lancer le projet

~~~bash
cd api-reservation-billets-concerts
docker-compose up -d
curl localhost:5001 #test
~~~

Avec Adminer ou `mysql` exécuter les [scripts SQL préparés](./documentation/scripts-sql/) :

- [schema.sql](./documentation/scripts-sql/schema.sql) pour créer le schéma de la base
- [dataset](./documentation/scripts-sql/dataset.sql) pour insérer un jeu de données test


## Générer la documentation de l'API avec swagger-autgoen

Pour générer la documentation à partir des blocs commentaires swagger placé dans le code

~~~bash
pushd api
npm run swagger-autogen
popd api
~~~


## Remarques

- Actuellement le projet utilise la libraire [mysql2](https://github.com/mysqljs/mysql2) node.js. Il pourrait être intéressant  d'utiliser l'ORM [sequlezise](https://sequelize.org/)
- La correction se concentre sur la conception de l'API et sur son interface (représentations échangées et respect des contraintes REST). Il y a beaucoup à faire concernant le code applicatif (factorisation, création de nombreuses fonctions, etc.) Cette tâche est laissée en exercice.
- Vous l'aurez compris, *cette solution (et les specs !) ne se concentre pas sur les aspects de sécurité* pour des raisons pédagogiques. Par exemple, *il ne faut jamais stocker les mots de passe en clair en base de données* ! De nombreux points d'amélioration sont laissés en guise d'exercice. 

## Arrêter le projet

~~~
docker-compose down
~~~

## Dépendances notables du projets

En dehors d'express, le projet utilise les modules suivants :

- [body-parser](https://www.npmjs.com/package/body-parser), un parser du corps de requête pour les applications node. On s'en sert pour parser les représentations envoyées par le client dans nos contrôleurs avec l'instruction `app.use(bodyParser.urlencoded({ extended: true }));`
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken), une implémentation JavaScript du standard JSON Web Token, voir [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
- [mysql2](https://github.com/mysqljs/mysql2), driver node.js pour MySQL
- [swagger-autogen](https://www.npmjs.com/package/swagger-autogen), module de génération *automatique* de la documentation de l'API dans une application node.js/Express. Voir notamment la documentation pour documenter automatiquement les endpoints (résumé, description, paramètres)
  
## Autorisations gérées avec JWT

Pour **autoriser** (et donc authentifier) l'utilisateur à interagir avec les ressources, on utilise un JSON Web Token. Implémentée dans le projet avec le package [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken).

## Ressources

### HTTP

- [La liste des codes statut HTTP (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

### Express

- [Routage](https://expressjs.com/fr/guide/routing.html), la documentation sur le routage d'Express
- [Pug](https://pugjs.org/api/getting-started.html), moteur de templates JavaScript installé par défaut avec Express

### Swagger

- [Swagger UI](https://github.com/swagger-api/swagger-ui), documenter une web API RESTful (même si elle devrait être *par définition* auto-documentée et auto-descriptive)
- [Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express), module Node.js pour générer la documentation de l'API avec Express
- [Swagger auto-gen](https://www.npmjs.com/package/swagger-autogen), module de génération *automatique* de la documentation de l'API dans une application node.js/Express. Voir notamment la documentation pour documenter automatiquement les endpoints (résumé, description, paramètres)
- [Swagger auto-gen: décrire des paramètres de formulaire POST](https://www.npmjs.com/package/swagger-autogen#parameters)
- [OpenAPI Specification](https://github.com/OAI/OpenAPI-Specification), un standard de description d'une web API compatible avec les contraintes REST

### SGBDR

- [mysql js](https://www.npmjs.com/package/mysql), le driver node.js pour les SGBDR MySQL
- [mysql2 js](https://www.npmjs.com/package/mysql2), le driver node.js pour les SGBDR MySQL qui supporte l'API des promesses
- [mysql js, escaping output !](https://www.npmjs.com/package/mysql#escaping-query-values)
- [Sequelize, Getting Started](https://sequelize.org/docs/v6/getting-started/), Sequelize, un ORM pour node.js
