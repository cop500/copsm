# Guide de configuration Google AdSense

## ✅ Ce qui a été fait

1. **Balise Meta AdSense** : Ajoutée dans le layout principal (`src/app/layout.tsx`)
   - Balise : `<meta name="google-adsense-account" content="ca-pub-9077690792762785" />`
   - Composant `AdSenseMeta` qui garantit la présence de la balise côté client

2. **Composant AdSense** : Créé (`src/components/AdSense.tsx`)
   - Composant réutilisable pour afficher des publicités

3. **Intégration sur la page candidatures** : 3 emplacements publicitaires ajoutés
   - En haut de page (après l'en-tête)
   - Après la liste des offres
   - En bas de page

## ⚠️ IMPORTANT : Validation du site

### Problème : "Impossible de valider votre site"

Si Google AdSense ne peut pas valider votre site, c'est probablement parce que :

1. **Le site n'est pas encore déployé** avec les modifications
2. **Google n'a pas encore crawlé** la nouvelle version
3. **Le cache de Google** n'est pas mis à jour

### Solution : Déployer d'abord, puis valider

**ÉTAPE 1 : Déployer les modifications**
```bash
git add .
git commit -m "Ajout intégration Google AdSense"
git push
```

Puis attendez que Netlify déploie (2-5 minutes).

**ÉTAPE 2 : Vérifier que la balise est présente en production**

1. Allez sur votre site en production : `https://copsm.space`
2. Faites un clic droit → "Afficher le code source de la page"
3. Cherchez : `google-adsense-account`
4. Vous devriez voir : `<meta name="google-adsense-account" content="ca-pub-9077690792762785" />`

**ÉTAPE 3 : Forcer le recrawl de Google**

1. Allez sur Google Search Console : https://search.google.com/search-console
2. Ajoutez votre site si ce n'est pas déjà fait
3. Utilisez "Demander l'indexation" pour forcer Google à crawler votre site

**ÉTAPE 4 : Réessayer la validation dans AdSense**

Après le déploiement et le recrawl :
1. Retournez sur Google AdSense
2. Cliquez sur "Valider" à nouveau
3. Attendez quelques minutes (Google peut prendre 5-10 minutes pour crawler)

## 📋 Prochaines étapes dans Google AdSense

### Étape 1 : Valider la propriété du site

1. Allez sur https://www.google.com/adsense
2. Dans la section "Validation du site", cliquez sur "Valider"
3. Vous devriez voir que la balise Meta est déjà présente
4. Cliquez sur "J'ai inséré la balise HTML <meta>"
5. Cliquez sur "Valider"

### Étape 2 : Demander l'examen du site

1. Après validation, le bouton "Demander un examen" deviendra actif
2. Cliquez dessus
3. Google examinera votre site (cela peut prendre 1-2 semaines)

### Étape 3 : Créer les unités publicitaires

Une fois le site approuvé, vous devez créer 3 unités publicitaires :

1. **Unité 1 - En haut de page** :
   - Format : Auto (responsive)
   - Nom suggéré : "Candidatures - Haut de page"
   - Copiez l'ID de l'emplacement (ex: `1234567890`)

2. **Unité 2 - Après liste** :
   - Format : Bannière horizontale
   - Nom suggéré : "Candidatures - Après liste"
   - Copiez l'ID de l'emplacement (ex: `1234567891`)

3. **Unité 3 - Bas de page** :
   - Format : Auto (responsive)
   - Nom suggéré : "Candidatures - Bas de page"
   - Copiez l'ID de l'emplacement (ex: `1234567892`)

### Étape 4 : Mettre à jour les ad slots dans le code

Une fois que vous avez les 3 IDs d'emplacements, remplacez-les dans `src/app/candidature/page.tsx` :

```typescript
// Ligne ~370 - En haut de page
<AdSense 
  adSlot="VOTRE_ID_1"  // Remplacez "1234567890" par votre vrai ID
  ...
/>

// Ligne ~477 - Après liste
<AdSense 
  adSlot="VOTRE_ID_2"  // Remplacez "1234567891" par votre vrai ID
  ...
/>

// Ligne ~779 - Bas de page
<AdSense 
  adSlot="VOTRE_ID_3"  // Remplacez "1234567892" par votre vrai ID
  ...
/>
```

## ⚠️ Important

- Les publicités ne s'afficheront **qu'après** l'approbation de votre site par Google
- Les IDs `1234567890`, `1234567891`, `1234567892` sont des **placeholders temporaires**
- Vous devez les remplacer par les vrais IDs une fois les unités créées dans AdSense
- Les publicités sont configurées pour être **responsives** et **non intrusives**

## 📍 Emplacements des publicités

Les publicités sont placées uniquement sur la page `/candidature` :
- ✅ En haut de page (discret)
- ✅ Après la liste des offres (discret)
- ✅ En bas de page (discret)

Aucune publicité sur les autres pages de l'application.

## 🧪 Test en local

Pour tester en local :
1. Lancez `npm run dev`
2. Visitez `http://localhost:3000/candidature`
3. Les emplacements publicitaires seront visibles mais vides (normal, en attente d'approbation)

## 🚀 Déploiement

Une fois les ad slots mis à jour avec les vrais IDs :
1. Testez en local
2. Poussez les changements : `git add . && git commit -m "Mise à jour ad slots AdSense" && git push`
3. Les publicités apparaîtront automatiquement après l'approbation Google

