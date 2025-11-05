# ✅ Configuration Netlify - Variables d'Environnement

## 📋 Variables à Configurer sur Netlify

Allez sur [Netlify Dashboard](https://app.netlify.com) → Votre site → **Site settings** → **Environment variables**

### ✅ Variables OAuth (À AJOUTER)

1. **GOOGLE_OAUTH_CLIENT_ID**
   - Valeur : Votre Client ID de Google Cloud Console
   - Type : Variable

2. **GOOGLE_OAUTH_CLIENT_SECRET**
   - Valeur : Votre Client Secret de Google Cloud Console
   - Type : Variable (sensitive)

3. **GOOGLE_OAUTH_REFRESH_TOKEN**
   - Valeur : Votre Refresh Token obtenu via le script
   - Type : Variable (sensitive)

4. **GOOGLE_DRIVE_FOLDER_ID**
   - Valeur : `1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`
   - Type : Variable

### ❌ Variables à SUPPRIMER (Si présentes)

- `GOOGLE_SERVICE_ACCOUNT_EMAIL` → Supprimer
- `GOOGLE_PRIVATE_KEY` → Supprimer
- `GOOGLE_DRIVE_ID` → Supprimer (si présent)

### 🔄 Après Configuration

1. **Redémarrer le déploiement** :
   - Aller dans **"Deploys"**
   - Cliquer sur **"Trigger deploy"** → **"Deploy site"**

2. **Vérifier** :
   - Attendre 2-3 minutes
   - Tester : `https://copsm.space/api/cv-connect/test-upload/`
   - Tester l'upload : `https://copsm.space/cv-connect/public/`

## ✅ Checklist

- [ ] `GOOGLE_OAUTH_CLIENT_ID` ajouté
- [ ] `GOOGLE_OAUTH_CLIENT_SECRET` ajouté
- [ ] `GOOGLE_OAUTH_REFRESH_TOKEN` ajouté
- [ ] `GOOGLE_DRIVE_FOLDER_ID` = `1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt`
- [ ] Variables Service Account supprimées (si présentes)
- [ ] Déploiement redémarré



