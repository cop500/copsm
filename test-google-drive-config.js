// Test de la configuration Google Drive après déploiement
const https = require('https')

function testGoogleDriveConfig() {
  console.log('=== Test Configuration Google Drive ===')
  
  const options = {
    hostname: 'copsm.space',
    port: 443,
    path: '/api/test-env/',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }

  const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode)
    
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data)
        console.log('\n=== Variables d\'environnement ===')
        Object.entries(jsonData).forEach(([key, value]) => {
          console.log(`${key}: ${value}`)
        })
        
        // Vérifier si Google Drive est configuré
        const isGoogleDriveConfigured = 
          jsonData.google_drive_folder_id === 'Défini' &&
          jsonData.google_service_account_email === 'Défini' &&
          jsonData.google_private_key === 'Défini'
        
        console.log('\n=== Résultat ===')
        if (isGoogleDriveConfigured) {
          console.log('✅ Google Drive est correctement configuré !')
          console.log('🚀 Vous pouvez maintenant tester l\'upload CV')
        } else {
          console.log('❌ Google Drive n\'est pas encore configuré')
          console.log('⏳ Attendez que le déploiement Netlify soit terminé')
        }
        
      } catch (e) {
        console.log('Réponse non-JSON:', data)
        console.log('⏳ Le déploiement est peut-être encore en cours...')
      }
    })
  })

  req.on('error', (error) => {
    console.log('Erreur:', error.message)
  })

  req.end()
}

// Attendre 30 secondes avant de tester
console.log('Attente de 30 secondes pour laisser le temps au déploiement...')
setTimeout(testGoogleDriveConfig, 30000)