# Solution Alternative - Création du compte SARA HANZAZE

## ❌ Problème rencontré

Erreur lors de la création via l'interface Supabase : "Failed to create user: Database error creating new user"

## ✅ Solutions alternatives

### Solution 1 : Vérifier les contraintes de la base de données

Avant de créer l'utilisateur, vérifiez s'il n'existe pas déjà :

```sql
-- Vérifier si l'email existe déjà dans auth.users
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'sara.hanzaze@cop.com';

-- Vérifier si l'email existe déjà dans profiles
SELECT id, email, nom, prenom, role 
FROM profiles 
WHERE email = 'sara.hanzaze@cop.com';
```

### Solution 2 : Créer via l'API Supabase (Recommandé)

Si l'interface Supabase ne fonctionne pas, utilisez l'API directement :

1. **Via Supabase Dashboard → SQL Editor** :
   - Exécutez le script `create_sara_hanzaze_account_alternative.sql`
   - ⚠️ **Important** : Ce script nécessite les droits de **Service Role**

2. **Via l'API REST Supabase** :
   - Utilisez la clé **Service Role Key** (pas la clé publique)
   - Endpoint : `POST https://[votre-projet].supabase.co/auth/v1/admin/users`

### Solution 3 : Créer manuellement étape par étape

#### Étape 1 : Créer l'utilisateur Auth (si possible via l'interface)
- Essayez de créer l'utilisateur avec un mot de passe plus simple temporairement
- Puis changez le mot de passe après

#### Étape 2 : Si la création Auth échoue, vérifiez :
```sql
-- Vérifier les contraintes sur auth.users
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass;

-- Vérifier les triggers sur auth.users
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';
```

#### Étape 3 : Créer le profil manuellement (si l'utilisateur Auth existe)
```sql
-- D'abord, récupérez l'ID de l'utilisateur Auth
SELECT id FROM auth.users WHERE email = 'sara.hanzaze@cop.com';

-- Puis créez le profil (remplacez USER_ID par l'ID récupéré)
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
```

### Solution 4 : Utiliser l'API Supabase Admin

Si vous avez accès à la **Service Role Key**, vous pouvez créer l'utilisateur via l'API :

```javascript
// Exemple avec curl
curl -X POST 'https://[votre-projet].supabase.co/auth/v1/admin/users' \
  -H "apikey: [SERVICE_ROLE_KEY]" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sara.hanzaze@cop.com",
    "password": "sara123@",
    "email_confirm": true,
    "user_metadata": {
      "nom": "HANZAZE",
      "prenom": "SARA"
    }
  }'
```

Puis créez le profil dans la table `profiles` avec l'ID retourné.

## 🔍 Diagnostic

Si l'erreur persiste, vérifiez :

1. **Les logs Supabase** : Dashboard → Logs → Auth Logs
2. **Les politiques RLS** : Peuvent bloquer l'insertion
3. **Les contraintes de la table profiles** : Vérifiez les contraintes UNIQUE
4. **Le format de l'email** : Assurez-vous qu'il n'y a pas d'espaces

## 📞 Support

Si aucune solution ne fonctionne, contactez le support Supabase avec :
- Le message d'erreur exact
- Les logs d'erreur
- La structure de votre table `profiles`

