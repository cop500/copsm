# Guide : Régénérer le Refresh Token OAuth pour Google Drive

## Problème

L'erreur `invalid_grant` indique que le refresh token OAuth utilisé pour accéder à Google Drive a expiré ou a été révoqué. Cela peut arriver si :
- Le token n'a pas été utilisé pendant une longue période
- L'utilisateur a révoqué l'accès dans son compte Google
- Les credentials OAuth ont été modifiés dans la console Google Cloud

## Solution : Régénérer le Refresh Token

### Étape 1 : Accéder à la Console Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Credentials**

### Étape 2 : Vérifier les Credentials OAuth 2.0

1. Trouvez votre **OAuth 2.0 Client ID** (celui utilisé pour Google Drive)
2. Notez le **Client ID** et le **Client Secret**

### Étape 3 : Générer un nouveau Refresh Token

#### Option A : Utiliser OAuth 2.0 Playground (Recommandé)

1. Allez sur [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Cliquez sur l'icône ⚙️ (Settings) en haut à droite
3. Cochez **"Use your own OAuth credentials"**
4. Entrez votre **Client ID** et **Client Secret**
5. Dans la liste de gauche, trouvez **"Drive API v3"**
6. Sélectionnez les scopes nécessaires :
   - `https://www.googleapis.com/auth/drive.file` (pour créer et modifier des fichiers)
   - `https://www.googleapis.com/auth/drive` (pour accéder à tous les fichiers)
7. Cliquez sur **"Authorize APIs"**
8. Connectez-vous avec le compte Google qui possède le Google Drive
9. Acceptez les permissions
10. Cliquez sur **"Exchange authorization code for tokens"**
11. Copiez le **Refresh token** affiché

#### Option B : Utiliser un script Node.js

Créez un fichier `generate-refresh-token.js` :

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'VOTRE_CLIENT_ID';
const CLIENT_SECRET = 'VOTRE_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent' // Important : force la génération d'un refresh token
});

console.log('Autorisez cette application en visitant cette URL:');
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Entrez le code de l\'URL de redirection: ', (code) => {
  rl.close();
  
  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('Erreur lors de la récupération du token:', err);
      return;
    }
    
    console.log('\n✅ Refresh Token généré:');
    console.log(token.refresh_token);
    console.log('\n⚠️  IMPORTANT: Copiez ce refresh token et ajoutez-le à vos variables d\'environnement.');
  });
});
```

Exécutez le script :
```bash
node generate-refresh-token.js
```

### Étape 4 : Mettre à jour les Variables d'Environnement

1. **En local** : Mettez à jour votre fichier `.env.local` :
   ```
   GOOGLE_OAUTH_CLIENT_ID=votre_client_id
   GOOGLE_OAUTH_CLIENT_SECRET=votre_client_secret
   GOOGLE_OAUTH_REFRESH_TOKEN=le_nouveau_refresh_token
   ```

2. **En production (Netlify)** :
   - Allez dans votre projet Netlify
   - **Site settings** > **Environment variables**
   - Mettez à jour `GOOGLE_OAUTH_REFRESH_TOKEN` avec le nouveau token

3. **Redéployez** l'application si nécessaire

### Étape 5 : Vérifier que ça fonctionne

1. Testez l'upload d'un CV via le formulaire CV Connect
2. Vérifiez les logs pour confirmer que l'authentification fonctionne

## Prévention

Pour éviter que le refresh token expire :
- Utilisez-le régulièrement (au moins une fois tous les 6 mois)
- Ne révoquez pas l'accès dans le compte Google
- Ne modifiez pas les credentials OAuth sans mettre à jour le refresh token

## Support

Si le problème persiste après avoir régénéré le refresh token :
1. Vérifiez que le compte Google utilisé a toujours accès au Google Drive
2. Vérifiez que les scopes OAuth sont corrects
3. Vérifiez que le dossier parent (`GOOGLE_DRIVE_FOLDER_ID`) existe et est accessible

