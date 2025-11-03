# 🔧 Configuration Google Drive avec Shared Drive

## ⚠️ Problème Identifié

L'erreur **"Service Accounts do not have storage quota"** indique que le Service Account Google n'a pas de quota de stockage disponible.

**Solution** : Utiliser un **Google Workspace Shared Drive** au lieu d'un dossier personnel.

## ✅ Configuration Requise

### 1. Créer ou Utiliser un Shared Drive

1. Aller sur [Google Drive](https://drive.google.com)
2. Dans le menu de gauche, cliquer sur **"Drive partagés"** ou **"Shared drives"**
3. Créer un nouveau Shared Drive ou utiliser un existant
4. **Nom suggéré** : "CV Connect" ou "CVs Stagiaires"

### 2. Ajouter le Service Account au Shared Drive

1. Ouvrir le Shared Drive
2. Cliquer sur le **nom du Shared Drive** en haut (ou sur le bouton avec le nom)
3. Cliquer sur **"Gérer les membres"** ou **"Manage members"**
4. Cliquer sur **"Ajouter des membres"** ou **"Add members"**
5. Entrer l'**email du Service Account** (valeur de `GOOGLE_SERVICE_ACCOUNT_EMAIL`)
6. Donner le rôle **"Gestionnaire de contenu"** ou **"Content Manager"**
7. Cliquer sur **"Envoyer"**

### 3. Obtenir l'ID du Shared Drive

1. Ouvrir le Shared Drive dans Google Drive
2. L'URL dans la barre d'adresse ressemblera à :
   ```
   https://drive.google.com/drive/folders/1oB9Vwatg_oD1jPd8URv...
   ```
3. Copier la partie après `/folders/` → C'est l'**ID du Shared Drive**
4. Mettre cet ID dans la variable d'environnement `GOOGLE_DRIVE_FOLDER_ID` sur Netlify

### 4. Configuration Netlify

1. Aller sur [Netlify Dashboard](https://app.netlify.com)
2. Sélectionner votre site
3. Aller dans **Site settings** → **Environment variables**
4. Vérifier que `GOOGLE_DRIVE_FOLDER_ID` contient l'ID du **Shared Drive** (pas un dossier personnel)

## 🔍 Vérification

### Vérifier que c'est un Shared Drive

L'ID d'un Shared Drive commence généralement par :
- Une longue chaîne de caractères alphanumériques
- Pas nécessairement dans le format court des dossiers personnels

### Tester l'accès

Utiliser l'endpoint de diagnostic :
```
https://copsm.space/api/cv-connect/test-upload/
```

Le test devrait maintenant réussir avec :
```json
{
  "status": "OK",
  "summary": {
    "readyForUpload": true
  }
}
```

## 📝 Notes Importantes

1. **Shared Drive vs Dossier Personnel** :
   - ❌ Dossier personnel = Pas de quota pour Service Accounts
   - ✅ Shared Drive = Quota illimité (selon votre plan Google Workspace)

2. **Permissions** :
   - Le Service Account doit avoir au moins le rôle **"Gestionnaire de contenu"**
   - Les fichiers créés par le Service Account seront automatiquement dans le Shared Drive

3. **Organisation** :
   - Les dossiers (Pôle/Filière) seront créés dans le Shared Drive
   - Tous les CV seront stockés dans le Shared Drive

## 🚀 Après Configuration

Une fois le Shared Drive configuré et l'ID mis à jour sur Netlify :

1. Redémarrer le déploiement Netlify (Trigger deploy)
2. Tester l'upload sur : `https://copsm.space/cv-connect/public/`
3. Vérifier que les CV apparaissent dans le Shared Drive

## ❓ Besoin d'Aide ?

Si vous n'avez pas accès à Google Workspace :
- Option 1 : Demander à l'administrateur Google Workspace de créer un Shared Drive
- Option 2 : Utiliser OAuth delegation (plus complexe, nécessite une authentification utilisateur)

