// Script pour corriger les anciens CV
// Utilisation: node fix-old-cvs.js

const http = require('http')

function fixOldCVs() {
  console.log('🔧 Début de la correction des anciens CV...\n')

  const data = JSON.stringify({})
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/cv-connect/fix-old-cvs/',
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
        
        console.log('📊 Résultats de la correction:')
        console.log('================================')
        console.log(`Total CVs: ${result.total}`)
        console.log(`✅ Corrigés: ${result.fixed}`)
        console.log(`❌ Erreurs: ${result.errors}`)
        console.log(`✓ Déjà OK: ${result.ok || 0}`)
        console.log('================================\n')
        
        if (result.details) {
          console.log('📝 Détails par CV:')
          result.details.forEach((detail, index) => {
            const statusIcon = detail.status === 'fixed' ? '✅' : 
                             detail.status === 'ok' ? '✓' : '❌'
            console.log(`${index + 1}. ${statusIcon} ${detail.filename} - ${detail.status}`)
            if (detail.reason) {
              console.log(`   Raison: ${detail.reason}`)
            }
            if (detail.fixes) {
              const fixes = []
              if (detail.fixes.permissions) fixes.push('Permissions')
              if (detail.fixes.url) fixes.push('URL')
              if (fixes.length > 0) {
                console.log(`   Corrections: ${fixes.join(', ')}`)
              }
            }
          })
        }
        
        console.log(`\n🎉 Correction terminée: ${result.message}`)
        
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
  fixOldCVs()
}, 2000)

