# 🔐 Guide Étape par Étape : Configuration OAuth 2.0 pour Google Drive Personnel

## 📋 Projet Existant : CV CONNECT

Vous avez déjà un projet "CV CONNECT" dans Google Cloud Console. Suivez ces étapes dans l'ordre.

---

## ✅ ÉTAPE 1 : Configurer l'Écran de Consentement OAuth

1. Dans Google Cloud Console, dans le menu de gauche sous "API et services"
2. Cliquer sur **"Écran de consentement OAuth"** (OAuth consent screen)
3. Vous verrez probablement un écran vous demandant de configurer
4. **Type d'utilisateur** : Choisir **"Externe"** (External) - c'est gratuit
5. Cliquer sur **"Créer"** (Create)
6. **Remplir le formulaire** :
   - **Nom de l'application** : `CV Connect`
   - **Adresse e-mail de support utilisateur** : Votre email
   - **Logo de l'application** : (Optionnel, peut être laissé vide)
   - **Domaine d'accueil de l'application** : `copsm.space`
   - **Adresses e-mail de contact des développeurs** : Votre email
7. **Scopes** (Autorisations) :
   - Cliquer sur **"ADD OR REMOVE SCOPES"**
   - Chercher : `https://www.googleapis.com/auth/drive`
   - Cocher la case **"../auth/drive"**
   - Cliquer sur **"UPDATE"**
8. **Utilisateurs de test** :
   - Cliquer sur **"ADD USERS"**
   - Entrer votre email Google (celui avec lequel vous voulez utiliser le Drive)
   - Cliquer sur **"ADD"**
9. **Enregistrer et continuer** :
   - Cliquer sur **"SAVE AND CONTINUE"** à chaque étape
   - À la dernière étape, cliquer sur **"BACK TO DASHBOARD"**

---

## ✅ ÉTAPE 2 : Créer l'ID Client OAuth 2.0

1. Dans le menu de gauche, sous "API et services"
2. Cliquer sur **"Identifiants"** (Credentials)
3. Cliquer sur le bouton **"+ CRÉER DES IDENTIFIANTS"** (Create credentials)
4. Dans le menu déroulant, sélectionner **"ID client OAuth"** (OAuth client ID)
5. Si demandé, choisir **"Application Web"** (Web application)
6. **Remplir le formulaire** :
   - **Nom** : `CV Connect OAuth`
   - **URIs de redirection autorisés** :
     - Cliquer sur **"+ AJOUTER UN URI"** (Add URI)
     - Entrer : `http://localhost:3000/api/auth/google/callback`
     - Cliquer à nouveau sur **"+ AJOUTER UN URI"**
     - Entrer : `https://copsm.space/api/auth/google/callback`
7. Cliquer sur **"CRÉER"** (Create)
8. **IMPORTANT** : Une fenêtre popup s'ouvrira avec :
   - **Votre ID client** : Copiez-le (ex: `123456789-abc.apps.googleusercontent.com`)
   - **Votre secret client** : Cliquez sur "Afficher" puis copiez-le
   - **⚠️ Notez-les bien, vous en aurez besoin !**

---

## ✅ ÉTAPE 3 : Créer un Dossier dans votre Google Drive

