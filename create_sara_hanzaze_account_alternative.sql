-- ========================================
-- Script ALTERNATIF de création du compte SARA HANZAZE
-- Si la création via l'interface Supabase échoue
-- ========================================

-- ÉTAPE 1 : Créer l'utilisateur directement via SQL (nécessite les droits admin)
-- Cette méthode utilise l'extension auth.users directement

-- Option A : Utiliser la fonction Supabase pour créer l'utilisateur
-- Note : Cette méthode nécessite d'être exécutée avec les droits de service role
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Créer l'utilisateur dans auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', -- instance_id
    gen_random_uuid(), -- id (généré automatiquement)
    'authenticated', -- aud
    'authenticated', -- role
    'sara.hanzaze@cop.com', -- email
    crypt('sara123@', gen_salt('bf')), -- encrypted_password (hash du mot de passe)
    now(), -- email_confirmed_at (email confirmé immédiatement)
    NULL, -- invited_at
    '', -- confirmation_token
    NULL, -- confirmation_sent_at
    '', -- recovery_token
    NULL, -- recovery_sent_at
    '', -- email_change_token_new
    '', -- email_change
    NULL, -- email_change_sent_at
    NULL, -- last_sign_in_at
    '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
    '{}', -- raw_user_meta_data
    false, -- is_super_admin
    now(), -- created_at
    now(), -- updated_at
    NULL, -- phone
    NULL, -- phone_confirmed_at
    '', -- phone_change
    '', -- phone_change_token
    NULL, -- phone_change_sent_at
    '', -- email_change_token_current
    0, -- email_change_confirm_status
    NULL, -- banned_until
    '', -- reauthentication_token
    NULL, -- reauthentication_sent_at
    false, -- is_sso_user
    NULL -- deleted_at
  ) RETURNING id INTO new_user_id;

  -- Créer le profil dans la table profiles
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
    new_user_id,
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

  RAISE NOTICE 'Utilisateur créé avec succès. ID: %', new_user_id;
END $$;

-- ÉTAPE 2 : Vérifier la création
SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  p.nom,
  p.prenom,
  p.role,
  p.actif
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'sara.hanzaze@cop.com';

