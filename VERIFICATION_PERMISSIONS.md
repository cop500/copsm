# ✅ Vérification des Permissions Shared Drive

## 📋 Après avoir mis à jour l'ID sur Netlify

Maintenant que l'ID `1dFT5WQuz8_ntUDudOYJ-qkAq2UgwjCas` est configuré, vérifions que tout fonctionne.

## 🔍 Étape 1 : Vérifier le Redéploiement Netlify

1. Aller sur [Netlify Dashboard](https://app.netlify.com)
2. Vérifier que le **dernier déploiement est terminé** (status: "Published")
3. Attendre 2-3 minutes après le redéploiement

## 🧪 Étape 2 : Tester la Configuration

### Option A : Utiliser le script de test

```bash
node test-shared-drive.js
```

### Option B : Tester via le navigateur

Ouvrir dans votre navigateur :
```
https://copsm.space/api/cv-connect/test-upload/
```

Cela va tester :
- ✅ Variables d'environnement
- ✅ Authentification Google Drive
- ✅ Accès au Shared Drive
- ✅ Permissions d'écriture

## 🔐 Étape 3 : Vérifier les Permissions (Si nécessaire)

Si le test indique "File not found" ou "Permission denied" :

### Vérifier que le Service Account est membre du Shared Drive

1. Aller sur [Google Drive](https://drive.google.com)
2. Ouvrir le Shared Drive avec l'ID `1dFT5WQuz8_ntUDudOYJ-qkAq2UgwjCas`
3. Cliquer sur le **nom du Shared Drive** en haut
4. **"Gérer les membres"** ou **"Manage members"**
5. Vérifier que l'email du Service Account est présent :
   - Email du Service Account : Voir dans `GOOGLE_SERVICE_ACCOUNT_EMAIL` sur Netlify
   - Rôle minimum : **"Gestionnaire de contenu"** ou **"Content Manager"**

### Si le Service Account n'est pas membre :

1. Dans "Gérer les membres", cliquer sur **"Ajouter des membres"**
2. Entrer l'email du Service Account
3. Donner le rôle **"Gestionnaire de contenu"**
4. Cliquer sur **"Envoyer"**

## 🧪 Étape 4 : Tester l'Upload Réel

Une fois le test de configuration réussi :

1. Aller sur : `https://copsm.space/cv-connect/public/`
2. Remplir le formulaire et uploader un CV de test
3. Vérifier que l'upload réussit

## 📊 Vérification dans Google Drive

Après un upload réussi :

1. Aller sur [Google Drive](https://drive.google.com)
2. Ouvrir le Shared Drive
3. Vérifier que :
   - Un dossier "SANTE" (ou le pôle sélectionné) a été créé
   - À l'intérieur, un dossier avec le nom de la filière
   - Le CV est présent dans ce dossier

## ❌ Si ça ne fonctionne toujours pas

### Erreur "File not found"

- ✅ Vérifier que l'ID dans Netlify correspond bien à l'URL du Shared Drive
- ✅ Vérifier que le Service Account est membre du Shared Drive
- ✅ Vérifier que le redéploiement Netlify est terminé

### Erreur "Permission denied"

- ✅ Vérifier que le Service Account a le rôle "Gestionnaire de contenu" minimum
- ✅ Vérifier que le Shared Drive existe bien

### Erreur "storage quota"

- ✅ Vérifier que c'est bien un Shared Drive (pas un dossier personnel)
- ✅ Vérifier les quotas du compte Google Workspace

## ✅ Checklist Finale

- [ ] ID mis à jour sur Netlify : `1dFT5WQuz8_ntUDudOYJ-qkAq2UgwjCas`
- [ ] Redéploiement Netlify terminé
- [ ] Test de configuration réussi (`/api/cv-connect/test-upload/`)
- [ ] Service Account membre du Shared Drive
- [ ] Service Account avec rôle "Gestionnaire de contenu"
- [ ] Upload de test réussi

Une fois toutes ces étapes complétées, l'upload devrait fonctionner ! 🎉

