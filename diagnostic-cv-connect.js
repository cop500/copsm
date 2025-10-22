// Diagnostic CV Connect
const { uploadCV } = require('./src/lib/google-drive.ts')

async function testCVConnect() {
  console.log('=== Diagnostic CV Connect ===')
  
  try {
    // Test avec un fichier factice
    const testBuffer = Buffer.from('Test PDF content')
    const testFileName = 'test_cv.pdf'
    const testPole = 'Test Pole'
    const testFiliere = 'Test Filiere'
    
    console.log('Tentative d\'upload de test...')
    const result = await uploadCV(testBuffer, testFileName, testPole, testFiliere)
    console.log('✅ Upload réussi:', result)
    
  } catch (error) {
    console.log('❌ Erreur détectée:')
    console.log('Message:', error.message)
    console.log('Stack:', error.stack)
    
    // Diagnostic des causes possibles
    if (error.message.includes('Configuration Google Drive manquante')) {
      console.log('\n🔍 DIAGNOSTIC: Variables d\'environnement Google Drive manquantes')
      console.log('Solutions:')
      console.log('1. Créer un fichier .env.local avec les variables Google Drive')
      console.log('2. Vérifier que les variables sont définies sur Netlify')
    }
    
    if (error.message.includes('Impossible de créer le dossier')) {
      console.log('\n🔍 DIAGNOSTIC: Problème de création de dossier Google Drive')
      console.log('Solutions:')
      console.log('1. Vérifier les permissions du service account')
      console.log('2. Vérifier que le dossier parent existe')
    }
    
    if (error.message.includes('Impossible d\'uploader le fichier')) {
      console.log('\n🔍 DIAGNOSTIC: Problème d\'upload de fichier')
      console.log('Solutions:')
      console.log('1. Vérifier les permissions du service account')
      console.log('2. Vérifier la taille du fichier')
    }
  }
}

testCVConnect()
