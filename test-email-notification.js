// Script de test pour vérifier la configuration email
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testEmailConfig() {
  console.log('🔍 Test de la configuration email...\n')

  // Test 1: Vérifier si la table existe
  console.log('Test 1: Vérifier la table email_notifications_config...')
  const { data: config, error: configError } = await supabase
    .from('email_notifications_config')
    .select('*')
    .single()

  if (configError) {
    console.error('❌ Erreur:', configError.message)
    console.error('💡 SOLUTION: Exécutez le script SQL dans Supabase pour créer la table')
    console.log('\n📋 Script SQL à exécuter:')
    console.log('CREATE TABLE IF NOT EXISTS email_notifications_config (')
    console.log('    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),')
    console.log('    enabled BOOLEAN DEFAULT true,')
    console.log('    subject TEXT,')
    console.log('    message TEXT,')
    console.log('    recipient_emails JSONB,')
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),')
    console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()')
    console.log(');')
    console.log('\nINSERT INTO email_notifications_config (id, enabled, subject, message, recipient_emails)')
    console.log("VALUES ('00000000-0000-0000-0000-000000000001', true, 'Nouvelle demande entreprise à traiter', 'Bonjour,\n\nUne nouvelle demande d''entreprise a été enregistrée.\n\nEntreprise : {nom_entreprise}\nLien : {lien}', '[\"omar.oumouzoune@ofppt.ma\"]'::jsonb);")
  } else {
    console.log('✅ Table trouvée !')
    console.log('Configuration actuelle:', config)
  }

  // Test 2: Vérifier les variables d'environnement
  console.log('\nTest 2: Vérifier les variables d\'environnement...')
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Configuré' : '❌ Non configuré')
  console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'Non configuré')
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'Non configuré')
}

testEmailConfig().catch(console.error)

