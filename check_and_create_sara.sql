-- ========================================
-- Script de diagnostic et création SARA HANZAZE
-- ========================================

-- ÉTAPE 1 : Vérifier si l'utilisateur existe déjà dans auth.users
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'sara@cop.com';

-- ÉTAPE 2 : Vérifier si le profil existe déjà dans profiles
SELECT 
  id,
  email,
  nom,
  prenom,
  role,
  actif
FROM profiles 
WHERE email = 'sara@cop.com';

-- ÉTAPE 3 : Si l'utilisateur Auth existe MAIS pas le profil, créer le profil
-- Remplacez 'USER_ID_ICI' par l'ID récupéré de l'étape 1
/*
INSERT INTO profiles (
  id,
  email,
  nom,
  prenom,
  role,
  actif,
  created_at,
  updated_at
) VALUES (
  'USER_ID_ICI', -- Remplacez par l'ID de auth.users
  'sara@cop.com',
  'HANZAZE',
  'SARA',
  'conseiller_cop',
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = 'sara@cop.com',
  nom = 'HANZAZE',
  prenom = 'SARA',
  role = 'conseiller_cop',
  actif = true,
  updated_at = now();
*/

-- ÉTAPE 4 : Si l'utilisateur n'existe nulle part, vérifier les contraintes
-- Vérifier les contraintes sur auth.users
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass
LIMIT 10;

-- ÉTAPE 5 : Vérifier les triggers sur auth.users
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

