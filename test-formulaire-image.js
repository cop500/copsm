// Script de test pour le formulaire avec image de fond
// À exécuter dans la console du navigateur sur la page /ambassadeurs

console.log('🎨 Test du formulaire avec image de fond');

// Test 1: Vérifier que l'image de fond est chargée
const bodyElement = document.body;
const computedStyle = window.getComputedStyle(bodyElement);
const backgroundImage = computedStyle.backgroundImage;

if (backgroundImage && backgroundImage.includes('formulaire7.jpg')) {
  console.log('✅ Image de fond formulaire7.jpg chargée');
} else {
  console.log('❌ Image de fond non trouvée');
}

// Test 2: Vérifier l'overlay de transparence
const overlay = document.querySelector('.bg-black.bg-opacity-40');
if (overlay) {
  console.log('✅ Overlay de transparence présent');
} else {
  console.log('❌ Overlay de transparence manquant');
}

// Test 3: Vérifier la transparence du formulaire
const formContainer = document.querySelector('.bg-white.bg-opacity-95');
if (formContainer) {
  console.log('✅ Formulaire avec transparence présent');
} else {
  console.log('❌ Formulaire avec transparence manquant');
}

// Test 4: Vérifier les titres centrés
const title = document.querySelector('h1');
if (title && title.classList.contains('text-center')) {
  console.log('✅ Titre centré présent');
} else {
  console.log('❌ Titre centré manquant');
}

// Test 5: Vérifier les ombres sur le texte
const titleWithShadow = document.querySelector('.drop-shadow-lg');
if (titleWithShadow) {
  console.log('✅ Ombres sur le texte présentes');
} else {
  console.log('❌ Ombres sur le texte manquantes');
}

// Test 6: Vérifier l'effet de flou
const blurredElement = document.querySelector('.backdrop-blur-sm');
if (blurredElement) {
  console.log('✅ Effet de flou présent');
} else {
  console.log('❌ Effet de flou manquant');
}

// Test 7: Vérifier la responsivité
const responsiveContainer = document.querySelector('.max-w-2xl');
if (responsiveContainer) {
  console.log('✅ Container responsive présent');
} else {
  console.log('❌ Container responsive manquant');
}

console.log('🎯 Tests visuels terminés - Vérifiez les résultats ci-dessus');

// Instructions pour les tests manuels
console.log(`
📋 Tests manuels à effectuer :

1. **Test visuel général :**
   - L'image formulaire7.jpg doit être visible en arrière-plan
   - Le formulaire doit avoir un effet de transparence
   - Les titres doivent être centrés et lisibles

2. **Test de responsivité :**
   - Redimensionner la fenêtre du navigateur
   - Vérifier que l'image s'adapte correctement
   - Tester sur mobile (F12 > Mode mobile)

3. **Test de soumission :**
   - Remplir le formulaire avec des données de test
   - Vérifier que la page de succès a le même style
   - Tester le bouton "Enregistrer une nouvelle action"

4. **Test de performance :**
   - Vérifier que l'image se charge rapidement
   - Tester le scroll (l'image doit rester fixe)
   - Vérifier qu'il n'y a pas de problèmes d'affichage

5. **Test de lisibilité :**
   - Vérifier que tous les textes sont lisibles
   - Tester avec différentes tailles d'écran
   - Vérifier les contrastes et couleurs
`);

