-- ========================================
-- Créer le profil pour SARA HANZAZE
-- ========================================
-- L'utilisateur existe déjà dans auth.users, il faut juste créer le profil

DO $$
DECLARE
  user_id uuid;
BEGIN
  -- 1. Récupérer l'ID de l'utilisateur
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'sara@cop.com'
  LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur sara@cop.com non trouvé dans auth.users';
  END IF;
  
  RAISE NOTICE '✅ Utilisateur trouvé. ID: %', user_id;
  
  -- 2. Créer le profil avec les bonnes informations
  INSERT INTO profiles (
    id,
    email,
    nom,
    prenom,
    role,
    actif,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    'sara@cop.com',
    'HANZAZE',
    'SARA',
    'conseiller_cop', -- Même rôle qu'Abdelhamid Inajjaren pour les permissions
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nom = EXCLUDED.nom,
    prenom = EXCLUDED.prenom,
    role = EXCLUDED.role,
    actif = EXCLUDED.actif,
    updated_at = now();
  
  RAISE NOTICE '✅ Profil créé/mis à jour avec succès!';
  
END $$;

-- Vérification finale
SELECT 
  'RÉSUMÉ FINAL' as verification,
  u.id as auth_user_id,
  u.email as auth_email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  p.id as profile_id,
  p.email as profile_email,
  p.nom,
  p.prenom,
  p.role,
  p.actif,
  CASE 
    WHEN u.id = p.id AND p.role = 'conseiller_cop' AND p.actif = true 
    THEN '✅ Tout est en ordre!'
    ELSE '❌ Problème détecté'
  END as statut
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'sara@cop.com';

