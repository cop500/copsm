// Script de test complet pour diagnostiquer le problème email
const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testEmailComplete() {
  console.log('🔍 Test complet du système email...\n')

  // Test 1: Variables d'environnement
  console.log('=== Test 1: Variables d\'environnement ===')
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Configuré' : '❌ Non configuré')
  console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ Non configuré')
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '❌ Non configuré')
  console.log('')

  // Test 2: Table de configuration
  console.log('=== Test 2: Table email_notifications_config ===')
  const { data: config, error: configError } = await supabase
    .from('email_notifications_config')
    .select('*')
    .single()

  if (configError) {
    console.error('❌ Erreur:', configError.message)
    console.log('💡 La table n\'existe pas ou la configuration n\'est pas accessible')
  } else {
    console.log('✅ Configuration trouvée:')
    console.log('  - enabled:', config.enabled)
    console.log('  - subject:', config.subject)
    console.log('  - recipient_emails:', config.recipient_emails)
  }
  console.log('')

  // Test 3: API Resend
  console.log('=== Test 3: API Resend ===')
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non configuré')
  } else {
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'COP System <onboarding@resend.dev>',
        to: 'omar.oumouzoune@ofppt.ma',
        subject: 'TEST - Notification COP',
        text: 'Ceci est un test d\'envoi d\'email depuis le système COP.\n\nSi vous recevez cet email, la configuration est correcte.',
      })

      if (error) {
        console.error('❌ Erreur Resend:', error.message)
        console.error('Détails:', JSON.stringify(error, null, 2))
      } else {
        console.log('✅ Email de test envoyé avec succès!')
        console.log('ID:', data?.id)
        console.log('📬 Vérifiez la boîte email de omar.oumouzoune@ofppt.ma')
      }
    } catch (err) {
      console.error('❌ Erreur fatale:', err.message)
    }
  }
  console.log('')

  // Test 4: Vérifier les dernières demandes
  console.log('=== Test 4: Vérifier les dernières demandes ===')
  const { data: demandes, error: demandesError } = await supabase
    .from('demandes_entreprises')
    .select('id, entreprise_nom, contact_nom, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (demandesError) {
    console.error('❌ Erreur:', demandesError.message)
  } else {
    console.log('✅ Dernières demandes:')
    demandes.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.entreprise_nom} - ${d.contact_nom} (${new Date(d.created_at).toLocaleString('fr-FR')})`)
    })
  }
  console.log('')

  console.log('=== RÉSUMÉ ===')
  console.log('Si l\'email de test n\'a pas été envoyé, vérifiez:')
  console.log('1. La clé API Resend est correcte')
  console.log('2. Le domaine d\'envoi est vérifié dans Resend')
  console.log('3. Les variables d\'environnement sont correctes dans Netlify')
  console.log('4. L\'application a été redéployée après avoir changé les variables')
}

testEmailComplete().catch(console.error)

