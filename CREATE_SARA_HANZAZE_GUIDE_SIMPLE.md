# Guide Simple - Création SARA HANZAZE

## ❌ Erreur rencontrée
"Failed to create user: Database error creating new user"

## ✅ Solutions à essayer (dans l'ordre)

### Solution 1 : Vérifier si l'utilisateur existe déjà

Dans **Supabase Dashboard → SQL Editor**, exécutez :

```sql
SELECT id, email FROM auth.users WHERE email = 'sara.hanzaze@cop.com';
```

**Si un résultat apparaît** : L'utilisateur existe déjà ! Passez directement à l'étape 2.

**Si aucun résultat** : Continuez avec les solutions ci-dessous.

### Solution 2 : Essayer avec un mot de passe plus simple

Le caractère `@` dans le mot de passe peut causer des problèmes. Essayez :

1. **Dans Supabase Dashboard → Authentication → Users**
2. Créez l'utilisateur avec :
   - Email : `sara.hanzaze@cop.com`
   - Password : `sara123` (sans le @)
   - Auto Confirm User : ✅ (cocher)
3. Cliquez sur "Create user"

**Si ça fonctionne** : Changez le mot de passe après via "Reset password" pour mettre `sara123@`

### Solution 3 : Créer via "Invite user" au lieu de "Add user"

1. Dans **Supabase Dashboard → Authentication → Users**
2. Cliquez sur **"Invite user"** (au lieu de "Add user")
3. Entrez : `sara.hanzaze@cop.com`
4. L'utilisateur recevra un email pour définir son mot de passe

### Solution 4 : Si l'utilisateur Auth existe mais pas le profil

Si l'utilisateur existe dans `auth.users` mais pas dans `profiles` :

1. **Récupérez l'ID** :
```sql
SELECT id FROM auth.users WHERE email = 'sara.hanzaze@cop.com';
```

2. **Créez le profil** (remplacez USER_ID par l'ID récupéré) :
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
  'USER_ID_ICI', -- Remplacez par l'ID récupéré
  'sara.hanzaze@cop.com',
  'HANZAZE',
  'SARA',
  'conseiller_cop',
  true,
  now(),
  now()
);
```

### Solution 5 : Vérifier les logs d'erreur

1. Allez dans **Supabase Dashboard → Logs → Auth Logs**
2. Cherchez l'erreur exacte qui s'est produite
3. Cela vous donnera plus de détails sur le problème

## 🔍 Causes possibles de l'erreur

1. **Caractère spécial dans le mot de passe** : Le `@` peut causer des problèmes
2. **Contrainte de la base de données** : L'email existe peut-être déjà
3. **Politique RLS** : Une politique peut bloquer la création
4. **Format de l'email** : Vérifiez qu'il n'y a pas d'espaces

## ✅ Vérification finale

Après avoir créé l'utilisateur, vérifiez :

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
WHERE u.email = 'sara.hanzaze@cop.com';
```

Vous devriez voir :
- ✅ L'utilisateur dans `auth.users`
- ✅ Le profil dans `profiles` avec `role = 'conseiller_cop'`

## 📞 Si rien ne fonctionne

Contactez le support Supabase avec :
- Le message d'erreur exact
- Les logs d'erreur (Dashboard → Logs → Auth Logs)
- Cette information : "Tentative de création d'utilisateur avec email sara.hanzaze@cop.com"

