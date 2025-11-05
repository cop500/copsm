# 🚀 Guide Complet CV Connect - Configuration de Zéro

## 📋 Informations de Base

- **Projet Google Cloud** : CV CONNECT
- **Service Account** : cv-connect-service@cv-connect-475811.iam.gserviceaccount.com
- **Compte Propriétaire** : oocopcmcsm@gmail.com
- **Dossier Google Drive** : ID = `1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`
- **Organisation** : Dossiers par Pôle → Filière (déjà paramétré)

---

## ✅ ÉTAPE 1 : Créer les Credentials OAuth dans Google Cloud

### 1.1 Accéder aux Identifiants

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionner le projet **"CV CONNECT"**
3. Menu de gauche → **"API et services"** → **"Identifiants"**

### 1.2 Créer l'OAuth Client

1. Cliquer sur **"+ CRÉER DES IDENTIFIANTS"** (Create credentials)
2. Sélectionner **"ID client OAuth"** (OAuth client ID)
3. Si demandé, configurer l'écran de consentement :
   - **Type** : Externe
   - **Nom** : CV Connect
   - **Email** : oocopcmcsm@gmail.com
   - **Scopes** : Ajouter `https://www.googleapis.com/auth/drive`
   - **Test users** : Ajouter oocopcmcsm@gmail.com

### 1.3 Configuration de l'OAuth Client

1. **Type d'application** : **"Application Web"**
2. **Nom** : `CV Connect OAuth`
3. **URIs de redirection autorisés** :
   - Cliquer sur **"+ AJOUTER UN URI"**
   - Entrer : `http://localhost:3000/api/auth/google/callback`
   - Cliquer à nouveau sur **"+ AJOUTER UN URI"**
   - Entrer : `https://copsm.space/api/auth/google/callback`
4. Cliquer sur **"CRÉER"** (Create)

### 1.4 Copier les Credentials

