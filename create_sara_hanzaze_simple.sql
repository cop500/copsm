-- ========================================
-- Solution SIMPLE - Création SARA HANZAZE
-- ========================================
-- Si la création via l'interface Supabase échoue, essayez ces solutions

-- SOLUTION 1 : Vérifier si l'utilisateur existe déjà
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'sara.hanzaze@cop.com';

SELECT id, email, nom, prenom, role 
FROM profiles 
WHERE email = 'sara.hanzaze@cop.com';

-- SOLUTION 2 : Si l'utilisateur Auth existe déjà, créer juste le profil
-- Remplacez 'USER_ID_ICI' par l'ID récupéré de la requête ci-dessus
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
  'sara.hanzaze@cop.com',
  'HANZAZE',
  'SARA',
  'conseiller_cop',
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = 'sara.hanzaze@cop.com',
  nom = 'HANZAZE',
  prenom = 'SARA',
  role = 'conseiller_cop',
  actif = true,
  updated_at = now();

-- SOLUTION 3 : Si l'utilisateur n'existe pas du tout
-- Essayez de créer l'utilisateur avec un mot de passe temporaire plus simple
-- Puis changez-le après la création
-- Exemple : utilisez "sara123" au lieu de "sara123@"

