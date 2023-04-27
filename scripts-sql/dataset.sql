-- Insertion d'un jeu de données test
-- Insérer les données en batchmode avec la commande mysql -uroot -proot -h127.0.0.1 -P5002 < ../data.sql
-- Format standard de la chaine de caractère d'un datetime 'YYYY-mm-dd hh:mm:ss'
USE mydb;

INSERT INTO
    Concert (artiste, nb_places, date_debut, lieu, description)
VALUES
    ('Eels', 1000, '2023-12-24 21:00:00', 'Rennes, Salle de la Cité', 'Lore ipsum'),
    ('Cat Stevens', 750, '2024-01-17 19:00:00', 'Nantes, Stéréolux', 'Lore ipsum');


INSERT INTO
    Utilisateur (pseudo)
VALUES
    ('john'),
    ('eve44');