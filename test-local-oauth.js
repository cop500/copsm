// Script de test local pour vérifier la configuration OAuth Google Drive
// Utilisation: node test-local-oauth.js

require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')

async function testOAuthConfiguration() {
  console.log('🧪 Test de la configuration OAuth Google Drive\n')
  console.log('================================================\n')

  // Vérifier les variables d'environnement
  const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
  const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const GOOGLE_OAUTH_REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID

  console.log('📋 Vérification des variables d\'environnement:\n')
  console.log(`GOOGLE_OAUTH_CLIENT_ID: ${GOOGLE_OAUTH_CLIENT_ID ? '✅ Défini' : '❌ Non défini'}`)
  console.log(`GOOGLE_OAUTH_CLIENT_SECRET: ${GOOGLE_OAUTH_CLIENT_SECRET ? '✅ Défini' : '❌ Non défini'}`)
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN: ${GOOGLE_OAUTH_REFRESH_TOKEN ? '✅ Défini' : '❌ Non défini'}`)
  console.log(`GOOGLE_DRIVE_FOLDER_ID: ${GOOGLE_DRIVE_FOLDER_ID ? '✅ Défini' : '❌ Non défini'}`)
  
  if (GOOGLE_DRIVE_FOLDER_ID) {
    console.log(`   ID: ${GOOGLE_DRIVE_FOLDER_ID}`)
  }

  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REFRESH_TOKEN || !GOOGLE_DRIVE_FOLDER_ID) {
    console.log('\n❌ Certaines variables sont manquantes !')
    console.log('💡 Créez un fichier .env.local avec ces variables:')
    console.log('   GOOGLE_OAUTH_CLIENT_ID=...')
    console.log('   GOOGLE_OAUTH_CLIENT_SECRET=...')
    console.log('   GOOGLE_OAUTH_REFRESH_TOKEN=...')
    console.log('   GOOGLE_DRIVE_FOLDER_ID=1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt')
    return
  }

  console.log('\n✅ Toutes les variables sont définies\n')

  // Tester l'authentification
  console.log('🔐 Test de l\'authentification OAuth...\n')
  
  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_OAUTH_CLIENT_ID,
      GOOGLE_OAUTH_CLIENT_SECRET,
      'http://localhost:3000/api/auth/google/callback'
    )

    oauth2Client.setCredentials({
      refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN
    })

    console.log('✅ Client OAuth créé avec succès')

    // Tester l'accès au dossier
    console.log('\n📁 Test d\'accès au dossier Google Drive...\n')
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    
    const folderInfo = await drive.files.get({
      fileId: GOOGLE_DRIVE_FOLDER_ID,
      fields: 'id, name, mimeType, permissions',
    })

    console.log('✅ Dossier accessible:')
    console.log(`   Nom: ${folderInfo.data.name}`)
    console.log(`   ID: ${folderInfo.data.id}`)
    console.log(`   Type: ${folderInfo.data.mimeType}`)

    // Tester la création d'un fichier test
    console.log('\n📄 Test de création d\'un fichier...\n')
    
    const testFileName = `test_${Date.now()}.txt`
    const bufferStream = require('stream').Readable.from(['Test upload'])

    const testFile = await drive.files.create({
      requestBody: {
        name: testFileName,
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: 'text/plain',
        body: bufferStream,
      },
      fields: 'id, name, size, webViewLink',
    })

    console.log('✅ Fichier créé avec succès:')
    console.log(`   Nom: ${testFile.data.name}`)
    console.log(`   ID: ${testFile.data.id}`)
    console.log(`   Taille: ${testFile.data.size} bytes`)

    // Supprimer le fichier test
    console.log('\n🗑️  Suppression du fichier test...\n')
    
    await drive.files.delete({
      fileId: testFile.data.id,
    })

    console.log('✅ Fichier test supprimé\n')

    console.log('================================================')
    console.log('✅ ✅ ✅ TOUS LES TESTS RÉUSSIS ! ✅ ✅ ✅')
    console.log('================================================\n')
    console.log('🎉 Votre configuration OAuth est correcte !')
    console.log('🚀 Vous pouvez maintenant tester l\'upload de CV en local\n')

  } catch (error) {
    console.error('\n❌ ❌ ❌ ERREUR ❌ ❌ ❌\n')
    console.error('Message:', error.message)
    
    if (error.code) {
      console.error('Code:', error.code)
    }

    if (error.code === 404) {
      console.error('\n💡 Le dossier est introuvable.')
      console.error('   Vérifiez que l\'ID du dossier est correct: 1MFOGrwOCpUB4fpnLbNDHmoFSoEUhCizt')
      console.error('   Vérifiez que le dossier existe dans votre Google Drive')
      console.error('   Vérifiez que votre compte a accès à ce dossier')
    } else if (error.code === 401) {
      console.error('\n💡 Erreur d\'authentification.')
      console.error('   Vérifiez que le Refresh Token est valide')
      console.error('   Le Refresh Token peut avoir expiré, régénérez-le si nécessaire')
    } else if (error.code === 403) {
      console.error('\n💡 Permission refusée.')
      console.error('   Vérifiez que votre compte a les permissions nécessaires sur le dossier')
    }

    console.error('\n')
  }
}

testOAuthConfiguration()

