-- Script pour corriger le schéma de la table evenements
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure actuelle de la table evenements
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'evenements' 
ORDER BY ordinal_position;

-- 2. Vérifier si les colonnes pole_id et filiere_id existent
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'evenements' 
  AND column_name IN ('pole_id', 'filiere_id', 'nombre_beneficiaires', 'nombre_candidats', 'nombre_candidats_retenus', 'taux_conversion')
ORDER BY column_name;

-- 3. Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE evenements 
ADD COLUMN IF NOT EXISTS pole_id UUID REFERENCES poles(id),
ADD COLUMN IF NOT EXISTS filiere_id UUID REFERENCES filieres(id),
ADD COLUMN IF NOT EXISTS nombre_beneficiaires INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nombre_candidats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nombre_candidats_retenus INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS taux_conversion DECIMAL(5,2) DEFAULT 0.00;

-- 4. Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_evenements_pole_id ON evenements(pole_id);
CREATE INDEX IF NOT EXISTS idx_evenements_filiere_id ON evenements(filiere_id);

-- 5. Vérifier que les nouveaux types d'événements existent
SELECT * FROM event_types WHERE code IN ('talent_acquisition', 'sourcing', 'hiring_drive', 'speed_hiring') ORDER BY nom;

-- 6. Ajouter les nouveaux types d'événements s'ils n'existent pas
INSERT INTO event_types (nom, code, description, couleur, icon, actif, created_at, updated_at) 
VALUES
('Talent Acquisition', 'talent_acquisition', 'Événements de recrutement et acquisition de talents', '#3B82F6', 'users', true, NOW(), NOW()),
('Sourcing', 'sourcing', 'Événements de sourcing et prospection de candidats', '#10B981', 'search', true, NOW(), NOW()),
('HIRING DRIVE', 'hiring_drive', 'Campagnes de recrutement intensives', '#F59E0B', 'zap', true, NOW(), NOW()),
('Speed Hiring', 'speed_hiring', 'Recrutement rapide et événements express', '#EF4444', 'clock', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 7. Vérifier le nombre total d'événements
SELECT COUNT(*) as total_evenements FROM evenements WHERE actif = true;

-- 8. Vérifier les événements avec leurs volets
SELECT id, titre, volet, pole_id, filiere_id, nombre_beneficiaires, nombre_candidats, nombre_candidats_retenus, taux_conversion 
FROM evenements 
WHERE actif = true 
ORDER BY created_at DESC 
LIMIT 10;
