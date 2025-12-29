# 🔍 Diagnostic de Performance - Application COP

## Problèmes Identifiés

### 1. ⚠️ Double Authentification (CRITIQUE)
**Problème** : `UserContext` et `useAuth` font tous les deux des appels Supabase séparés pour récupérer le profil utilisateur.

**Impact** :
- 2 requêtes Supabase à chaque chargement de page
- Double vérification de session
- Re-renders inutiles
- Latence accrue

**Fichiers concernés** :
- `src/contexts/UserContext.tsx` (ligne 61-165)
- `src/hooks/useAuth.ts` (ligne 35-92)
- `src/app/layout.tsx` (ligne 9 - utilise useAuth)

### 2. ⚠️ Layout.tsx - Re-renders Excessifs
**Problème** : Le layout utilise `useAuth()` qui se déclenche à chaque changement de route.

**Impact** :
- Re-render complet du layout à chaque navigation
- Blocage de l'UI pendant le chargement
- Expérience utilisateur dégradée

### 3. ⚠️ Rafraîchissement Périodique Agressif
**Problème** : `UserContext` rafraîchit la session toutes les 15 minutes, même si l'utilisateur est inactif.

**Impact** :
- Requêtes inutiles en arrière-plan
- Consommation de ressources
- Potentiels blocages UI

### 4. ⚠️ Hooks Sans Cache Optimisé
**Problème** : Plusieurs hooks font des requêtes sans cache ou avec cache insuffisant :
- `useStagiaires` : Pas de cache
- `useCandidatures` : Cache minimal
- `useDemandesEntreprises` : Pas de cache visible

**Impact** :
- Requêtes répétées pour les mêmes données
- Latence accrue
- Charge serveur inutile

### 5. ⚠️ Requêtes Séquentielles au lieu de Parallèles
**Problème** : Certains composants chargent les données séquentiellement.

**Exemple** : `EspaceAmbassadeurs.tsx` charge :
1. Inscriptions ateliers
2. Puis présences événements
3. Puis stagiaires

**Impact** :
- Temps de chargement = somme de tous les temps
- UI bloquée plus longtemps

### 6. ⚠️ Pas de Memoization React
**Problème** : Composants non mémorisés causant des re-renders inutiles.

**Impact** :
- Re-calculs inutiles
- Re-renders en cascade
- Performance dégradée

### 7. ⚠️ React Query Non Utilisé
**Problème** : `@tanstack/react-query` est installé mais pas utilisé.

**Impact** :
- Pas de cache automatique
- Pas de gestion d'état optimisée
- Pas de retry automatique
- Pas de synchronisation entre composants

## Solutions Proposées

### Solution 1 : Unifier l'Authentification ✅ PRIORITÉ HAUTE
- Utiliser UN SEUL système d'authentification
- Faire en sorte que `useAuth` utilise `UserContext` au lieu de faire ses propres appels
- Éliminer la duplication

### Solution 2 : Optimiser le Layout ✅ PRIORITÉ HAUTE
- Utiliser `React.memo` pour éviter les re-renders
- Déplacer la logique d'authentification dans un composant séparé
- Utiliser `useMemo` pour les calculs coûteux

### Solution 3 : Implémenter React Query ✅ PRIORITÉ MOYENNE
- Remplacer les hooks personnalisés par React Query
- Bénéficier du cache automatique
- Synchronisation entre composants

### Solution 4 : Optimiser les Requêtes ✅ PRIORITÉ MOYENNE
- Utiliser `Promise.all()` pour les requêtes parallèles
- Ajouter du cache dans tous les hooks
- Limiter les colonnes sélectionnées

### Solution 5 : Memoization ✅ PRIORITÉ BASSE
- Wrapper les composants avec `React.memo`
- Utiliser `useMemo` et `useCallback` stratégiquement
- Éviter les re-renders inutiles

### Solution 6 : Réduire le Rafraîchissement ✅ PRIORITÉ BASSE
- Augmenter l'intervalle de rafraîchissement (30 min au lieu de 15)
- Rafraîchir seulement si l'utilisateur est actif
- Utiliser `visibilitychange` API

## Plan d'Action

1. **Phase 1** : Unifier l'authentification (Impact immédiat)
2. **Phase 2** : Optimiser le layout (Impact immédiat)
3. **Phase 3** : Implémenter React Query progressivement
4. **Phase 4** : Optimiser les requêtes
5. **Phase 5** : Memoization et finitions

## Métriques Attendues

- **Temps de chargement initial** : -50%
- **Temps de navigation** : -70%
- **Requêtes Supabase** : -60%
- **Re-renders** : -40%
- **Expérience utilisateur** : Significativement améliorée

