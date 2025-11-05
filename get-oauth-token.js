// Script pour obtenir le Refresh Token Google OAuth 2.0
const readline = require('readline')
const { google } = require('googleapis')
const http = require('http')
const url = require('url')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function getOAuthToken() {
  console.log('\n🔑 Obtenir le Refresh Token Google OAuth 2.0\n')
  console.log('=' .repeat(50))

  // 1. Demander le Client ID
  const clientId = await askQuestion('\n1️⃣ Entrez votre GOOGLE_OAUTH_CLIENT_ID: ')
  if (!clientId) {
    console.error('❌ Client ID requis !')
    process.exit(1)
  }

  // 2. Demander le Client Secret
  const clientSecret = await askQuestion('2️⃣ Entrez votre GOOGLE_OAUTH_CLIENT_SECRET: ')
  if (!clientSecret) {
    console.error('❌ Client Secret requis !')
    process.exit(1)
  }

  // 3. Créer l'OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000/api/auth/google/callback'
  )

  // 4. Générer l'URL d'autorisation
  const scopes = ['https://www.googleapis.com/auth/drive.file']
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Important : force la génération d'un refresh token
  })

  console.log('\n' + '='.repeat(50))
  console.log('🌐 ÉTAPE 1 : Autorisation Google')
  console.log('='.repeat(50))
  console.log('\n📋 Instructions :')
  console.log('1. Copiez l\'URL ci-dessous')
  console.log('2. Collez-la dans votre navigateur')
  console.log('3. Connectez-vous avec votre compte Google')
  console.log('4. Autorisez l\'application')
  console.log('5. Copiez le CODE de l\'URL de redirection\n')
  console.log('🔗 URL à ouvrir :\n')
  console.log(authUrl)
  console.log('\n' + '='.repeat(50))

  // 5. Démarrer un serveur temporaire pour capturer le code
  console.log('\n⏳ En attente du code d\'autorisation...\n')
  console.log('💡 Après avoir autorisé, vous serez redirigé vers une page.')
  console.log('   Copiez le CODE de l\'URL (partie après "code=")\n')

  const code = await askQuestion('3️⃣ Collez le CODE d\'autorisation ici: ')

  if (!code) {
    console.error('❌ Code d\'autorisation requis !')
    process.exit(1)
  }

  // 6. Échanger le code contre un access token et refresh token
  console.log('\n⏳ Échange du code contre les tokens...\n')
  
  try {
    const { tokens } = await oauth2Client.getToken(code.trim())
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ SUCCÈS !')
    console.log('='.repeat(50))
    console.log('\n📋 Vos credentials OAuth 2.0 :\n')
    console.log('GOOGLE_OAUTH_CLIENT_ID=' + clientId)
    console.log('GOOGLE_OAUTH_CLIENT_SECRET=' + clientSecret)
    console.log('GOOGLE_OAUTH_REFRESH_TOKEN=' + tokens.refresh_token)
    console.log('\n' + '='.repeat(50))
    console.log('\n⚠️  IMPORTANT : Copiez ces 3 valeurs et gardez-les en sécurité !')
    console.log('   Vous devrez les ajouter dans votre fichier .env.local et sur Netlify.\n')
    
    if (tokens.refresh_token) {
      console.log('✅ Refresh Token obtenu avec succès !')
    } else {
      console.log('⚠️  Aucun Refresh Token retourné. Essayez de révoquer les permissions et réessayez.')
    }

  } catch (error) {
    console.error('\n❌ ERREUR lors de l\'échange du code :')
    console.error(error.message)
    if (error.response) {
      console.error('Détails:', error.response.data)
    }
    process.exit(1)
  }

  rl.close()
}

// Lancer le script
getOAuthToken().catch((error) => {
  console.error('Erreur fatale:', error)
  process.exit(1)
})


