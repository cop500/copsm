// Script pour nettoyer les CV invalides de la base de données
// Utilisation: node cleanup-invalid-cvs.js

const http = require('http')

function cleanupInvalidCVs() {
  console.log('🧹 Début du nettoyage des CV invalides...\n')

  const data = JSON.stringify({})
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/cv-connect/cleanup-invalid/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': 'Bearer admin-fix-2025'
    }
  }

  const req = http.request(options, (res) => {
    let responseData = ''
    
    res.on('data', (chunk) => {
      responseData += chunk
    })
    
    res.on('end', () => {
      try {
        const result = JSON.parse(responseData)
        
        console.log('📊 Résultats du nettoyage:')
        console.log('================================')
        console.log(`Total CVs vérifiés: ${result.total}`)
        console.log(`🗑️  CVs supprimés: ${result.deleted}`)
        console.log(`✅ CVs valides conservés: ${result.kept}`)
        console.log('================================\n')
        
        if (result.deletedDetails && result.deletedDetails.length > 0) {
          console.log('🗑️  CVs supprimés:')
          result.deletedDetails.forEach((detail, index) => {
            console.log(`${index + 1}. ${detail.filename} - ${detail.email}`)
            console.log(`   Raison: ${detail.reason}`)
          })
        }
        
        console.log(`\n✅ Nettoyage terminé: ${result.message}`)
        
      } catch (e) {
        console.error('❌ Erreur lors du parsing de la réponse:', e.message)
        console.log('Réponse brute:', responseData)
      }
    })
  })

  req.on('error', (error) => {
    console.error('❌ Erreur de connexion:', error.message)
    console.log('\n💡 Vérifiez que:')
    console.log('   - Le serveur Next.js est démarré (npm run dev)')
    console.log('   - Vous êtes sur le port 3000')
  })

  req.write(data)
  req.end()
}

// Attendre 2 secondes pour que le serveur soit prêt
setTimeout(() => {
  cleanupInvalidCVs()
}, 2000)

