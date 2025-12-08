-- ========================================
-- Vérifier la fonction handle_new_user() qui est déclenchée
-- ========================================

-- 1. Voir le code de la fonction handle_new_user()
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user'
AND n.nspname = 'public';

-- 2. Vérifier si cette fonction crée automatiquement un profil
-- Si oui, elle pourrait échouer si le profil ne peut pas être créé

-- 3. Vérifier les contraintes sur la table profiles qui pourraient bloquer
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
ORDER BY contype, conname;

-- 4. Vérifier si l'utilisateur sara@cop.com existe déjà
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'sara@cop.com';

-- 5. Vérifier si le profil existe déjà
SELECT 
  id,
  email,
  nom,
  prenom,
  role,
  actif
FROM profiles 
WHERE email = 'sara@cop.com';

