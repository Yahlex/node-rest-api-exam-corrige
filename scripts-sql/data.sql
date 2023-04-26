-- Insertion d'un jeu de données test
-- Insérer les données en batchmode avec la commande mysql -uroot -proot -h127.0.0.1 -P5002 < ../data.sql
-- Format standard de la chaine de caractère d'un datetime 'YYYY-mm-dd hh:mm:ss'
USE mydb;

-- INSERT INTO
--     Concert (nom, nb_places, date_debut, nb_reservations)
-- VALUES
--     ('AAA', 100, '2023-12-24 21:00:00', 0),
--     ('BBB', 300, '2024-01-17 19:00:00', 0),
--     ('CCC', 50, '2023-10-05 20:00:00', 0);


INSERT INTO
    Utilisateur (pseudo)
VALUES
    ('foo'),
    ('bar');