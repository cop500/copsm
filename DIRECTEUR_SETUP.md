# Configuration du compte Directeur

## 📋 Instructions de configuration

### 1. Créer le compte utilisateur dans Supabase

#### Option A : Via l'interface Supabase Dashboard
1. Allez dans **Authentication > Users**
2. Cliquez sur **"Add user"**
3. Remplissez :
   - **Email** : `Directeur@cmc`
   - **Password** : `cop123`
   - **Email Confirm** : ✅ (cocher)
4. Cliquez sur **"Create user"**

#### Option B : Via SQL (recommandé)
Exécutez le script SQL `create_director_account.sql` dans l'éditeur SQL de Supabase.

### 2. Mettre à jour le type UserRole
Dans Supabase Dashboard > Database > Types, ajoutez `'directeur'` au type `UserRole` :

```sql
ALTER TYPE "UserRole" ADD VALUE 'directeur';
```

### 3. Créer le profil utilisateur
Exécutez cette requête SQL dans l'éditeur SQL :

```sql
-- Récupérer l'ID de l'utilisateur créé
SELECT id FROM auth.users WHERE email = 'Directeur@cmc';

-- Insérer le profil (remplacez USER_ID par l'ID récupéré)
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
  'USER_ID_ICI',
  'Directeur@cmc',
  'Directeur',
  'COP',
  'directeur',
  true,
  now(),
  now()
);
```

### 4. Configurer les politiques RLS
Exécutez le script `create_director_account.sql` pour créer toutes les politiques RLS nécessaires.

## 🎯 Permissions du Directeur

### ✅ Accès autorisés :
- **Mode plein écran uniquement** (pas de sidebar)
- **Lecture de tous les indicateurs** (pas de modification)
- **Consultation des événements** (pas de création/modification/suppression)
- **Consultation des demandes d'entreprises** (pas de modification)
- **Consultation des candidatures** (pas de modification)
- **Notes d'équipe** : lecture + écriture + suppression de ses propres notes

### ❌ Accès interdits :
- **Export** de toutes les données
- **Modification** des données existantes
- **Suppression** de contenu (sauf ses propres notes)
- **Gestion** des utilisateurs
- **Accès** aux paramètres

## 🔐 Connexion

- **URL** : `/dashboard-directeur`
- **Email** : `Directeur@cmc`
- **Mot de passe** : `cop123`

## 🧪 Test

1. Connectez-vous avec les identifiants du directeur
2. Vérifiez que vous êtes redirigé vers `/dashboard-directeur`
3. Vérifiez que l'interface est en mode plein écran
4. Testez les permissions (lecture seule, pas d'export, etc.)
5. Vérifiez que vous pouvez écrire des notes d'équipe

## 📝 Notes importantes

- Le directeur a accès à toutes les données en lecture seule
- Il peut écrire et supprimer ses propres notes d'équipe
- L'interface est adaptée pour une consultation optimale
- Tous les boutons d'export et de modification sont masqués
- Le mode plein écran est forcé pour une meilleure visibilité
