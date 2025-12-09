# 🚀 Guide de Migration vers Service Account (Solution Définitive)

## 📋 Pourquoi migrer vers Service Account ?

### ❌ Problèmes avec OAuth 2.0 (solution actuelle)
- ⚠️ **Refresh token peut expirer** (erreur `invalid_grant`)
- ⚠️ **Nécessite régénération périodique** du refresh token
- ⚠️ **Dépend d'un compte utilisateur** qui peut révoquer l'accès
- ⚠️ **Moins sécurisé** pour les applications serveur

### ✅ Avantages du Service Account (solution définitive)
- ✅ **Jamais d'expiration** (tant que la clé privée est valide)
- ✅ **Pas de refresh token** à gérer
- ✅ **Compte dédié** indépendant des utilisateurs
- ✅ **Plus sécurisé** pour les applications serveur/serverless
- ✅ **Compatible avec Shared Drives** (Google Workspace)
- ✅ **Meilleure pratique** pour les applications backend

---

## 📝 ÉTAPE 1 : Créer un Service Account dans Google Cloud

### 1.1 Accéder à Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet (ou créez-en un)
3. Allez dans **IAM & Admin** > **Service Accounts**

### 1.2 Créer le Service Account

1. Cliquez sur **"+ CREATE SERVICE ACCOUNT"**
2. Remplissez les informations :
   - **Service account name** : `cv-connect-service` (ou autre nom)
   - **Service account ID** : `cv-connect-service` (généré automatiquement)
   - **Description** : `Service account pour CV Connect - Upload de CVs`
3. Cliquez sur **"CREATE AND CONTINUE"**

### 1.3 Attribuer les rôles

1. Dans **"Grant this service account access to project"** :
   - Cliquez sur **"SELECT A ROLE"**
   - Recherchez et sélectionnez : **"Editor"** (ou **"Storage Admin"** si disponible)
   - Cliquez sur **"CONTINUE"**
