-- Script pour ajouter les champs pôle et filière à la table evenements
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajouter les colonnes pole_id et filiere_id à la table evenements
ALTER TABLE evenements 
ADD COLUMN IF NOT EXISTS pole_id UUID REFERENCES poles(id),
ADD COLUMN IF NOT EXISTS filiere_id UUID REFERENCES filieres(id);

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_evenements_pole_id ON evenements(pole_id);
CREATE INDEX IF NOT EXISTS idx_evenements_filiere_id ON evenements(filiere_id);

-- Vérifier la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'evenements' 
  AND column_name IN ('pole_id', 'filiere_id')
ORDER BY column_name;
