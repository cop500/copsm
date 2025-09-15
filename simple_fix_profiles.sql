-- ========================================
-- Script simple pour corriger la contrainte de la table profiles
-- ========================================

-- 1. Supprimer toutes les contraintes de vérification existantes sur la table profiles
-- (Exécutez d'abord simple_check_profiles.sql pour voir les noms des contraintes)

-- Exemple de suppression (remplacez par le vrai nom de la contrainte) :
-- ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;

-- 2. Créer une nouvelle contrainte qui inclut 'directeur'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('business_developer', 'manager_cop', 'conseiller_cop', 'conseillere_carriere', 'directeur'));

-- 3. Vérifier que la contrainte a été créée
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c' 
AND conname = 'profiles_role_check';
