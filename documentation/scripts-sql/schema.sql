-- Script de création du schéma de la base de données relationnelles
-- Le schéma a été déduit lors de la phase d'analyse et avec l'usage du dictionnaire des données
-- Insérer les données en batchmode avec la commande mysql -uroot -proot -h127.0.0.1 -P5002 < schema.sql

DROP DATABASE IF EXISTS ticketing;
CREATE DATABASE ticketing CHARACTER SET utf8;

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
    music_style ENUM('Rock','Pop','Rap','Songwriter') NOT NULL,
    description TEXT NOT NULL,
    CONSTRAINT ck_nb_seats CHECK (nb_seats > 0)
);

-- Remarque: en pratique on évite d'utiliser une clef avec un type chaines de caractères pour des questions de performances (on préférera un entier)
CREATE TABLE IF NOT EXISTS User(
    pseudo CHAR(12) NOT NULL PRIMARY KEY,
    is_admin BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS Reservation(
    id_concert BIGINT UNSIGNED NOT NULL,
    id_user CHAR(12) NOT NULL,
    -- le mot status est un mot réservé par mysql, on utilise donc statut ici
    statut ENUM('to_confirm','confirmed','canceled') NOT NULL,
    date_booking DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_reservation PRIMARY KEY(id_concert, id_user, statut),
    CONSTRAINT fk_reservation_is_for_concert FOREIGN KEY (id_concert) REFERENCES Concert(id_concert),
    CONSTRAINT fk_reservation_is_made_by_user FOREIGN KEY (id_user) REFERENCES User(pseudo)
);