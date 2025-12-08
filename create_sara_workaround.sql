-- ========================================
-- Solution de contournement pour créer SARA HANZAZE
-- ========================================
-- Si la fonction handle_new_user() bloque la création, on peut :
-- 1. Créer l'utilisateur Auth manuellement
-- 2. Créer le profil manuellement
-- 3. Ou désactiver temporairement le trigger

-- OPTION 1 : Créer l'utilisateur Auth avec un mot de passe temporaire simple
-- Puis créer le profil manuellement
-- (À faire via l'interface Supabase avec un mot de passe très simple comme "test123")

-- OPTION 2 : Si l'utilisateur Auth existe déjà, créer juste le profil
-- Remplacez 'USER_ID_ICI' par l'ID de l'utilisateur Auth
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

-- OPTION 3 : Désactiver temporairement le trigger (si vous avez les droits)
-- ATTENTION : À utiliser avec précaution, réactiver après
/*
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Créer l'utilisateur via l'interface Supabase maintenant
-- Puis créer le profil avec l'option 2

-- Réactiver le trigger après
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
*/

