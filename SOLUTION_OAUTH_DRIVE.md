# 🔐 Solution : Utiliser Google Drive Personnel avec OAuth

## 📋 Situation

Vous avez :
- ✅ Un compte Google Drive personnel avec 15 Go
- ❌ Pas de Google Workspace (Shared Drive)
- ❌ Service Account ne peut pas utiliser le quota personnel

## ✅ Solution : OAuth 2.0 (Authentification Utilisateur)

Au lieu d'un Service Account, utiliser **OAuth 2.0** pour authentifier votre compte Google personnel.

## 🔧 Étapes de Configuration

### Étape 1 : Créer les Credentials OAuth dans Google Cloud Console

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionner votre projet (ou créer un nouveau projet)
3. Aller dans **APIs & Services** → **Credentials**
4. Cliquer sur **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Si demandé, configurer l'écran de consentement OAuth :
   - **Application name** : "CV Connect"
   - **User support email** : Votre email
   - **Scopes** : Ajouter `https://www.googleapis.com/auth/drive`
   - **Test users** : Ajouter votre email Google
   - Enregistrer
6. Créer l'OAuth client :
   - **Application type** : **Web application**
   - **Name** : "CV Connect OAuth"
   - **Authorized redirect URIs** :
     - Pour local : `http://localhost:3000/api/auth/google/callback`
     - Pour production : `https://copsm.space/api/auth/google/callback`
   - Créer
7. **Copier le Client ID et Client Secret**

### Étape 2 : Créer un dossier dans votre Google Drive

1. Aller sur [Google Drive](https://drive.google.com)
2. Créer un dossier : **"CV Connect"** ou **"CVs Stagiaires"**
3. Obtenir l'ID du dossier :
   - Ouvrir le dossier
   - URL : `https://drive.google.com/drive/folders/1ABC123...`
   - Copier la partie après `/folders/`

### Étape 3 : Obtenir un Refresh Token

**Option A : Script Node.js (Recommandé)**

Créer un fichier `get-oauth-token.js` :

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  'VOTRE_CLIENT_ID', // À remplacer
  'VOTRE_CLIENT_SECRET', // À remplacer
  'http://localhost:3000/api/auth/google/callback'
);

const scopes = ['https://www.googleapis.com/auth/drive'];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('1. Visitez cette URL pour autoriser:');
console.log(url);
console.log('\n2. Après autorisation, copiez le code de l\'URL de redirection');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Entrez le code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ Tokens obtenus:');
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('\nAjoutez ces variables à Netlify:');
    console.log('GOOGLE_OAUTH_CLIENT_ID:', 'VOTRE_CLIENT_ID');
    console.log('GOOGLE_OAUTH_CLIENT_SECRET:', 'VOTRE_CLIENT_SECRET');
    console.log('GOOGLE_OAUTH_REFRESH_TOKEN:', tokens.refresh_token);
    console.log('GOOGLE_DRIVE_FOLDER_ID:', 'ID_DE_VOTRE_DOSSIER');
  } catch (error) {
    console.error('Erreur:', error);
  }
  rl.close();
});
```

Exécuter : `node get-oauth-token.js`

**Option B : Via navigateur (Plus simple)**

1. Installer une extension OAuth Playground ou utiliser [Google OAuth Playground](https://developers.google.com/oauthplayground/)
2. Configurer avec votre Client ID/Secret
3. Autoriser les scopes Drive
4. Obtenir le Refresh Token

### Étape 4 : Configurer Netlify

1. Aller sur [Netlify Dashboard](https://app.netlify.com)
2. Votre site → **Site settings** → **Environment variables**
3. Ajouter/modifier :
   ```
   GOOGLE_OAUTH_CLIENT_ID = votre_client_id
   GOOGLE_OAUTH_CLIENT_SECRET = votre_client_secret
   GOOGLE_OAUTH_REFRESH_TOKEN = votre_refresh_token
   GOOGLE_DRIVE_FOLDER_ID = id_de_votre_dossier
   ```
4. Supprimer les anciennes variables Service Account :
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`

### Étape 5 : Modifier le Code

Je vais modifier le code pour utiliser OAuth au lieu de Service Account.

## 📝 Différences

| Méthode | Service Account | OAuth 2.0 |
|---------|----------------|-----------|
| **Quota** | ❌ Pas de quota personnel | ✅ Utilise votre quota (15 Go) |
| **Complexité** | Simple | Moyenne |
| **Sécurité** | Service Account dédié | Votre compte personnel |
| **Shared Drive** | Nécessaire | Non nécessaire |

## ⚠️ Notes Importantes

1. **Refresh Token** : Se génère une fois, à conserver précieusement
2. **Quota** : Vous utilisez votre quota Google Drive personnel (15 Go)
3. **Sécurité** : Ne partagez jamais le Refresh Token publiquement
4. **Expiration** : Le Refresh Token peut expirer, il faudra le régénérer

## ✅ Avantages de cette Solution

- ✅ Fonctionne avec un compte Google personnel
- ✅ Utilise votre quota de 15 Go
- ✅ Pas besoin de Google Workspace
- ✅ Solution immédiate sans abonnement

## 🚀 Après Configuration

Une fois OAuth configuré et le code modifié :
1. Le système utilisera votre compte Google pour uploader les CVs
2. Les fichiers seront dans votre dossier Google Drive personnel
3. Vous aurez 15 Go d'espace disponible

