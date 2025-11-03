// Script pour obtenir un Refresh Token OAuth Google Drive
// Utilisation: node get-oauth-token.js

const { google } = require('googleapis')
const readline = require('readline')

console.log('🔐 Configuration OAuth Google Drive\n')
console.log('Ce script va vous aider à obtenir un Refresh Token pour utiliser votre Google Drive personnel.\n')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Demander les credentials
rl.question('1. Entrez votre Client ID (de Google Cloud Console): ', (clientId) => {
  rl.question('2. Entrez votre Client Secret (de Google Cloud Console): ', (clientSecret) => {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3000/api/auth/google/callback'
    )

    const scopes = ['https://www.googleapis.com/auth/drive']

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Important pour obtenir un refresh_token
      scope: scopes,
      prompt: 'consent' // Force la demande de consentement pour obtenir le refresh_token
    })

    console.log('\n✅ Étape suivante :')
    console.log('3. Visitez cette URL dans votre navigateur:')
    console.log('\n' + url + '\n')
    console.log('4. Autorisez l\'application')
    console.log('5. Après autorisation, vous serez redirigé vers une URL comme:')
    console.log('   http://localhost:3000/api/auth/google/callback?code=4/0AeDsm...')
    console.log('   Copiez la partie après "code="\n')

    rl.question('6. Entrez le code de l\'URL de redirection: ', async (code) => {
      try {
        const { tokens } = await oauth2Client.getToken(code)
        
        console.log('\n✅ ✅ ✅ SUCCÈS ! ✅ ✅ ✅\n')
        console.log('📋 Ajoutez ces variables à Netlify:\n')
        console.log('GOOGLE_OAUTH_CLIENT_ID =', clientId)
        console.log('GOOGLE_OAUTH_CLIENT_SECRET =', clientSecret)
        console.log('GOOGLE_OAUTH_REFRESH_TOKEN =', tokens.refresh_token)
        console.log('\n💡 N\'oubliez pas d\'ajouter aussi:')
        console.log('GOOGLE_DRIVE_FOLDER_ID = ID_de_votre_dossier_Google_Drive')
        console.log('\n⚠️  Important: Conservez ce Refresh Token précieusement !')
        console.log('   Il permet d\'accéder à votre Google Drive.')
        
      } catch (error) {
        console.error('\n❌ Erreur:', error.message)
        console.error('\n💡 Vérifiez que:')
        console.error('   - Le code est correct (copié après "code=")')
        console.error('   - Le code n\'a pas expiré (réessayez si nécessaire)')
        console.error('   - Le Client ID et Secret sont corrects')
      }
      rl.close()
    })
  })
})