1. Aller sur [Google Drive](https://drive.google.com)
2. Cliquer sur **"Nouveau"** → **"Dossier"**
3. Nommer le dossier : **"CV Connect"** ou **"CVs Stagiaires"**
4. Cliquer sur **"Créer"**
5. **Ouvrir le dossier** créé
6. Regarder l'URL dans la barre d'adresse :
   ```
   https://drive.google.com/drive/folders/1ABC123def456ghi789jkl...
   ```
7. **Copier la partie après `/folders/`** → C'est l'**ID de votre dossier**
   - Exemple : Si l'URL est `...folders/1dFT5WQuz8_ntUDudOYJ-qkAq2UgwjCas`
   - L'ID est : `1dFT5WQuz8_ntUDudOYJ-qkAq2UgwjCas`
8. **Garder cet ID** pour l'étape suivante

---

## ✅ ÉTAPE 4 : Obtenir le Refresh Token

### Option A : Utiliser le Script Fourni (Recommandé)

1. **Ouvrir un terminal** dans le dossier de votre projet
2. **Exécuter le script** :
   ```bash
   node get-oauth-token.js
   ```
3. Le script va vous demander :
   - **Client ID** : Collez celui obtenu à l'Étape 2
   - **Client Secret** : Collez celui obtenu à l'Étape 2
4. Le script va afficher une **URL** → **Copiez-la**
5. **Ouvrir cette URL dans votre navigateur**
6. **Autoriser** l'application Google Drive
7. Vous serez redirigé vers une URL avec un **code** :
   ```
   http://localhost:3000/api/auth/google/callback?code=4/0AeDsm...
   ```
8. **Copier la partie après `code=`** (tout le code long)
9. **Coller ce code** dans le terminal où le script attend
10. Le script va vous donner votre **Refresh Token** → **Notez-le précieusement !**

### Option B : Utiliser Google OAuth Playground

1. Aller sur [Google OAuth Playground](https://developers.google.com/oauthplayground/)
2. Cliquer sur l'icône **⚙️ (Settings)** en haut à droite
3. Cocher **"Use your own OAuth credentials"**
4. Entrer votre **Client ID** et **Client Secret**
5. Dans la liste de gauche, chercher **"Drive API v3"**
6. Cocher **"https://www.googleapis.com/auth/drive"**
7. Cliquer sur **"Authorize APIs"**
8. Autoriser avec votre compte Google
9. Cliquer sur **"Exchange authorization code for tokens"**
10. **Copier le Refresh Token** affiché

---

## ✅ ÉTAPE 5 : Configurer Netlify

1. Aller sur [Netlify Dashboard](https://app.netlify.com)
2. Sélectionner votre site
3. Aller dans **"Site settings"** → **"Environment variables"**
4. **Supprimer** les anciennes variables Service Account (si présentes) :
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
5. **Ajouter** les nouvelles variables OAuth :
   - Cliquer sur **"Add a variable"**
   - **Variable** : `GOOGLE_OAUTH_CLIENT_ID`
   - **Value** : Votre Client ID (Étape 2)
   - Cliquer sur **"Save"**
   - Répéter pour :
     - `GOOGLE_OAUTH_CLIENT_SECRET` = Votre Client Secret (Étape 2)
     - `GOOGLE_OAUTH_REFRESH_TOKEN` = Votre Refresh Token (Étape 4)
     - `GOOGLE_DRIVE_FOLDER_ID` = L'ID de votre dossier (Étape 3)
6. **Vérifier** que toutes les variables sont ajoutées :
   - ✅ `GOOGLE_OAUTH_CLIENT_ID`
   - ✅ `GOOGLE_OAUTH_CLIENT_SECRET`
   - ✅ `GOOGLE_OAUTH_REFRESH_TOKEN`
   - ✅ `GOOGLE_DRIVE_FOLDER_ID`
7. **Redémarrer le déploiement** :
   - Aller dans **"Deploys"**
   - Cliquer sur **"Trigger deploy"** → **"Deploy site"**

---

## ✅ ÉTAPE 6 : Tester

1. **Attendre** que le déploiement Netlify soit terminé (2-3 minutes)
2. **Tester la configuration** :
   - Ouvrir : `https://copsm.space/api/cv-connect/test-upload/`
   - Devrait afficher `"readyForUpload": true`
3. **Tester l'upload réel** :
   - Aller sur : `https://copsm.space/cv-connect/public/`
   - Remplir le formulaire et uploader un CV
   - Vérifier que ça fonctionne !

---

## 📝 Résumé des Informations Nécessaires

| Information | Où la trouver |
|------------|---------------|
| **Client ID** | Google Cloud Console → Credentials → OAuth Client ID |
| **Client Secret** | Google Cloud Console → Credentials → OAuth Client ID |
| **Refresh Token** | Script `get-oauth-token.js` ou OAuth Playground |
| **Folder ID** | URL de votre dossier Google Drive |

---

## ⚠️ Notes Importantes

1. **Refresh Token** : Ne le partagez jamais ! C'est comme un mot de passe
2. **Quota** : Vous utiliserez votre quota Google Drive personnel (15 Go)
3. **Expiration** : Le Refresh Token peut expirer, il faudra le régénérer
4. **Sécurité** : Ne commitez jamais ces valeurs dans Git

---

## 🆘 En cas de Problème

Si l'upload ne fonctionne pas après configuration :
1. Vérifier les logs Netlify (Functions → Logs)
2. Tester avec `/api/cv-connect/test-upload/`
3. Vérifier que toutes les variables sont bien définies sur Netlify
4. Vérifier que le Refresh Token est valide

---

## ✅ Checklist Finale

- [ ] Écran de consentement OAuth configuré
- [ ] ID Client OAuth créé (avec Client ID et Secret notés)
- [ ] Dossier créé dans Google Drive (ID noté)
- [ ] Refresh Token obtenu
- [ ] Variables configurées sur Netlify
- [ ] Déploiement redémarré
- [ ] Test réussi

Une fois toutes ces étapes complétées, l'upload devrait fonctionner avec votre Google Drive personnel ! 🎉

