// Script de test pour vérifier le système des stagiaires ambassadeurs
// À exécuter dans la console du navigateur sur la page /ambassadeurs

console.log('🧪 Test du système Stagiaires Ambassadeurs');

// Test 1: Vérifier que la page se charge
const pageTitle = document.querySelector('h1');
if (pageTitle && pageTitle.textContent.includes('Formulaire de Suivi des Actions')) {
  console.log('✅ Page du formulaire chargée correctement');
} else {
  console.log('❌ Page du formulaire non trouvée');
}

// Test 2: Vérifier que tous les champs sont présents
const requiredFields = [
  'nom_prenom_stagiaire',
  'volet_action', 
  'responsable_action',
  'lieu_realisation',
  'date_action',
  'nombre_participants'
];

let allFieldsPresent = true;
requiredFields.forEach(fieldName => {
  const field = document.querySelector(`[name="${fieldName}"]`);
  if (field) {
    console.log(`✅ Champ ${fieldName} présent`);
  } else {
    console.log(`❌ Champ ${fieldName} manquant`);
    allFieldsPresent = false;
  }
});

// Test 3: Vérifier les options du menu déroulant des volets
const voletSelect = document.querySelector('select[name="volet_action"]');
if (voletSelect) {
  const options = voletSelect.querySelectorAll('option');
  const expectedVolets = [
    'Information/Communication',
    'Accompagnement Projets', 
    'Assistance Carrière',
    'Assistance Filière'
  ];
  
  let allVoletsPresent = true;
  expectedVolets.forEach(volet => {
    const optionExists = Array.from(options).some(option => 
      option.textContent.includes(volet)
    );
    if (optionExists) {
      console.log(`✅ Volet "${volet}" présent`);
    } else {
      console.log(`❌ Volet "${volet}" manquant`);
      allVoletsPresent = false;
    }
  });
  
  if (allVoletsPresent) {
    console.log('✅ Tous les volets sont présents');
  }
}

// Test 4: Vérifier la validation
const submitButton = document.querySelector('button[type="submit"]');
if (submitButton) {
  console.log('✅ Bouton de soumission présent');
  
  // Simuler un clic pour tester la validation
  submitButton.click();
  
  // Vérifier si des messages d'erreur apparaissent
  setTimeout(() => {
    const errorMessages = document.querySelectorAll('[class*="text-red-600"]');
    if (errorMessages.length > 0) {
      console.log('✅ Validation fonctionne - messages d\'erreur affichés');
    } else {
      console.log('⚠️ Validation - aucun message d\'erreur détecté');
    }
  }, 100);
} else {
  console.log('❌ Bouton de soumission non trouvé');
}

// Test 5: Vérifier le style et la responsivité
const formContainer = document.querySelector('.min-h-screen');
if (formContainer) {
  console.log('✅ Container principal présent');
  
  // Vérifier les classes CSS importantes
  const hasGradient = formContainer.className.includes('bg-gradient-to-br');
  const hasPadding = formContainer.className.includes('py-8');
  
  if (hasGradient && hasPadding) {
    console.log('✅ Styles CSS appliqués correctement');
  } else {
    console.log('⚠️ Styles CSS - vérification manuelle nécessaire');
  }
}

console.log('🎯 Tests terminés - Vérifiez les résultats ci-dessus');

// Instructions pour les tests manuels
console.log(`
📋 Tests manuels à effectuer :

1. Remplir le formulaire avec des données de test :
   - Nom: "Jean Dupont"
   - Volet: "Information/Communication" 
   - Responsable: "Marie Martin"
   - Lieu: "Lycée Technique, Casablanca"
   - Date: Date d'aujourd'hui
   - Participants: 25

2. Soumettre le formulaire et vérifier :
   - Message de succès affiché
   - Formulaire réinitialisé
   - Pas d'erreurs dans la console

3. Aller dans l'onglet "Espace Ambassadeurs" et vérifier :
   - L'action apparaît dans la liste
   - Les statistiques sont mises à jour
   - Les filtres fonctionnent
   - L'export CSV fonctionne

4. Tester la suppression d'une action

5. Vérifier la responsivité sur mobile
`);

