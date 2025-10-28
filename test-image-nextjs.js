// Script de test pour vérifier l'affichage de l'image de fond
// À exécuter dans la console du navigateur sur la page /ambassadeurs

console.log('🖼️ Test de l\'affichage de l\'image de fond avec Next.js Image');

// Test 1: Vérifier que l'image Next.js est chargée
const nextImage = document.querySelector('img[alt="Arrière-plan du formulaire"]');
if (nextImage) {
  console.log('✅ Image Next.js trouvée dans le DOM');
  console.log('Source:', nextImage.src);
  console.log('Dimensions:', nextImage.naturalWidth, 'x', nextImage.naturalHeight);
  console.log('Classes CSS:', nextImage.className);
} else {
  console.log('❌ Image Next.js non trouvée dans le DOM');
}

// Test 2: Vérifier les classes CSS personnalisées
const container = document.querySelector('.formulaire-container');
if (container) {
  console.log('✅ Container formulaire trouvé');
  const computedStyle = window.getComputedStyle(container);
  console.log('Position:', computedStyle.position);
  console.log('Min-height:', computedStyle.minHeight);
} else {
  console.log('❌ Container formulaire non trouvé');
}

// Test 3: Vérifier l'overlay
const overlay = document.querySelector('.formulaire-overlay');
if (overlay) {
  console.log('✅ Overlay de transparence trouvé');
  const computedStyle = window.getComputedStyle(overlay);
  console.log('Background-color:', computedStyle.backgroundColor);
  console.log('Z-index:', computedStyle.zIndex);
} else {
  console.log('❌ Overlay de transparence non trouvé');
}

// Test 4: Vérifier le contenu principal
const content = document.querySelector('.formulaire-content');
if (content) {
  console.log('✅ Contenu principal trouvé');
  const computedStyle = window.getComputedStyle(content);
  console.log('Z-index:', computedStyle.zIndex);
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
  
  img.onload = () => {
    console.log(`✅ Image ${index} chargée avec succès:`, img.src);
  };
});

// Test 6: Vérifier la visibilité de l'image
if (nextImage) {
  const rect = nextImage.getBoundingClientRect();
  console.log('Position de l\'image:', {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height
  });
  
  if (rect.width > 0 && rect.height > 0) {
    console.log('✅ Image visible et dimensionnée');
  } else {
    console.log('❌ Image non visible ou non dimensionnée');
  }
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
- Vérifier que Next.js Image est correctement configuré
`);

