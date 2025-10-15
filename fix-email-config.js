// Script pour corriger la configuration email
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fixEmailConfig() {
  console.log('🔧 Correction de la configuration email...\n')

  // Vérifier si la table existe
  const { data: existing, error: checkError } = await supabase
    .from('email_notifications_config')
    .select('*')

  if (checkError) {
    console.error('❌ Erreur lors de la vérification de la table:', checkError.message)
    return
  }

  console.log('✅ Table existe, nombre de lignes:', existing.length)

  // Insérer la configuration si elle n'existe pas
  if (existing.length === 0) {
    console.log('📝 Insertion de la configuration par défaut...')
    
    const { data, error } = await supabase
      .from('email_notifications_config')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        enabled: true,
        subject: 'Nouvelle demande entreprise à traiter',
        message: `Bonjour,

Une nouvelle demande d'entreprise a été enregistrée dans le système COP.

Entreprise : {nom_entreprise}
Contact : {nom_contact}
Email : {email}
Téléphone : {telephone}
Type de demande : {type_demande}

Lien : {lien}

Cordialement,
Notification automatique - Système COP`,
        recipient_emails: ['omar.oumouzoune@ofppt.ma']
      })
      .select()

    if (error) {
      console.error('❌ Erreur lors de l\'insertion:', error.message)
      console.error('Détails:', error)
    } else {
      console.log('✅ Configuration insérée avec succès!')
      console.log('Données:', data[0])
    }
  } else {
    console.log('✅ Configuration existe déjà')
    console.log('Données:', existing[0])
  }

  // Vérifier la configuration finale
  console.log('\n🔍 Vérification finale...')
  const { data: final, error: finalError } = await supabase
    .from('email_notifications_config')
    .select('*')
    .single()

  if (finalError) {
    console.error('❌ Erreur lors de la vérification finale:', finalError.message)
  } else {
    console.log('✅ Configuration finale:')
    console.log('  - enabled:', final.enabled)
    console.log('  - subject:', final.subject)
    console.log('  - recipient_emails:', final.recipient_emails)
    console.log('  - recipient_emails type:', typeof final.recipient_emails)
    console.log('  - recipient_emails is array:', Array.isArray(final.recipient_emails))
  }
}

fixEmailConfig().catch(console.error)
