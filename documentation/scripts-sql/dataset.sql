-- Insertion d'un jeu de données test
-- Insérer les données en batchmode avec la commande mysql -uroot -proot -h127.0.0.1 -P5002 < data.sql
-- Format standard de la chaine de caractère d'un datetime 'YYYY-mm-dd hh:mm:ss'
USE ticketing;

DELETE FROM
    User;

DELETE FROM
    Concert;

DELETE FROM
    Reservation;

-- Concerts
INSERT INTO
    Concert (
        artist,
        nb_seats,
        date_start,
        location,
        description,
        music_style
    )
VALUES
    (
        'Eels',
        1000,
        '2023-10-24 21:00:00',
        'Rennes, Salle de la Cité',
        'Eels est un groupe américain de rock, originaire de Los Angeles, en Californie',
        'Rock'
    ),
    (
        'Cat Stevens',
        750,
        '2024-01-17 19:00:00',
        'Nantes, Stéréolux',
        'Cat Stevens, est un chanteur, musicien (guitariste et claviériste) et auteur-compositeur-interprète britannique né le 21 juillet 1948 à Londres',
        'Songwriter'
    ),
    (
        'PNL',
        3500,
        '2024-03-20 21:00:00',
        'Rennes, Le Liberté',
        'PNL (sigle de Peace N’ Lovés) est un groupe de rap français composé de deux frères : Ademo et N.O.S',
        'Rap'
    );

-- Utilisateurs et gestionnaire de site 'ed'
INSERT INTO
    User (pseudo, is_admin)
VALUES
    ('john', 0),
    ('eve', 0),
    ('jenny', 0),
    ('ed', 1);

-- Reservations
INSERT INTO
    Reservation (id_concert, id_user, statut)
VALUES
    (1, 'john', 'to_confirm'),
    (1, 'john', 'canceled'),
    (1, 'eve', 'confirmed'),
    (2, 'john', 'confirmed');