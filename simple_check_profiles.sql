-- ========================================
-- Script simple pour vérifier la table profiles
-- ========================================

-- 1. Vérifier la structure de la colonne role
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- 2. Vérifier les valeurs actuelles dans la colonne role
SELECT DISTINCT role FROM profiles;

-- 3. Vérifier les contraintes existantes
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c';
