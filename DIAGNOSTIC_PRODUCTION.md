# 🔍 Diagnostic Erreur Upload CV en Production

## 📋 Problème

L'upload de CV échoue en production avec le message :
> "Impossible d'uploader le CV sur Google Drive. Veuillez réessayer ou contacter l'administrateur."

## 🔧 Étapes de Diagnostic

### 1. Tester l'endpoint de diagnostic

Après le déploiement, testez :
```
https://votre-domaine.com/api/cv-connect/test-upload/
```

Cet endpoint vérifie :
- ✅ Variables d'environnement présentes
- ✅ Authentification Google Drive
- ✅ Accès au dossier Google Drive
- ✅ Permissions d'écriture

**Résultat attendu** :
```json
{
  "status": "OK",
  "summary": {
    "envConfigured": true,
    "authWorking": true,
    "writeWorking": true,
    "readyForUpload": true
  }
}
```

### 2. Tester l'upload et noter le code d'erreur

1. Allez sur : `https://votre-domaine.com/cv-connect/public/`
2. Tentez d'uploader un CV
3. Notez le **code d'erreur** affiché (ex: `Code: 403`, `Code: 404`, etc.)
4. Ouvrez la **console du navigateur** (F12) et regardez les détails dans l'onglet Console

### 3. Codes d'erreur courants et solutions

#### ❌ Code 403 : Forbidden
**Problème** : Le service account n'a pas les permissions sur le dossier Google Drive

**Solution** :
1. Aller sur [Google Drive](https://drive.google.com)
2. Trouver le dossier racine (ID dans `GOOGLE_DRIVE_FOLDER_ID`)
3. Clic droit → Partager
4. Ajouter l'email du service account (valeur de `GOOGLE_SERVICE_ACCOUNT_EMAIL`)
5. Donner les permissions **Éditeur**

#### ❌ Code 404 : Not Found
**Problème** : Le dossier Google Drive n'existe pas ou l'ID est incorrect

**Solution** :
1. Vérifier que `GOOGLE_DRIVE_FOLDER_ID` contient un ID de dossier valide
2. Vérifier que le dossier existe sur Google Drive
3. Vérifier que le service account a accès au dossier

#### ❌ Code 401 : Unauthorized
**Problème** : Authentification Google Drive échouée

**Solutions** :
1. Vérifier que `GOOGLE_SERVICE_ACCOUNT_EMAIL` est correct
2. Vérifier que `GOOGLE_PRIVATE_KEY` est correct et bien formaté :
   - Doit commencer par `-----BEGIN PRIVATE KEY-----`
   - Doit contenir les retours à la ligne (`\n`)
   - En production (Netlify), les `\n` doivent être écrits littéralement (pas de séquence d'échappement)

#### ❌ Erreur "Configuration Google Drive manquante"
**Problème** : Variables d'environnement non configurées sur Netlify

**Solution** :
1. Aller sur [Netlify Dashboard](https://app.netlify.com)
2. Sélectionner votre site
3. Aller dans **Site settings** → **Environment variables**
4. Vérifier que ces variables sont définies :
   - `GOOGLE_DRIVE_FOLDER_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`

### 4. Vérifier les variables d'environnement sur Netlify

#### Format de `GOOGLE_PRIVATE_KEY` sur Netlify

**⚠️ IMPORTANT** : Sur Netlify, la clé privée doit être collée **avec les retours à la ligne réels**, ou avec `\n` littéraux.

**Option 1 : Avec retours à la ligne réels** (recommandé)
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...
-----END PRIVATE KEY-----
```

**Option 2 : Avec \n littéraux**
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----
```

**❌ Ne PAS faire** :
- Coller tout sur une seule ligne sans `\n`
- Utiliser des guillemets autour de la clé

### 5. Redémarrer le déploiement Netlify

Après avoir modifié les variables d'environnement :
1. Aller dans **Deploys**
2. Cliquer sur **Trigger deploy** → **Deploy site**
3. Attendre que le déploiement se termine

## 🧪 Test Final

1. **Diagnostic complet** :
   ```
   https://votre-domaine.com/api/cv-connect/test-upload/
   ```
   Doit retourner `"readyForUpload": true`

2. **Test upload réel** :
   ```
   https://votre-domaine.com/cv-connect/public/
   ```
   Uploader un CV de test

3. **Vérifier dans l'admin** :
   ```
   https://votre-domaine.com/cv-connect/admin/
   ```
   Le CV doit apparaître et être accessible

## 📞 Informations à fournir si le problème persiste

Si l'erreur persiste, fournir :
1. Le **code d'erreur** affiché (ex: Code: 403)
2. Le résultat de `/api/cv-connect/test-upload/`
3. La console du navigateur (F12 → Console)
4. Confirmation que les variables d'environnement sont configurées sur Netlify

