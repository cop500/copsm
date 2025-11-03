# 🔧 Guide : Résoudre "File not found" avec Shared Drive

## ❌ Erreur Actuelle

```
File not found: 1dFT5WQuz8_ntUDudOYJ-qkAq2UgwjCas
```

Cela signifie que :
1. ❌ Le Service Account n'a pas accès au Shared Drive
2. ❌ L'ID du Shared Drive est incorrect
3. ❌ Il faut utiliser un dossier DANS le Shared Drive, pas le Shared Drive lui-même

## ✅ Solution 1 : Utiliser un Dossier dans le Shared Drive (Recommandé)

### Étape 1 : Créer un dossier dans le Shared Drive

1. Aller sur [Google Drive](https://drive.google.com)
2. Ouvrir le **Shared Drive** (ex: "CV Connect")
3. Créer un nouveau dossier : **"CVs"** ou **"CV Connect"**
4. Cliquer avec le bouton droit sur ce dossier → **"Partager"**
5. Partager avec l'email du Service Account avec le rôle **"Gestionnaire de contenu"**

### Étape 2 : Obtenir l'ID du Dossier

1. Ouvrir le dossier créé
2. L'URL ressemblera à :
   ```
   https://drive.google.com/drive/folders/1ABC123def456...
   ```
3. Copier la partie après `/folders/` → C'est l'**ID du dossier**

### Étape 3 : Mettre à jour Netlify

1. Aller sur [Netlify Dashboard](https://app.netlify.com)
2. Votre site → **Site settings** → **Environment variables**
3. Mettre à jour `GOOGLE_DRIVE_FOLDER_ID` avec l'**ID du dossier** (pas le Shared Drive)
4. Redémarrer le déploiement

## ✅ Solution 2 : Vérifier les Permissions du Service Account

### Vérifier l'accès au Shared Drive

1. Aller sur [Google Drive](https://drive.google.com)
2. Ouvrir le **Shared Drive**
3. Cliquer sur le **nom du Shared Drive** en haut
4. **"Gérer les membres"**
5. Vérifier que l'email du Service Account est présent
6. Si absent, l'ajouter avec le rôle **"Gestionnaire de contenu"** ou **"Content Manager"**

### Vérifier l'ID du Shared Drive

1. Dans Google Drive, ouvrir le Shared Drive
2. L'URL ressemblera à :
   ```
   https://drive.google.com/drive/folders/1dFT5WQuz8_ntUDudOYJ-qkAq2UgwjCas
   ```
3. Vérifier que l'ID correspond à celui dans `GOOGLE_DRIVE_FOLDER_ID`

## 🔍 Diagnostic

### Test 1 : Vérifier l'accès via l'API

Utiliser l'endpoint de diagnostic :
```
https://copsm.space/api/cv-connect/test-upload/
```

### Test 2 : Vérifier manuellement

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Ouvrir le projet contenant le Service Account
3. Vérifier l'email du Service Account
4. Aller dans Google Drive et vérifier que cet email a accès au Shared Drive

## 📝 Notes Importantes

1. **Shared Drive vs Dossier** :
   - Un **Shared Drive** est un conteneur (comme un Drive personnel)
   - Un **dossier** est à l'intérieur du Shared Drive
   - Il est plus simple d'utiliser un dossier dans le Shared Drive

2. **Permissions** :
   - Le Service Account doit être membre du Shared Drive
   - Le Service Account doit avoir accès au dossier (si on utilise un dossier)

3. **ID** :
   - L'ID d'un Shared Drive commence souvent par `1...`
   - L'ID d'un dossier ressemble aussi à `1...`
   - La différence : le Shared Drive est le conteneur racine, le dossier est à l'intérieur

## ✅ Après Configuration

1. Redémarrer le déploiement Netlify
2. Tester l'upload : `https://copsm.space/cv-connect/public/`
3. Vérifier les logs pour confirmer que ça fonctionne

## 🆘 Si ça ne fonctionne toujours pas

Vérifier :
1. ✅ Le Service Account est bien membre du Shared Drive
2. ✅ L'ID dans `GOOGLE_DRIVE_FOLDER_ID` est correct
3. ✅ Les permissions sont "Gestionnaire de contenu" minimum
4. ✅ Le Shared Drive existe bien

Si tout est correct et que ça ne fonctionne toujours pas, il peut être nécessaire d'utiliser un dossier spécifique dans le Shared Drive plutôt que le Shared Drive lui-même.

