# Correction des Anciens CV - Guide

## 📋 Problème Identifié

Les anciens CV uploadés avant les corrections peuvent avoir :
- ❌ Des fichiers de 0 KB (vides)
- ❌ Des permissions incorrectes (non accessibles)
- ❌ Des URLs manquantes ou incorrectes

## ✅ Solution Implémentée

Un endpoint de correction a été créé pour :
1. ✅ Vérifier la taille des fichiers sur Google Drive
2. ✅ Corriger les permissions (partage avec "anyone with the link")
3. ✅ Régénérer les URLs manquantes ou incorrectes
4. ✅ Mettre à jour la base de données

## 🔧 Utilisation

### Option 1 : Via un Script Node.js

Créez un fichier `fix-old-cvs.js` à la racine :

```javascript
const https = require('https')

const fixOldCVs = async () => {
  const data = JSON.stringify({})
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/cv-connect/fix-old-cvs/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': 'Bearer admin-fix-2025'
    }
  }

  const req = https.request(options, (res) => {
    let responseData = ''
    
    res.on('data', (chunk) => {
      responseData += chunk
    })
    
    res.on('end', () => {
      console.log('Résultat:', JSON.parse(responseData))
    })
  })

  req.on('error', (error) => {
    console.error('Erreur:', error)
  })

  req.write(data)
  req.end()
}

fixOldCVs()
```

Puis exécutez :
```bash
node fix-old-cvs.js
```

### Option 2 : Via curl

```bash
curl -X POST http://localhost:3000/api/cv-connect/fix-old-cvs/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-fix-2025" \
  -d "{}"
```

### Option 3 : En Production (Netlify)

Remplacez `localhost:3000` par votre URL de production :
```
https://votre-domaine.com/api/cv-connect/fix-old-cvs/
```

## 📊 Résultat

Le script retourne :
```json
{
  "message": "Correction terminée: 5 corrigé(s), 2 erreur(s)",
  "total": 10,
  "fixed": 5,
  "errors": 2,
  "ok": 3,
  "details": [
    {
      "id": "xxx",
      "filename": "cv.pdf",
      "status": "fixed",
      "fixes": {
        "permissions": true,
        "url": false
      }
    }
  ]
}
```

## ⚠️ Notes Importantes

1. **Fichiers de 0 KB** : Les CV uploadés en tant que fichiers vides (0 KB) ne peuvent PAS être récupérés. Ils doivent être re-uploadés.

2. **Permissions** : Le script corrige automatiquement les permissions en partageant avec "anyone with the link".

3. **URLs** : Les URLs sont régénérées si elles sont manquantes ou incorrectes.

4. **Sécurité** : Le token `admin-fix-2025` peut être changé via la variable d'environnement `ADMIN_FIX_TOKEN`.

## 🚀 Nouveaux CV

Les **nouveaux CV** uploadés après les corrections sont automatiquement :
- ✅ Uploadés avec la bonne taille
- ✅ Configurés avec les bonnes permissions
- ✅ Liés avec les bonnes URLs

**Aucune action nécessaire pour les nouveaux CV !**