2. Cliquez sur **"DONE"** (pas besoin de permissions supplémentaires pour l'instant)

### 1.4 Créer une clé JSON

1. Cliquez sur le Service Account créé (dans la liste)
2. Allez dans l'onglet **"KEYS"**
3. Cliquez sur **"ADD KEY"** > **"Create new key"**
4. Sélectionnez **"JSON"**
5. Cliquez sur **"CREATE"**
6. **⚠️ IMPORTANT** : Le fichier JSON sera téléchargé automatiquement. **SAUVEGARDEZ-LE** dans un endroit sûr !

---

## 📝 ÉTAPE 2 : Activer l'API Google Drive

1. Dans Google Cloud Console, allez dans **APIs & Services** > **Library**
2. Recherchez **"Google Drive API"**
3. Cliquez dessus et cliquez sur **"ENABLE"**

---

## 📝 ÉTAPE 3 : Configurer les permissions Google Drive

### Option A : Utiliser un Google Drive personnel

1. Ouvrez le fichier JSON téléchargé
2. Copiez la valeur de `client_email` (ex: `cv-connect-service@project-id.iam.gserviceaccount.com`)
3. Allez sur [Google Drive](https://drive.google.com/)
4. Créez un dossier (ex: "CV Connect") ou utilisez un dossier existant
5. **Clic droit sur le dossier** > **"Partager"** (Share)
6. Collez l'email du Service Account
7. Donnez-lui le rôle **"Éditeur"** (Editor)
8. Cliquez sur **"Envoyer"** (Send)
9. **Copiez l'ID du dossier** depuis l'URL :
   - URL format : `https://drive.google.com/drive/folders/FOLDER_ID`
   - Exemple : Si l'URL est `https://drive.google.com/drive/folders/1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`
   - L'ID est : `1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`

### Option B : Utiliser un Shared Drive (Google Workspace)

1. Ouvrez le fichier JSON téléchargé
2. Copiez la valeur de `client_email`
3. Allez dans votre **Shared Drive** (Google Workspace)
4. **Clic droit sur le Shared Drive** > **"Gérer les membres"** (Manage members)
5. Cliquez sur **"Ajouter des membres"** (Add members)
6. Collez l'email du Service Account
7. Donnez-lui le rôle **"Gestionnaire de contenu"** (Content Manager) minimum
8. Cliquez sur **"Envoyer"** (Send)
9. **Copiez l'ID du Shared Drive** depuis l'URL

---

## 📝 ÉTAPE 4 : Extraire les informations du fichier JSON

Ouvrez le fichier JSON téléchargé. Il ressemble à ceci :

```json
{
  "type": "service_account",
  "project_id": "votre-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "cv-connect-service@votre-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

Vous avez besoin de :
- **`client_email`** → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- **`private_key`** → `GOOGLE_PRIVATE_KEY`

---

## 📝 ÉTAPE 5 : Configurer les variables d'environnement

### 5.1 En local (.env.local)

Créez ou modifiez votre fichier `.env.local` :

```env
# Service Account (SOLUTION DÉFINITIVE)
GOOGLE_SERVICE_ACCOUNT_EMAIL=cv-connect-service@votre-project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_PRIVEE_ICI\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt

# Optionnel : Si vous utilisez un Shared Drive
GOOGLE_DRIVE_ID=1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt
```

**⚠️ IMPORTANT** :
- Pour `GOOGLE_PRIVATE_KEY`, vous devez garder les `\n` dans la clé
- Entourez la valeur avec des guillemets doubles `"`
- La clé doit être sur une seule ligne avec `\n` pour les retours à la ligne

### 5.2 En production (Netlify)

1. Allez sur [Netlify Dashboard](https://app.netlify.com)
2. Sélectionnez votre site
3. Allez dans **Site settings** > **Environment variables**
4. Ajoutez/modifiez les variables suivantes :

   **Variables à AJOUTER** :
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `cv-connect-service@votre-project-id.iam.gserviceaccount.com`
   - `GOOGLE_PRIVATE_KEY` = `-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_PRIVEE_ICI\n-----END PRIVATE KEY-----\n`
   - `GOOGLE_DRIVE_FOLDER_ID` = `1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`

   **Variables à SUPPRIMER** (optionnel, mais recommandé) :
   - `GOOGLE_OAUTH_CLIENT_ID` (plus nécessaire)
   - `GOOGLE_OAUTH_CLIENT_SECRET` (plus nécessaire)
   - `GOOGLE_OAUTH_REFRESH_TOKEN` (plus nécessaire)

**⚠️ IMPORTANT pour Netlify** :
- Pour `GOOGLE_PRIVATE_KEY`, copiez-collez la clé complète avec les `\n`
- Netlify gère automatiquement les retours à la ligne dans les variables d'environnement

---

## 📝 ÉTAPE 6 : Tester la configuration

### 6.1 Test local

1. Redémarrez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. Testez l'upload d'un CV via le formulaire CV Connect

3. Vérifiez les logs dans la console :
   - Vous devriez voir : `[Google Drive Auth] 🔐 Utilisation Service Account (solution définitive)`
   - Pas d'erreur `invalid_grant`

### 6.2 Test en production

1. Redéployez sur Netlify :
   - Allez dans **Deploys**
   - Cliquez sur **"Trigger deploy"** > **"Deploy site"**

2. Attendez 2-3 minutes

3. Testez l'upload d'un CV sur votre site de production

---

## ✅ Checklist de migration

- [ ] Service Account créé dans Google Cloud Console
- [ ] Clé JSON téléchargée et sauvegardée
- [ ] API Google Drive activée
- [ ] Permissions Google Drive configurées (dossier partagé avec le Service Account)
- [ ] Variables d'environnement configurées en local
- [ ] Variables d'environnement configurées sur Netlify
- [ ] Test local réussi
- [ ] Test production réussi
- [ ] Anciennes variables OAuth supprimées (optionnel)

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne commitez JAMAIS** le fichier JSON du Service Account dans Git
2. **Ajoutez** `.json` à votre `.gitignore`
3. **Limitez les permissions** du Service Account au strict nécessaire
4. **Régénérez la clé** si elle est compromise
5. **Utilisez des variables d'environnement** pour stocker les credentials

### En cas de compromission

1. Allez dans Google Cloud Console > Service Accounts
2. Sélectionnez votre Service Account
3. Allez dans **KEYS**
4. Supprimez la clé compromise
5. Créez une nouvelle clé
6. Mettez à jour les variables d'environnement

---

## 🆘 Dépannage

### Erreur : "The caller does not have permission"

**Solution** : Vérifiez que le Service Account a bien accès au dossier Google Drive :
1. Partagez le dossier avec l'email du Service Account
2. Donnez-lui le rôle "Éditeur" minimum

### Erreur : "Invalid credentials"

**Solution** : Vérifiez que :
1. `GOOGLE_SERVICE_ACCOUNT_EMAIL` est correct
2. `GOOGLE_PRIVATE_KEY` contient bien toute la clé avec `\n`
3. La clé n'a pas été modifiée ou corrompue

### Erreur : "File not found" lors de l'upload

**Solution** : Vérifiez que :
1. `GOOGLE_DRIVE_FOLDER_ID` est correct
2. Le dossier existe et est accessible par le Service Account
3. Les permissions sont correctes

---

## 📚 Ressources

- [Documentation Google Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Guide d'authentification Google APIs](https://cloud.google.com/docs/authentication)

---

## 🎉 Résultat

Une fois la migration terminée :
- ✅ Plus jamais d'erreur `invalid_grant`
- ✅ Pas de maintenance périodique nécessaire
- ✅ Solution plus sécurisée et stable
- ✅ Meilleure pratique pour les applications serveur

