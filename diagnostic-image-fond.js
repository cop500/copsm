// Script de diagnostic pour l'image de fond
// À exécuter dans la console du navigateur sur la page /ambassadeurs

console.log('🔍 Diagnostic de l\'image de fond');

// Test 1: Vérifier l'image Next.js
const nextImage = document.querySelector('img[alt="Arrière-plan du formulaire"]');
if (nextImage) {
  console.log('✅ Image Next.js trouvée');
  console.log('Source:', nextImage.src);
  console.log('Dimensions naturelles:', nextImage.naturalWidth, 'x', nextImage.naturalHeight);
  console.log('Dimensions affichées:', nextImage.offsetWidth, 'x', nextImage.offsetHeight);
  console.log('Classes CSS:', nextImage.className);
  
  // Vérifier la visibilité
  const rect = nextImage.getBoundingClientRect();
  console.log('Position:', {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height
  });
  
  if (rect.width > 0 && rect.height > 0) {
    console.log('✅ Image dimensionnée correctement');
  } else {
    console.log('❌ Image non dimensionnée');
  }
} else {
  console.log('❌ Image Next.js non trouvée');
}

// Test 2: Vérifier le conteneur
const container = document.querySelector('.formulaire-container');
if (container) {
  console.log('✅ Container trouvé');
  const computedStyle = window.getComputedStyle(container);
  console.log('Position:', computedStyle.position);
  console.log('Min-height:', computedStyle.minHeight);
  console.log('Z-index:', computedStyle.zIndex);
} else {
  console.log('❌ Container non trouvé');
}

// Test 3: Vérifier l'overlay
const overlay = document.querySelector('.formulaire-overlay');
if (overlay) {
  console.log('✅ Overlay trouvé');
  const computedStyle = window.getComputedStyle(overlay);
  console.log('Background-color:', computedStyle.backgroundColor);
  console.log('Z-index:', computedStyle.zIndex);
  console.log('Opacité:', computedStyle.opacity);
} else {
  console.log('❌ Overlay non trouvé');
}

// Test 4: Vérifier le formulaire
const formulaire = document.querySelector('.bg-white.bg-opacity-40');
if (formulaire) {
  console.log('✅ Formulaire trouvé');
  const computedStyle = window.getComputedStyle(formulaire);
  console.log('Background-color:', computedStyle.backgroundColor);
  console.log('Z-index:', computedStyle.zIndex);
  console.log('Opacité:', computedStyle.opacity);
} else {
  console.log('❌ Formulaire non trouvé');
}

// Test 5: Vérifier la hiérarchie des z-index
const elements = document.querySelectorAll('[class*="z-"]');
console.log('📊 Hiérarchie des z-index:');
elements.forEach((el, index) => {
  const computedStyle = window.getComputedStyle(el);
  console.log(`${index + 1}. ${el.className} - z-index: ${computedStyle.zIndex}`);
});

// Test 6: Vérifier les erreurs de chargement
const images = document.querySelectorAll('img');
let hasErrors = false;
images.forEach((img, index) => {
  img.onerror = () => {
    console.log(`❌ Erreur de chargement de l'image ${index}:`, img.src);
    hasErrors = true;
  };
  
  img.onload = () => {
    console.log(`✅ Image ${index} chargée:`, img.src);
  };
});

// Test 7: Vérifier la structure HTML
console.log('🏗️ Structure HTML:');
const structure = document.querySelector('.formulaire-container');
if (structure) {
  console.log('Container HTML:', structure.outerHTML.substring(0, 200) + '...');
}

console.log('🎯 Diagnostic terminé');

// Instructions pour les tests manuels
console.log(`
📋 Tests manuels à effectuer :

1. **Test visuel :**
   - L'image formulaire7.jpg doit être visible en arrière-plan
   - L'overlay sombre doit être moins opaque (20% au lieu de 40%)
   - Le formulaire doit être très transparent (40% d'opacité)

2. **Test de contraste :**
   - Vérifier que le texte reste lisible
   - Vérifier que les champs de saisie sont visibles
   - Vérifier que les boutons sont cliquables

3. **Test de performance :**
   - Ouvrir les outils de développement (F12)
   - Aller dans l'onglet Network
   - Recharger la page
   - Vérifier que formulaire7.jpg se charge (statut 200)

4. **Test de responsivité :**
   - Redimensionner la fenêtre
   - L'image doit s'adapter correctement
   - Tester sur mobile (F12 > Mode mobile)

Si l'image ne s'affiche toujours pas :
- Vérifier que le fichier formulaire7.jpg existe dans le dossier public
- Vérifier les erreurs dans la console du navigateur
- Essayer de charger l'image directement : http://localhost:3000/formulaire7.jpg
- Vérifier que Next.js Image est correctement configuré
- Vérifier que les z-index sont corrects
`);

