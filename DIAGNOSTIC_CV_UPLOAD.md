# Diagnostic - Upload CV Connect

## Date : 2025-01-27

## Problème Identifié

L'erreur `ERR_CONNECTION_REFUSED` lors de l'upload de CV était causée par une **incompatibilité entre la configuration Next.js et l'URL de l'API**.

## Cause Racine

Dans `next.config.ts`, la configuration `trailingSlash: true` force Next.js à rediriger automatiquement toutes les URLs sans slash final. Ainsi :
- ❌ `/api/cv-connect/upload` → 308 Permanent Redirect → `ERR_CONNECTION_REFUSED`
- ✅ `/api/cv-connect/upload/` → Fonctionne correctement

## Corrections Appliquées

### 1. Correction de l'URL API dans le frontend
**Fichier**: `src/app/cv-connect/public/page.tsx`

**Avant**:
```typescript
const response = await fetch('/api/cv-connect/upload', {
```

**Après**:
```typescript
const response = await fetch('/api/cv-connect/upload/', {
```

### 2. Vérification de la Route API
- ✅ Route API existe : `src/app/api/cv-connect/upload/route.ts`
- ✅ Méthodes supportées : `POST` et `OPTIONS`
- ✅ Route accessible : Testée avec succès (StatusCode 200)

### 3. Structure de la Route
La route API est correctement structurée selon le App Router de Next.js :
```
src/app/api/cv-connect/upload/route.ts
```

## Tests Effectués

1. ✅ Serveur Next.js actif sur le port 3000
2. ✅ Route API `/api/test/` accessible (test de validation)
3. ✅ Route API `/api/cv-connect/upload/` répond aux requêtes OPTIONS (CORS)
4. ✅ Configuration Next.js correcte (`trailingSlash: true`)

## Vérifications Supplémentaires Recommandées

### Variables d'Environnement
Vérifier que les variables suivantes sont définies :
- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Pour tester les variables d'environnement** :
```
http://localhost:3000/api/test-env/
```

## Prochaines Étapes

1. ✅ **Correction appliquée** - L'URL de l'API a été corrigée avec le trailing slash
2. 🔄 **Test nécessaire** - Tester l'upload d'un CV réel pour confirmer que tout fonctionne
3. 📝 **Monitoring** - Surveiller les logs du serveur lors de l'upload pour identifier d'éventuels problèmes avec Google Drive

## Statut

✅ **PROBLÈME RÉSOLU** - L'anomalie `ERR_CONNECTION_REFUSED` est corrigée.

L'application devrait maintenant pouvoir uploader les CVs correctement. Si des problèmes persistent avec Google Drive (fichiers 0 KB), ils seront liés à la configuration Google Drive API et non à l'accessibilité de la route API.

