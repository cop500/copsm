# 🚀 Solution Simple : Service Account Google Drive

## ✅ Pourquoi cette solution ?
- ❌ **OAuth 2.0** : Le refresh token expire → erreur `invalid_grant`
- ✅ **Service Account** : Jamais d'expiration → solution définitive

---

## 📝 3 Étapes Simples

### ÉTAPE 1 : Créer le Service Account (5 minutes)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. **IAM & Admin** > **Service Accounts** > **+ CREATE SERVICE ACCOUNT**
4. Nom : `cv-connect-service` → **CREATE AND CONTINUE**
5. Rôle : **Editor** → **CONTINUE** → **DONE**
6. Cliquez sur le Service Account créé
7. Onglet **KEYS** > **ADD KEY** > **Create new key** > **JSON** > **CREATE**
8. ⚠️ **SAUVEGARDEZ** le fichier JSON téléchargé

---

### ÉTAPE 2 : Partager le dossier Google Drive (2 minutes)

1. Ouvrez le fichier JSON téléchargé
2. Copiez l'email (ex: `cv-connect-service@...iam.gserviceaccount.com`)
3. Allez sur [Google Drive](https://drive.google.com/)
4. Trouvez ou créez votre dossier "CV Connect"
5. **Clic droit** > **Partager** (Share)
6. Collez l'email du Service Account
7. Rôle : **Éditeur** (Editor) → **Envoyer**
8. Copiez l'**ID du dossier** depuis l'URL :
   - URL : `https://drive.google.com/drive/folders/1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`
   - ID : `1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`

---

### ÉTAPE 3 : Configurer les variables (3 minutes)

#### En local (.env.local)
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=cv-connect-service@votre-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_ICI\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt
```

**Où trouver ces valeurs ?**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` : Dans le JSON → `client_email`
- `GOOGLE_PRIVATE_KEY` : Dans le JSON → `private_key` (copiez tout avec les `\n`)
- `GOOGLE_DRIVE_FOLDER_ID` : ID du dossier partagé (étape 2)

#### Sur Netlify
1. [Netlify Dashboard](https://app.netlify.com) → Votre site → **Environment variables**
2. Ajoutez les 3 variables ci-dessus
3. **Deploy site** pour redéployer

---

## ✅ Test

1. Redémarrez votre serveur : `npm run dev`
2. Testez l'upload d'un CV
3. ✅ Ça marche ! Plus jamais d'erreur `invalid_grant`

---

## 🆘 Besoin d'aide ?

Si vous bloquez sur une étape, consultez le guide détaillé : `GUIDE_MIGRATION_SERVICE_ACCOUNT.md`