Une popup s'affiche avec :
- **ID client** → **COPIER** (c'est votre `GOOGLE_OAUTH_CLIENT_ID`)
- **Secret client** → Cliquer sur **"Afficher"** puis **COPIER** (c'est votre `GOOGLE_OAUTH_CLIENT_SECRET`)

**⚠️ IMPORTANT** : Notez ces deux valeurs précieusement !

---

## ✅ ÉTAPE 2 : Obtenir le Refresh Token

### 2.1 Préparer le Script

1. **Ouvrir un terminal** dans le dossier de votre projet :
   ```bash
   cd C:\Users\career center 1\cop-app
   ```

### 2.2 Exécuter le Script

```bash
node get-oauth-token.js
```

### 2.3 Entrer les Informations

Le script va demander :
1. **Client ID** : Collez celui obtenu à l'Étape 1.4
2. **Client Secret** : Collez celui obtenu à l'Étape 1.4

### 2.4 Autoriser l'Application

1. Le script affichera une **URL** → **Copiez-la complètement**
2. **Ouvrir cette URL dans votre navigateur**
3. Vous serez redirigé vers Google pour autoriser
4. **Se connecter avec** : `oocopcmcsm@gmail.com`
5. **Autoriser** l'application Google Drive
6. Après autorisation, vous serez redirigé vers une URL comme :
   ```
   http://localhost:3000/api/auth/google/callback?code=4/0AeDsm...
   ```
7. **Copier TOUT le code** après `code=` (longue chaîne de caractères)

### 2.5 Finaliser

1. **Retourner au terminal** où le script attend
2. **Coller le code** quand demandé
3. Le script affichera votre **Refresh Token** → **COPIER cette valeur**

**⚠️ IMPORTANT** : Notez précieusement le Refresh Token !

---

## ✅ ÉTAPE 3 : Configurer le Fichier .env.local

### 3.1 Créer/Mettre à Jour .env.local

1. À la racine du projet, ouvrir ou créer le fichier `.env.local`
2. **Vérifier** que ces lignes existent (ou les ajouter) :

```env
# Configuration OAuth Google Drive
GOOGLE_OAUTH_CLIENT_ID=votre_client_id_ici
GOOGLE_OAUTH_CLIENT_SECRET=votre_client_secret_ici
GOOGLE_OAUTH_REFRESH_TOKEN=votre_refresh_token_ici
GOOGLE_DRIVE_FOLDER_ID=1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt
```

### 3.2 Remplacer les Valeurs

Remplacer :
- `votre_client_id_ici` → Votre Client ID (Étape 1.4)
- `votre_client_secret_ici` → Votre Client Secret (Étape 1.4)
- `votre_refresh_token_ici` → Votre Refresh Token (Étape 2.5)

### 3.3 Garder les Autres Variables

Assurez-vous que ces variables sont toujours présentes :
```env
NEXT_PUBLIC_SUPABASE_URL=https://wkvzxcyjafehpqczspoj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
# ... autres variables
```

### 3.4 Commenter les Variables Service Account

Si présentes, commentez-les (ajouter `#` au début) :
```env
# GOOGLE_SERVICE_ACCOUNT_EMAIL=cv-connect-service@cv-connect-475811.iam.gserviceaccount.com
# GOOGLE_PRIVATE_KEY="..."
```

---

## ✅ ÉTAPE 4 : Vérifier la Configuration

### 4.1 Vérifier les Variables

```bash
node check-env-local.js
```

Le script doit afficher :
- ✅ Toutes les variables OAuth définies
- ✅ GOOGLE_DRIVE_FOLDER_ID = `1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`

### 4.2 Tester la Connexion Google Drive

```bash
node test-local-oauth.js
```

Le script doit :
- ✅ Vérifier l'authentification OAuth
- ✅ Vérifier l'accès au dossier `1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`
- ✅ Tester la création d'un fichier
- ✅ Afficher "TOUS LES TESTS RÉUSSIS !"

**Si erreur** : Vérifier les valeurs dans `.env.local` et réessayer

---

## ✅ ÉTAPE 5 : Démarrer le Serveur Local

### 5.1 Arrêter le Serveur Actuel

Si un serveur tourne, appuyer sur `Ctrl+C` dans le terminal

### 5.2 Démarrer le Serveur

```bash
npm run dev
```

### 5.3 Vérifier que ça démarre

Vous devriez voir :
```
✓ Ready in Xs
○ Local: http://localhost:3000
```

---

## ✅ ÉTAPE 6 : Tester l'Upload en Local

### 6.1 Accéder au Formulaire

1. Ouvrir votre navigateur
2. Aller sur : `http://localhost:3000/cv-connect/public/`

### 6.2 Remplir le Formulaire

1. **Pôle** : Sélectionner un pôle (ex: SANTE)
2. **Filière** : Sélectionner une filière (ex: Aide-soignant)
3. **Nom** : Votre nom
4. **Prénom** : Votre prénom
5. **Email** : Votre email
6. **Téléphone** : (optionnel)
7. **CV** : Uploader un fichier PDF de test

### 6.3 Vérifier le Résultat

1. **Si succès** :
   - Message de confirmation affiché
   - Vérifier dans Google Drive :
     - Ouvrir le dossier `1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`
     - Vérifier qu'un dossier **"SANTE"** a été créé
     - À l'intérieur, un dossier avec le nom de la filière
     - Le CV est dans ce dossier

2. **Si erreur** :
   - Noter le message d'erreur
   - Vérifier les logs dans le terminal
   - Vérifier les logs dans la console du navigateur (F12)

---

## ✅ ÉTAPE 7 : Vérifier la Traçabilité dans l'Application

### 7.1 Accéder à l'Interface Admin

1. Aller sur : `http://localhost:3000/cv-connect/admin/`
2. Se connecter avec un compte admin (business_developer)

### 7.2 Vérifier la Liste des CV

1. Votre CV de test doit apparaître dans la liste
2. Vérifier que :
   - Le nom et prénom sont corrects
   - Le pôle et la filière sont corrects
   - Le lien **"Télécharger"** fonctionne (ouvre le CV sur Google Drive)

### 7.3 Vérifier la Base de Données

Les informations sont stockées dans Supabase :
- Table : `cv_connect_submissions`
- Contient : nom, prénom, email, pôle, filière, lien Google Drive, etc.
- Le fichier lui-même est sur Google Drive (pas dans Supabase)

---

## ✅ ÉTAPE 8 : Vérifier l'Organisation par Pôle/Filière

### 8.1 Structure Attendue dans Google Drive

```
📁 Dossier racine (1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt)
  📁 SANTE
    📁 Aide-soignant
      📄 CV_Nom_Prenom_1234567890.pdf
    📁 Autre filière
      📄 CV_Autre_1234567891.pdf
  📁 AUTRE_POLE
    📁 Filière du pôle
      📄 CV_...
```

### 8.2 Tester avec Plusieurs CVs

1. Uploader un CV pour **Pôle 1 / Filière 1**
2. Uploader un CV pour **Pôle 1 / Filière 2**
3. Uploader un CV pour **Pôle 2 / Filière 1**

Vérifier dans Google Drive que :
- Les dossiers sont bien organisés par pôle puis filière
- Chaque CV est dans le bon dossier

---

## ✅ ÉTAPE 9 : Vérifier les Logs

### 9.1 Logs du Serveur

Dans le terminal où tourne `npm run dev`, vous devriez voir :
```
[Google Drive Auth] ✅ Utilisation OAuth 2.0 (Google Drive personnel)
[Google Drive Auth] ✅ Authentification OAuth créée avec succès
[Google Drive] Création structure dossiers: SANTE/Aide-soignant
[Google Drive] ✅ Dossier pôle créé/trouvé: ...
[Google Drive] ✅ Dossier filière créé/trouvé: ...
[Google Drive] ✅ Fichier uploadé avec succès
```

### 9.2 Si Problème

Si vous voyez des erreurs :
- **"File not found"** : Vérifier que l'ID du dossier est correct
- **"Unauthorized"** : Vérifier le Refresh Token
- **"storage quota"** : Normal, utilise OAuth au lieu de Service Account

---

## ✅ ÉTAPE 10 : Préparer pour Production (Netlify)

### 10.1 Configuration Netlify

1. Aller sur [Netlify Dashboard](https://app.netlify.com)
2. Votre site → **"Site settings"** → **"Environment variables"**

### 10.2 Ajouter les Variables

Ajouter exactement les mêmes variables que dans `.env.local` :
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID` = `1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`

### 10.3 Supprimer les Anciennes Variables

Supprimer (si présentes) :
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

### 10.4 Redéployer

1. **"Deploys"** → **"Trigger deploy"** → **"Deploy site"**
2. Attendre 2-3 minutes
3. Tester en production

---

## 📋 Checklist Finale

- [ ] OAuth Client créé dans Google Cloud
- [ ] Client ID et Secret notés
- [ ] Refresh Token obtenu via script
- [ ] Fichier `.env.local` configuré avec toutes les variables
- [ ] Test `check-env-local.js` réussi
- [ ] Test `test-local-oauth.js` réussi
- [ ] Serveur local démarré (`npm run dev`)
- [ ] Upload de CV test réussi en local
- [ ] CV visible dans Google Drive (bonne organisation pôle/filière)
- [ ] CV visible dans l'interface admin de l'application
- [ ] Lien Google Drive fonctionne dans l'admin
- [ ] Configuration Netlify prête (variables d'environnement)

---

## 🎯 Résumé

1. ✅ **OAuth Client** créé → Client ID et Secret
2. ✅ **Refresh Token** obtenu via script
3. ✅ **.env.local** configuré
4. ✅ **Tests locaux** réussis
5. ✅ **Upload fonctionne** en local
6. ✅ **Organisation** pôle/filière vérifiée
7. ✅ **Traçabilité** dans l'application vérifiée
8. ✅ **Prêt pour production**

Une fois toutes ces étapes complétées, tout devrait fonctionner ! 🎉

