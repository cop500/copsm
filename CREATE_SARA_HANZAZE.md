# Création du compte SARA HANZAZE - Conseillère d'orientation

## 📋 Informations du compte

- **Nom** : HANZAZE
- **Prénom** : SARA
- **Email** : sara.hanzaze@cop.com
- **Mot de passe** : sara123@
- **Rôle** : `conseiller_cop` (même que Abdelhamid Inajjaren)

## 🔐 Permissions du rôle conseiller_cop

- ✅ **Lecture** : Oui
- ✅ **Écriture** : Oui
- ✅ **Export** : Oui
- ❌ **Suppression** : Non
- ❌ **Gestion utilisateurs** : Non
- ❌ **Paramètres** : Non

## 📝 Étapes de création

### 1. Créer l'utilisateur dans Supabase Auth

#### Option A : Via l'interface Supabase Dashboard (Recommandé)
1. Allez dans **Supabase Dashboard** → **Authentication** → **Users**
2. Cliquez sur **"Add user"** ou **"Invite user"**
3. Remplissez les informations :
   - **Email** : `sara.hanzaze@cop.com`
   - **Password** : `sara123@`
   - **Email Confirm** : ✅ (cocher cette case pour confirmer automatiquement l'email)
4. Cliquez sur **"Create user"** ou **"Send invitation"**
5. **Important** : Copiez l'**ID de l'utilisateur** créé (vous en aurez besoin pour l'étape suivante)

#### Option B : Via SQL (si vous avez les droits admin)
```sql
-- Cette commande nécessite les droits admin sur Supabase
-- Utilisez plutôt l'interface si possible
```

### 2. Récupérer l'ID de l'utilisateur

Après avoir créé l'utilisateur dans Auth, récupérez son ID :

```sql
SELECT id, email FROM auth.users WHERE email = 'sara.hanzaze@cop.com';
```

Copiez l'ID retourné (format UUID).

### 3. Créer le profil dans la table profiles

Exécutez le script SQL suivant dans **Supabase Dashboard** → **SQL Editor** :

```sql
-- Remplacez 'USER_ID_ICI' par l'ID récupéré à l'étape précédente
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
  'USER_ID_ICI', -- ⚠️ REMPLACEZ PAR L'ID DE L'UTILISATEUR CRÉÉ
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
```

### 4. Vérifier la création

Exécutez cette requête pour vérifier que tout est correct :

```sql
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
```

Vous devriez voir :
- **email** : sara.hanzaze@cop.com
- **nom** : HANZAZE
- **prenom** : SARA
- **role** : conseiller_cop
- **actif** : true

## ✅ Vérification finale

1. L'utilisateur peut se connecter avec :
   - Email : `sara.hanzaze@cop.com`
   - Mot de passe : `sara123@`

2. L'utilisateur a les mêmes droits qu'Abdelhamid Inajjaren (conseiller_cop)

3. L'utilisateur apparaît dans les listes de conseillers autorisés pour l'assistance aux stagiaires

## 📌 Notes importantes

- Le rôle `conseiller_cop` est déjà défini dans l'application
- Les permissions sont automatiquement appliquées via les politiques RLS
- SARA HANZAZE a été ajoutée dans les listes de conseillers autorisés dans le code

