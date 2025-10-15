// Script de test pour vérifier l'API Resend
const { Resend } = require('resend')
require('dotenv').config({ path: '.env.local' })

async function testResendAPI() {
  console.log('🔍 Test de l\'API Resend...\n')

  // Vérifier la clé API
  const apiKey = process.env.RESEND_API_KEY
  console.log('Clé API Resend:', apiKey ? '✅ Configurée' : '❌ Non configurée')
  
  if (!apiKey) {
    console.error('❌ ERREUR: La clé API Resend n\'est pas configurée')
    console.log('💡 SOLUTION: Ajoutez RESEND_API_KEY dans les variables d\'environnement de Netlify')
    return
  }

  // Initialiser Resend
  const resend = new Resend(apiKey)
  console.log('✅ Resend initialisé\n')

  // Test d'envoi d'email
  console.log('📧 Test d\'envoi d\'email...')
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'COP System <onboarding@resend.dev>',
      to: 'omar.oumouzoune@ofppt.ma',
      subject: 'Test - Notification COP',
      text: 'Ceci est un email de test depuis le système COP. Si vous recevez cet email, la configuration est correcte.',
    })

    if (error) {
      console.error('❌ Erreur:', error)
      console.error('Détails:', JSON.stringify(error, null, 2))
      
      if (error.message?.includes('Invalid API key')) {
        console.log('\n💡 SOLUTION: La clé API est invalide. Vérifiez la clé dans Netlify.')
      } else if (error.message?.includes('domain')) {
        console.log('\n💡 SOLUTION: Le domaine d\'envoi n\'est pas vérifié. Utilisez onboarding@resend.dev temporairement.')
      }
    } else {
      console.log('✅ Email envoyé avec succès!')
      console.log('ID:', data?.id)
      console.log('📬 Vérifiez la boîte email de omar.oumouzoune@ofppt.ma')
    }
  } catch (err) {
    console.error('❌ Erreur fatale:', err.message)
    console.error('Stack:', err.stack)
  }
}

testResendAPI().catch(console.error)

