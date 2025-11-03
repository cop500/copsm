// Script pour tester l'accès au Shared Drive
// Utilisation: node test-shared-drive.js

const https = require('https')

function testSharedDrive() {
  console.log('🧪 Test de l\'accès au Shared Drive...\n')

  const options = {
    hostname: 'copsm.space',
    port: 443,
    path: '/api/cv-connect/test-upload/',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }

  const req = https.request(options, (res) => {
    let data = ''
    
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data)
        
        console.log('📊 Résultat du test:')
        console.log('================================')
        
        if (result.status === 'OK') {
          console.log('✅ Configuration correcte !')
          console.log('✅ Prêt pour l\'upload de CV')
        } else {
          console.log('❌ Problème détecté')
          
          if (result.checks) {
            console.log('\n📋 Détails:')
            
            // Variables d'environnement
            if (result.checks.env) {
              console.log('\nVariables d\'environnement:')
              console.log(`  GOOGLE_DRIVE_FOLDER_ID: ${result.checks.env.GOOGLE_DRIVE_FOLDER_ID.exists ? '✅ Défini' : '❌ Non défini'}`)
              console.log(`  GOOGLE_SERVICE_ACCOUNT_EMAIL: ${result.checks.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.exists ? '✅ Défini' : '❌ Non défini'}`)
              console.log(`  GOOGLE_PRIVATE_KEY: ${result.checks.env.GOOGLE_PRIVATE_KEY.exists ? '✅ Défini' : '❌ Non défini'}`)
            }
            
            // Authentification
            if (result.checks.auth) {
              console.log('\nAuthentification:')
              if (result.checks.auth.success) {
                console.log('  ✅ Authentification réussie')
                if (result.checks.auth.folderAccess) {
                  if (result.checks.auth.folderAccess.success) {
                    console.log(`  ✅ Accès au dossier: ${result.checks.auth.folderAccess.folderName || 'OK'}`)
                  } else {
                    console.log(`  ❌ Accès au dossier échoué: ${result.checks.auth.folderAccess.error}`)
                    console.log(`     Code: ${result.checks.auth.folderAccess.code}`)
                  }
                }
              } else {
                console.log(`  ❌ Authentification échouée: ${result.checks.auth.error}`)
              }
            }
            
            // Écriture
            if (result.checks.write) {
              console.log('\nTest d\'écriture:')
              if (result.checks.write.success) {
                console.log('  ✅ Écriture réussie')
              } else {
                console.log(`  ❌ Écriture échouée: ${result.checks.write.error}`)
                console.log(`     Code: ${result.checks.write.code}`)
                
                // Messages d'aide selon l'erreur
                if (result.checks.write.error?.includes('storage quota')) {
                  console.log('\n💡 Solution: Utiliser un Shared Drive au lieu d\'un dossier personnel')
                } else if (result.checks.write.error?.includes('File not found')) {
                  console.log('\n💡 Solution: Vérifier que:')
                  console.log('   1. Le Service Account est membre du Shared Drive')
                  console.log('   2. L\'ID du Shared Drive est correct')
                  console.log('   3. Le Service Account a les permissions "Gestionnaire de contenu"')
                }
              }
            }
          }
        }
        
        console.log('\n================================')
        console.log('\n📝 Résumé:')
        console.log(`   Status: ${result.status}`)
        if (result.summary) {
          console.log(`   Env configuré: ${result.summary.envConfigured ? '✅' : '❌'}`)
          console.log(`   Auth OK: ${result.summary.authWorking ? '✅' : '❌'}`)
          console.log(`   Write OK: ${result.summary.writeWorking ? '✅' : '❌'}`)
          console.log(`   Prêt: ${result.summary.readyForUpload ? '✅' : '❌'}`)
        }
        
      } catch (e) {
        console.log('❌ Erreur parsing réponse:', e.message)
        console.log('Réponse brute:', data.substring(0, 500))
      }
    })
  })

  req.on('error', (error) => {
    console.error('❌ Erreur de connexion:', error.message)
  })

  req.end()
}

// Attendre quelques secondes pour que Netlify redéploie
console.log('⏳ Attente de 10 secondes pour laisser Netlify redéployer...\n')
setTimeout(() => {
  testSharedDrive()
}, 10000)

