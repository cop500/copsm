-- Script pour vérifier et corriger la contrainte de volet
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la contrainte actuelle sur le champ volet
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'evenements'::regclass 
  AND contype = 'c';

-- 2. Voir les valeurs autorisées pour le champ volet
SELECT DISTINCT volet FROM evenements WHERE volet IS NOT NULL;

-- 3. Vérifier la structure de la table evenements
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'evenements' 
  AND column_name = 'volet';

-- 4. Si nécessaire, modifier la contrainte pour accepter les valeurs du template
-- (À exécuter seulement si les valeurs actuelles ne correspondent pas)

-- Option A: Supprimer et recréer la contrainte avec les bonnes valeurs
-- ALTER TABLE evenements DROP CONSTRAINT IF EXISTS check_volet;
-- ALTER TABLE evenements ADD CONSTRAINT check_volet 
--   CHECK (volet IN ('information_communication', 'accompagnement_projets', 'assistance_carriere', 'assistance_filiere'));

-- Option B: Ajouter une valeur par défaut si le volet est NULL
-- ALTER TABLE evenements ALTER COLUMN volet SET DEFAULT 'information_communication';
