// Script de test pour vérifier l'affichage de l'image
// À exécuter dans la console du navigateur sur la page /ambassadeurs

console.log('🖼️ Test de l\'affichage de l\'image de fond');

// Test 1: Vérifier que l'image est chargée
const img = document.querySelector('img[alt="Arrière-plan du formulaire"]');
if (img) {
  console.log('✅ Image trouvée dans le DOM');
  console.log('Source:', img.src);
  console.log('Dimensions:', img.naturalWidth, 'x', img.naturalHeight);
} else {
  console.log('❌ Image non trouvée dans le DOM');
}

// Test 2: Vérifier le composant BackgroundImage
const backgroundDiv = document.querySelector('.absolute.inset-0');
if (backgroundDiv) {
  console.log('✅ Div d\'arrière-plan trouvée');
  const computedStyle = window.getComputedStyle(backgroundDiv);
  console.log('Position:', computedStyle.position);
  console.log('Z-index:', computedStyle.zIndex);
} else {
  console.log('❌ Div d\'arrière-plan non trouvée');
}

// Test 3: Vérifier l'overlay
const overlay = document.querySelector('.bg-black.bg-opacity-40');
if (overlay) {
  console.log('✅ Overlay de transparence trouvé');
} else {
  console.log('❌ Overlay de transparence non trouvé');
}

// Test 4: Vérifier le contenu principal
const mainContent = document.querySelector('.relative.z-10');
if (mainContent) {
  console.log('✅ Contenu principal trouvé');
} else {
  console.log('❌ Contenu principal non trouvé');
}

// Test 5: Vérifier les erreurs de chargement d'image
const images = document.querySelectorAll('img');
let hasErrors = false;
images.forEach((img, index) => {
  img.onerror = () => {
    console.log(`❌ Erreur de chargement de l'image ${index}:`, img.src);
    hasErrors = true;
  };
});

if (!hasErrors) {
  console.log('✅ Aucune erreur de chargement d\'image détectée');
}

console.log('🎯 Tests terminés - Vérifiez les résultats ci-dessus');

// Instructions pour les tests manuels
console.log(`
📋 Tests manuels à effectuer :

1. **Test visuel :**
   - L'image formulaire7.jpg doit être visible en arrière-plan
   - L'image doit couvrir tout l'écran
   - L'overlay sombre doit être visible par-dessus l'image

2. **Test de performance :**
   - Ouvrir les outils de développement (F12)
   - Aller dans l'onglet Network
   - Recharger la page
   - Vérifier que formulaire7.jpg se charge (statut 200)

3. **Test de responsivité :**
   - Redimensionner la fenêtre
   - L'image doit s'adapter correctement
   - Tester sur mobile (F12 > Mode mobile)

4. **Test de contraste :**
   - Vérifier que le texte blanc est lisible
   - Vérifier que le formulaire transparent est visible
   - Vérifier que les boutons sont cliquables

Si l'image ne s'affiche toujours pas :
- Vérifier que le fichier formulaire7.jpg existe dans le dossier public
- Vérifier les erreurs dans la console du navigateur
- Essayer de charger l'image directement : http://localhost:3000/formulaire7.jpg
`);

