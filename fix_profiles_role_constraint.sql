-- ========================================
-- Script simple pour corriger la contrainte de la table profiles
-- ========================================

-- 1. Vérifier les valeurs actuelles dans la colonne role
SELECT DISTINCT role FROM profiles;

-- 2. Vérifier les contraintes existantes
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c';

-- 3. Supprimer toutes les contraintes de vérification existantes sur la table profiles
-- (Remplacez 'nom_constrainte' par le nom réel trouvé dans l'étape 2)
-- ALTER TABLE profiles DROP CONSTRAINT nom_constrainte;

-- 4. Créer une nouvelle contrainte qui inclut 'directeur'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('business_developer', 'manager_cop', 'conseiller_cop', 'conseillere_carriere', 'directeur'));

-- 5. Vérifier que la contrainte a été créée
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c' 
AND conname = 'profiles_role_check';
