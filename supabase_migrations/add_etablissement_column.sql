-- Ajouter la colonne 'etablissement' à la table enquete_reponses
ALTER TABLE enquete_reponses 
ADD COLUMN IF NOT EXISTS etablissement VARCHAR(255);

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN enquete_reponses.etablissement IS 'Nom de l''établissement pour la poursuite d''études';

