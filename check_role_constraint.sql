-- ========================================
-- Vérifier la contrainte de rôle complète
-- ========================================

-- 1. Voir la définition complète de la contrainte profiles_role_check
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'profiles_role_check';

-- 2. Vérifier quels rôles sont autorisés
-- La contrainte devrait inclure 'conseiller_cop'
SELECT 
  conname,
  pg_get_constraintdef(oid) as full_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND conname = 'profiles_role_check';

-- 3. Vérifier la fonction handle_new_user() complète
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user'
AND n.nspname = 'public';

-- 4. Tester si on peut insérer un profil avec le rôle conseiller_cop
-- (Cette requête ne sera pas exécutée, juste pour vérifier la syntaxe)
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
  '00000000-0000-0000-0000-000000000000', -- UUID de test
  'test@test.com',
  'TEST',
  'TEST',
  'conseiller_cop', -- Vérifier si ce rôle est accepté
  true,
  now(),
  now()
);
-- Puis supprimer : DELETE FROM profiles WHERE email = 'test@test.com';
*/

