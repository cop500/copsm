-- ========================================
-- Migration : Ajouter le champ salle au calendrier collaboratif
-- ========================================

-- Ajouter la colonne salle (optionnelle, peut être NULL)
ALTER TABLE calendrier_collaboratif
ADD COLUMN IF NOT EXISTS salle TEXT;

-- Créer un index pour améliorer les performances des requêtes par salle
CREATE INDEX IF NOT EXISTS idx_calendrier_salle ON calendrier_collaboratif(salle);

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN calendrier_collaboratif.salle IS 'Nom de la salle où se déroule l''événement';

