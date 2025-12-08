-- ========================================
-- Script de vérification complète pour SARA HANZAZE
-- ========================================

-- 1. Vérifier l'utilisateur dans auth.users
SELECT 
  '1. AUTH.USERS' as verification,
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.created_at,
  u.raw_user_meta_data
FROM auth.users u
WHERE u.email = 'sara@cop.com';

-- 2. Vérifier le profil dans profiles
SELECT 
  '2. PROFILES' as verification,
  p.id,
  p.email,
  p.nom,
  p.prenom,
  p.role,
  p.actif,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE p.email = 'sara@cop.com';

-- 3. Vérifier la correspondance entre auth.users et profiles
SELECT 
  '3. CORRESPONDANCE' as verification,
  u.id as auth_user_id,
  p.id as profile_id,
  CASE WHEN u.id = p.id THEN '✅ Correspondance OK' ELSE '❌ IDs différents' END as correspondance,
  u.email as auth_email,
  p.email as profile_email,
  p.role,
  p.actif
FROM auth.users u
FULL OUTER JOIN profiles p ON u.id = p.id
WHERE u.email = 'sara@cop.com' OR p.email = 'sara@cop.com';

-- 4. Comparer avec Abdelhamid Inajjaren (même rôle)
SELECT 
  '4. COMPARAISON AVEC ABDELHAMID' as verification,
  p1.email as sara_email,
  p1.role as sara_role,
  p1.actif as sara_actif,
  p2.email as abdelhamid_email,
  p2.role as abdelhamid_role,
  p2.actif as abdelhamid_actif,
  CASE 
    WHEN p1.role = p2.role AND p1.actif = p2.actif THEN '✅ Même rôle et statut'
    ELSE '⚠️ Différences détectées'
  END as comparaison
FROM profiles p1
CROSS JOIN profiles p2
WHERE p1.email = 'sara@cop.com'
AND p2.email LIKE '%abdelhamid%' OR p2.email LIKE '%inejjaren%'
LIMIT 1;

-- 5. Vérifier les contraintes et permissions
SELECT 
  '5. PERMISSIONS RLS' as verification,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
AND (qual::text LIKE '%sara%' OR qual::text LIKE '%conseiller_cop%')
LIMIT 5;

-- 6. Résumé final
SELECT 
  '6. RÉSUMÉ FINAL' as verification,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'sara@cop.com') 
      AND EXISTS (SELECT 1 FROM profiles WHERE email = 'sara@cop.com' AND role = 'conseiller_cop')
    THEN '✅ Tout est en ordre!'
    ELSE '❌ Problème détecté'
  END as statut,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'sara@cop.com') as count_auth,
  (SELECT COUNT(*) FROM profiles WHERE email = 'sara@cop.com' AND role = 'conseiller_cop') as count_profile;

