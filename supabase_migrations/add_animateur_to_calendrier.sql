-- ========================================
-- Migration : Ajouter le champ animateur_id au calendrier collaboratif
-- ========================================

-- Ajouter la colonne animateur_id (optionnelle, peut être NULL)
ALTER TABLE calendrier_collaboratif
ADD COLUMN IF NOT EXISTS animateur_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances des requêtes par animateur
CREATE INDEX IF NOT EXISTS idx_calendrier_animateur_id ON calendrier_collaboratif(animateur_id);

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN calendrier_collaboratif.animateur_id IS 'ID de l''utilisateur qui anime l''événement (peut être différent du créateur)';

