# Solution pour créer SARA HANZAZE - Étapes détaillées

## ❌ Problème
L'erreur "Database error creating new user" persiste même avec `sara@cop.com` / `sara123`

## ✅ Solution étape par étape

### ÉTAPE 1 : Diagnostic - Vérifier l'état actuel

Dans **Supabase Dashboard → SQL Editor**, exécutez d'abord le script `check_and_create_sara.sql` pour voir l'état actuel.

**Questions à répondre :**
1. L'utilisateur existe-t-il déjà dans `auth.users` ?
2. Le profil existe-t-il déjà dans `profiles` ?

### ÉTAPE 2 : Si l'utilisateur Auth existe déjà

Si l'étape 1 montre que l'utilisateur existe dans `auth.users` mais pas dans `profiles` :

1. **Copiez l'ID** de l'utilisateur depuis le résultat de l'étape 1
2. **Exécutez ce script** (remplacez USER_ID_ICI par l'ID copié) :

```sql
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
```

### ÉTAPE 3 : Si l'utilisateur n'existe nulle part

Si l'utilisateur n'existe ni dans `auth.users` ni dans `profiles`, essayez ces solutions :

#### Solution A : Utiliser "Invite user" au lieu de "Add user"

1. Dans **Supabase Dashboard → Authentication → Users**
2. Cliquez sur **"Invite user"** (pas "Add user")
3. Entrez : `sara@cop.com`
4. L'utilisateur recevra un email pour définir son mot de passe
5. Une fois l'invitation acceptée, créez le profil avec l'étape 2

#### Solution B : Vérifier les logs d'erreur détaillés

1. Allez dans **Supabase Dashboard → Logs → Auth Logs**
2. Cherchez l'erreur la plus récente
3. Regardez le message d'erreur complet
4. Cela vous donnera plus d'informations sur la cause

#### Solution C : Créer via l'API Supabase (si vous avez la Service Role Key)

Si vous avez accès à la **Service Role Key** de Supabase, vous pouvez créer l'utilisateur via l'API :

```bash
curl -X POST 'https://[VOTRE_PROJET].supabase.co/auth/v1/admin/users' \
  -H "apikey: [SERVICE_ROLE_KEY]" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sara@cop.com",
    "password": "sara123",
    "email_confirm": true
  }'
```

Puis créez le profil avec l'ID retourné.

### ÉTAPE 4 : Vérification finale

Après avoir créé l'utilisateur et le profil, vérifiez :

```sql
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
WHERE u.email = 'sara@cop.com';
```

Vous devriez voir :
- ✅ L'utilisateur dans `auth.users`
- ✅ Le profil dans `profiles` avec `role = 'conseiller_cop'`

## 🔍 Causes possibles de l'erreur

1. **Trigger ou fonction sur auth.users** qui bloque l'insertion
2. **Politique RLS** qui empêche la création
3. **Contrainte de base de données** non visible
4. **Configuration Supabase** qui nécessite une validation supplémentaire

## 📞 Prochaine étape

**Commencez par exécuter `check_and_create_sara.sql`** et dites-moi ce que vous voyez dans les résultats. Cela m'aidera à identifier la cause exacte du problème.

