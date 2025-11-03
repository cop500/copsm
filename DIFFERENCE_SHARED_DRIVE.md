# 📊 Différence : Google Drive vs Shared Drive

## ❌ NON, ce n'est PAS la même chose !

### 📁 Google Drive (Dossier Personnel)

**Caractéristiques** :
- Dossier créé dans **votre Drive personnel**
- Les **Service Accounts n'ont PAS de quota** pour y stocker des fichiers
- Erreur obtenue : **"Service Accounts do not have storage quota"**

### 👥 Shared Drive (Google Workspace)

**Caractéristiques** :
- **Drive partagé** appartenant à l'organisation (Google Workspace)
- Les **Service Accounts peuvent stocker** des fichiers avec quota illimité
- **Solution au problème** de quota

## 🔍 Comment Distinguer ?

### Google Drive Personnel :
- Dans le menu de gauche de Google Drive : **"Mon Drive"** ou **"My Drive"**
- Les fichiers sont dans votre espace personnel
- Les dossiers créés ici sont des **dossiers personnels**

### Shared Drive :
- Dans le menu de gauche de Google Drive : **"Drive partagés"** ou **"Shared drives"**
- Section séparée avec des dossiers partagés par l'organisation
- Les fichiers sont dans l'espace **partagé de l'organisation**

## ✅ Solution : Créer un Shared Drive

### Étape 1 : Vérifier que vous avez Google Workspace

1. Aller sur [Google Drive](https://drive.google.com)
2. Regarder dans le menu de gauche
3. Si vous voyez **"Drive partagés"** ou **"Shared drives"** → ✅ Vous avez Google Workspace

### Étape 2 : Créer un Shared Drive

1. Dans Google Drive, cliquer sur **"Drive partagés"** (menu de gauche)
2. Cliquer sur **"Nouveau"** ou **"New"** (bouton en haut à gauche)
3. Sélectionner **"Drive partagé"** ou **"Shared drive"**
4. Donner un nom : **"CV Connect"** ou **"CVs Stagiaires"**
5. Cliquer sur **"Créer"** ou **"Create"**

### Étape 3 : Ajouter le Service Account

1. Ouvrir le Shared Drive créé
2. Cliquer sur le **nom du Shared Drive** en haut
3. Cliquer sur **"Gérer les membres"** ou **"Manage members"**
4. Cliquer sur **"Ajouter des membres"** ou **"Add members"**
5. Entrer l'**email du Service Account** :
   - Aller sur Netlify → Environment variables
   - Copier la valeur de `GOOGLE_SERVICE_ACCOUNT_EMAIL`
6. Donner le rôle **"Gestionnaire de contenu"** ou **"Content Manager"**
7. Cliquer sur **"Envoyer"**

### Étape 4 : Obtenir l'ID du Shared Drive

1. Toujours dans le Shared Drive
2. L'URL dans la barre d'adresse ressemblera à :
   ```
   https://drive.google.com/drive/folders/1ABC123def456...
   ```
3. Copier la partie après `/folders/` → C'est l'**ID du Shared Drive**

### Étape 5 : Créer un Dossier dans le Shared Drive (Recommandé)

**Option recommandée** : Créer un dossier dans le Shared Drive

1. Dans le Shared Drive, cliquer sur **"Nouveau"** → **"Dossier"**
2. Nommer le dossier : **"CVs"** ou **"CV Connect"**
3. Partager ce dossier avec le Service Account (même processus qu'à l'étape 3)
4. Obtenir l'ID de ce dossier (même méthode qu'à l'étape 4)
5. Utiliser cet ID dans `GOOGLE_DRIVE_FOLDER_ID` sur Netlify

## 📝 Résumé

| Type | Quota Service Account | Utilisation |
|------|----------------------|-------------|
| **Google Drive Personnel** | ❌ Pas de quota | Ne fonctionne PAS avec Service Accounts |
| **Shared Drive** | ✅ Quota illimité | ✅ Fonctionne avec Service Accounts |

## ⚠️ Important

Si vous n'avez **pas Google Workspace** :
- Les Shared Drives ne sont pas disponibles
- Il faut utiliser une autre méthode (OAuth delegation) - plus complexe
- Ou demander à l'administrateur Google Workspace de créer le Shared Drive

## 🎯 Prochaines Étapes

1. ✅ Créer un **Shared Drive** (pas un dossier personnel)
2. ✅ Ajouter le **Service Account** comme membre
3. ✅ Obtenir l'**ID du Shared Drive** ou d'un dossier dans le Shared Drive
4. ✅ Mettre à jour **`GOOGLE_DRIVE_FOLDER_ID`** sur Netlify
5. ✅ Redéployer et tester

