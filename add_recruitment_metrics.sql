-- Script pour ajouter les métriques de recrutement aux événements
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter les nouveaux champs à la table evenements
ALTER TABLE evenements 
ADD COLUMN IF NOT EXISTS nombre_beneficiaires INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nombre_candidats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nombre_candidats_retenus INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS taux_conversion DECIMAL(5,2) DEFAULT 0.00;

-- 2. Ajouter des contraintes pour s'assurer que les valeurs sont cohérentes
ALTER TABLE evenements 
ADD CONSTRAINT check_beneficiaires CHECK (nombre_beneficiaires >= 0),
ADD CONSTRAINT check_candidats CHECK (nombre_candidats >= 0),
ADD CONSTRAINT check_candidats_retenus CHECK (nombre_candidats_retenus >= 0),
ADD CONSTRAINT check_candidats_retenus_max CHECK (nombre_candidats_retenus <= nombre_candidats);

-- 3. Créer une fonction pour calculer automatiquement le taux de conversion
CREATE OR REPLACE FUNCTION calculer_taux_conversion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nombre_candidats > 0 THEN
    NEW.taux_conversion = ROUND((NEW.nombre_candidats_retenus::DECIMAL / NEW.nombre_candidats::DECIMAL) * 100, 2);
  ELSE
    NEW.taux_conversion = 0.00;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer un trigger pour mettre à jour automatiquement le taux de conversion
DROP TRIGGER IF EXISTS trigger_calculer_taux_conversion ON evenements;
CREATE TRIGGER trigger_calculer_taux_conversion
  BEFORE INSERT OR UPDATE ON evenements
  FOR EACH ROW
  EXECUTE FUNCTION calculer_taux_conversion();

-- 5. Vérifier que les champs ont été ajoutés
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'evenements' 
  AND column_name IN ('nombre_beneficiaires', 'nombre_candidats', 'nombre_candidats_retenus', 'taux_conversion')
ORDER BY column_name;

-- 6. Mettre à jour les événements existants avec des valeurs par défaut (optionnel)
-- UPDATE evenements 
-- SET nombre_beneficiaires = 0, nombre_candidats = 0, nombre_candidats_retenus = 0, taux_conversion = 0.00
-- WHERE nombre_beneficiaires IS NULL;
