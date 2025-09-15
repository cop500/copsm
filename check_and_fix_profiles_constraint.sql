-- ========================================
-- Script pour vérifier et corriger la contrainte de la table profiles
-- ========================================

-- 1. Vérifier la structure de la table profiles
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- 2. Vérifier les contraintes existantes sur la colonne role
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c' 
AND pg_get_constraintdef(oid) LIKE '%role%';

-- 3. Vérifier les valeurs actuelles dans la colonne role
SELECT DISTINCT role FROM profiles;

-- 4. Si la contrainte existe et ne permet pas 'directeur', la supprimer et la recréer
-- ATTENTION: Exécutez d'abord les requêtes 1, 2 et 3 pour voir la structure actuelle

-- Exemple de suppression d'une contrainte (remplacez 'nom_constrainte' par le vrai nom)
-- ALTER TABLE profiles DROP CONSTRAINT nom_constrainte;

-- Exemple de création d'une nouvelle contrainte qui inclut 'directeur'
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
-- CHECK (role IN ('business_developer', 'manager_cop', 'conseiller_cop', 'conseillere_carriere', 'directeur'));
