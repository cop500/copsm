// Script pour vérifier la configuration email dans Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkEmailConfig() {
  console.log('🔍 Vérification de la configuration email...\n')

  try {
    // Vérifier si la table existe et contient des données
    const { data, error } = await supabase
      .from('email_notifications_config')
      .select('*')

    if (error) {
      console.error('❌ Erreur lors de la récupération:', error.message)
      console.error('Code d\'erreur:', error.code)
      console.error('Détails:', error.details)
      return
    }

    console.log('✅ Table accessible')
    console.log('Nombre de lignes:', data.length)

    if (data.length === 0) {
      console.log('❌ Aucune configuration trouvée')
      console.log('💡 SOLUTION: Insérer une configuration par défaut')
      
      // Insérer une configuration par défaut
      const { data: insertData, error: insertError } = await supabase
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

      if (insertError) {
        console.error('❌ Erreur lors de l\'insertion:', insertError.message)
      } else {
        console.log('✅ Configuration par défaut insérée:', insertData[0])
      }
    } else {
      console.log('✅ Configuration trouvée:')
      console.log('  - enabled:', data[0].enabled)
      console.log('  - subject:', data[0].subject)
      console.log('  - recipient_emails:', data[0].recipient_emails)
    }

  } catch (err) {
    console.error('❌ Erreur inattendue:', err.message)
  }
}

checkEmailConfig().catch(console.error)
