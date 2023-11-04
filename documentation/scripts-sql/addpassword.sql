-- Pour la question bonus, on ajoute une colonne password
ALTER TABLE User ADD COLUMN password VARCHAR(30) NULL;
-- On initialise le mot de passe du gestionnaire (admin) 'ed'
UPDATE User SET password='astrongpassword', is_admin=1 WHERE pseudo='ed';