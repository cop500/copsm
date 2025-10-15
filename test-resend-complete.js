// Script de test complet pour l'API Resend
const { Resend } = require('resend')
require('dotenv').config({ path: '.env.local' })

async function testResendComplete() {
  console.log('🔍 Test complet de l\'API Resend...\n')

  // Test 1: Vérifier la clé API
  const apiKey = process.env.RESEND_API_KEY
  console.log('=== Test 1: Clé API ===')
  console.log('RESEND_API_KEY:', apiKey ? '✅ Configurée' : '❌ Non configurée')
  
  if (apiKey) {
    console.log('Format de la clé:', apiKey.startsWith('re_') ? '✅ Correct (commence par re_)' : '❌ Incorrect')
    console.log('Longueur:', apiKey.length, 'caractères')
  }
  console.log('')

  if (!apiKey) {
    console.error('❌ ERREUR: La clé API Resend n\'est pas configurée')
    console.log('💡 SOLUTION: Ajoutez RESEND_API_KEY dans les variables d\'environnement de Netlify')
    return
  }

  // Test 2: Initialiser Resend
  console.log('=== Test 2: Initialisation Resend ===')
  let resend
  try {
    resend = new Resend(apiKey)
    console.log('✅ Resend initialisé avec succès')
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message)
    return
  }
  console.log('')

  // Test 3: Vérifier les variables d'environnement
  console.log('=== Test 3: Variables d\'environnement ===')
  console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ Non configuré')
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '❌ Non configuré')
  console.log('')

  // Test 4: Test d'envoi d'email simple
  console.log('=== Test 4: Envoi d\'email simple ===')
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'COP System <onboarding@resend.dev>',
      to: 'omar.oumouzoune@ofppt.ma',
      subject: 'TEST - API Resend',
      text: 'Ceci est un test d\'envoi d\'email depuis le système COP.\n\nSi vous recevez cet email, l\'API Resend fonctionne correctement.',
    })

    if (error) {
      console.error('❌ Erreur Resend:', error.message)
      console.error('Code d\'erreur:', error.statusCode)
      console.error('Détails complets:', JSON.stringify(error, null, 2))
      
      if (error.message?.includes('Invalid API key')) {
        console.log('\n💡 SOLUTION: La clé API est invalide. Vérifiez la clé dans Netlify.')
      } else if (error.message?.includes('domain')) {
        console.log('\n💡 SOLUTION: Le domaine d\'envoi n\'est pas vérifié. Utilisez onboarding@resend.dev temporairement.')
      } else if (error.message?.includes('rate limit')) {
        console.log('\n💡 SOLUTION: Limite de taux atteinte. Attendez quelques minutes.')
      }
    } else {
      console.log('✅ Email envoyé avec succès!')
      console.log('ID de l\'email:', data?.id)
      console.log('📬 Vérifiez la boîte email de omar.oumouzoune@ofppt.ma')
    }
  } catch (err) {
    console.error('❌ Erreur fatale:', err.message)
    console.error('Stack trace:', err.stack)
  }
  console.log('')

  // Test 5: Vérifier le statut de l'API
  console.log('=== Test 5: Statut de l\'API ===')
  try {
    // Test simple pour vérifier si l'API répond
    const { data, error } = await resend.emails.send({
      from: 'test@example.com',
      to: 'test@example.com',
      subject: 'Test',
      text: 'Test'
    })
    
    if (error && error.statusCode === 403) {
      console.log('✅ API Resend répond (erreur 403 = clé API invalide)')
    } else if (error) {
      console.log('✅ API Resend répond (erreur:', error.statusCode, ')')
    } else {
      console.log('✅ API Resend répond (succès)')
    }
  } catch (err) {
    console.error('❌ API Resend ne répond pas:', err.message)
  }
  console.log('')

  console.log('=== RÉSUMÉ ===')
  console.log('Si l\'email n\'a pas été envoyé, vérifiez:')
  console.log('1. La clé API Resend est correcte et active')
  console.log('2. Le domaine d\'envoi est vérifié dans Resend')
  console.log('3. Les variables d\'environnement sont correctes dans Netlify')
  console.log('4. L\'application a été redéployée après avoir changé les variables')
  console.log('5. Vérifiez le dossier spam/courrier indésirable')
}

testResendComplete().catch(console.error)
