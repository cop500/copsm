-- ========================================
-- Script de création du compte SARA HANZAZE - Conseillère d'orientation
-- ========================================
-- Rôle: conseiller_cop (même que Abdelhamid Inajjaren)
-- Permissions: Lecture, Écriture, Export (pas de suppression, pas de gestion utilisateurs)

-- 1. Créer le compte utilisateur dans Supabase Auth
-- (À faire via l'interface Supabase Dashboard > Authentication > Users)
-- Email: sara.hanzaze@cop.com
-- Password: sara123@
-- Email Confirm: ✅ (cocher)

-- 2. Récupérer l'ID de l'utilisateur créé et insérer le profil
-- Remplacez 'USER_ID_ICI' par l'ID récupéré de l'utilisateur créé dans auth.users
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
  'USER_ID_ICI', -- Remplacez par l'ID de l'utilisateur créé dans auth.users
  'sara.hanzaze@cop.com',
  'HANZAZE',
  'SARA',
  'conseiller_cop',
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  nom = 'HANZAZE',
  prenom = 'SARA',
  role = 'conseiller_cop',
  actif = true,
  updated_at = now();

-- 3. Vérifier que le profil a été créé correctement
SELECT 
  id,
  email,
  nom,
  prenom,
  role,
  actif,
  created_at
FROM profiles
WHERE email = 'sara.hanzaze@cop.com';

