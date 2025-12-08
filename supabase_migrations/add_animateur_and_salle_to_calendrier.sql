-- ========================================
-- Migration combinée : Ajouter animateur_id et salle au calendrier collaboratif
-- ========================================
-- À exécuter dans Supabase SQL Editor
-- ========================================

-- 1. Ajouter la colonne animateur_id (optionnelle, peut être NULL)
ALTER TABLE calendrier_collaboratif
ADD COLUMN IF NOT EXISTS animateur_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Créer un index pour améliorer les performances des requêtes par animateur
CREATE INDEX IF NOT EXISTS idx_calendrier_animateur_id ON calendrier_collaboratif(animateur_id);

-- 3. Ajouter un commentaire pour documenter la colonne animateur_id
COMMENT ON COLUMN calendrier_collaboratif.animateur_id IS 'ID de l''utilisateur qui anime l''événement (peut être différent du créateur)';

-- 4. Ajouter la colonne salle (optionnelle, peut être NULL)
ALTER TABLE calendrier_collaboratif
ADD COLUMN IF NOT EXISTS salle TEXT;

-- 5. Créer un index pour améliorer les performances des requêtes par salle
CREATE INDEX IF NOT EXISTS idx_calendrier_salle ON calendrier_collaboratif(salle);

-- 6. Ajouter un commentaire pour documenter la colonne salle
COMMENT ON COLUMN calendrier_collaboratif.salle IS 'Nom de la salle où se déroule l''événement';

-- ========================================
-- Vérification : Vérifier que les colonnes ont été ajoutées
-- ========================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'calendrier_collaboratif'
  AND column_name IN ('animateur_id', 'salle')
ORDER BY column_name;

