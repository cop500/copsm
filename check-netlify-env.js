// Vérification des variables d'environnement Netlify
console.log('=== Vérification Variables Netlify ===')

// Test de l'API avec un endpoint de test
async function testEnvironment() {
  try {
    console.log('Test de l\'endpoint de test...')
    
    const response = await fetch('https://copsm.space/api/test-env', {
      method: 'GET'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Variables d\'environnement:', data)
    } else {
      console.log('❌ Endpoint de test non disponible')
    }
    
  } catch (error) {
    console.log('❌ Erreur:', error.message)
  }
}

// Créer un endpoint de test temporaire
console.log('Création d\'un endpoint de test...')

const fs = require('fs')
const testEndpoint = `
// Endpoint de test pour vérifier les variables d'environnement
export async function GET() {
  return Response.json({
    google_drive_folder_id: process.env.GOOGLE_DRIVE_FOLDER_ID ? 'Défini' : 'Non défini',
    google_service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Défini' : 'Non défini',
    google_private_key: process.env.GOOGLE_PRIVATE_KEY ? 'Défini' : 'Non défini',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Défini' : 'Non défini',
    supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Défini' : 'Non défini'
  })
}
`

fs.writeFileSync('src/app/api/test-env/route.ts', testEndpoint)
console.log('✅ Endpoint de test créé: /api/test-env')

// testEnvironment()
