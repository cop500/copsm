// Vérification de la configuration de production
console.log('=== Vérification Configuration Production ===')

// Vérifier les variables d'environnement disponibles
const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GOOGLE_DRIVE_FOLDER_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_ID',
  'EMAILJS_PUBLIC_KEY'
]

console.log('Variables d\'environnement disponibles:')
envVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: Défini (${value.length} caractères)`)
  } else {
    console.log(`❌ ${varName}: Non défini`)
  }
})

// Test de connexion à l'API CV Connect
async function testAPI() {
  try {
    console.log('\n=== Test API CV Connect ===')
    
    const response = await fetch('https://copsm.space/api/cv-connect/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true
      })
    })
    
    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.text()
    console.log('Response:', data)
    
  } catch (error) {
    console.log('❌ Erreur API:', error.message)
  }
}

// testAPI()
