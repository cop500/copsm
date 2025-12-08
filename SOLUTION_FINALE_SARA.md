# Solution Finale - Création SARA HANZAZE

## 🔍 Diagnostic

D'après les contraintes que vous avez vues :
- ✅ `profiles_pkey` : PRIMARY KEY sur `id` - OK
- ✅ `profiles_email_key` : UNIQUE sur `email` - OK
- ⚠️ `profiles_role_check` : Contrainte CHECK sur `role` - **À vérifier**

Le problème vient probablement de la fonction `handle_new_user()` qui essaie de créer automatiquement un profil, mais échoue à cause d'une contrainte ou d'une valeur manquante.

## ✅ Solution Recommandée (Étape par étape)

### ÉTAPE 1 : Vérifier la fonction handle_new_user()

Exécutez dans SQL Editor :

```sql
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user'
AND n.nspname = 'public';
```

**Cela vous montrera ce que fait la fonction automatiquement.**

### ÉTAPE 2 : Vérifier si l'utilisateur existe déjà

```sql
SELECT id, email FROM auth.users WHERE email = 'sara@cop.com';
SELECT id, email FROM profiles WHERE email = 'sara@cop.com';
```

### ÉTAPE 3 : Solution de contournement - Désactiver temporairement le trigger

Si la fonction `handle_new_user()` cause le problème, désactivez-la temporairement :

```sql
-- 1. Désactiver le trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
```

**Puis :**
1. Créez l'utilisateur via l'interface Supabase :
   - Email : `sara@cop.com`
   - Password : `sara123`
   - Auto Confirm : ✅

**Ensuite :**
```sql
-- 2. Récupérer l'ID de l'utilisateur créé
SELECT id FROM auth.users WHERE email = 'sara@cop.com';

-- 3. Créer le profil manuellement (remplacez USER_ID par l'ID récupéré)
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
);

-- 4. Réactiver le trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

### ÉTAPE 4 : Vérification finale

```sql
SELECT 
  u.id,
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

## 🎯 Alternative : Utiliser "Invite user"

Si la désactivation du trigger ne fonctionne pas :

1. **Supabase Dashboard → Authentication → Users**
2. Cliquez sur **"Invite user"** (pas "Add user")
3. Entrez : `sara@cop.com`
4. L'utilisateur recevra un email
5. Une fois l'invitation acceptée, créez le profil avec l'ÉTAPE 3 ci-dessus

## 📝 Important

- Le rôle `conseiller_cop` doit être dans la liste autorisée de la contrainte `profiles_role_check`
- Si ce n'est pas le cas, il faudra modifier la contrainte pour l'ajouter

