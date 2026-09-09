require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const EMAIL = 'fatimaezzahra@cop.com'
const PASSWORD = 'cop123'
const NOM = 'AMORI'
const PRENOM = 'FATIMAEZZAHRA'
const ROLE = 'conseillere_carriere'
const EMAIL_PRO = 'fatimaezzahra.amori@ofppt.ma'
const CONFIG_ID = '00000000-0000-0000-0000-000000000002'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('Creation du compte Fatimaezzahra Amori...\n')

  const { data: listData } = await supabase.auth.admin.listUsers()
  let userId = listData?.users?.find((u) => u.email === EMAIL)?.id

  if (!userId) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nom: NOM, prenom: PRENOM, must_change_password: true },
    })
    if (authError) throw new Error(`Auth: ${authError.message}`)
    userId = authData.user.id
    console.log('Utilisateur Auth cree:', userId)
  } else {
    console.log('Utilisateur Auth existe deja:', userId)
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (!existingProfile) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      email: EMAIL,
      nom: NOM,
      prenom: PRENOM,
      role: ROLE,
      actif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    if (profileError) throw new Error(`Profil: ${profileError.message}`)
    console.log('Profil cree')
  } else {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email: EMAIL,
        nom: NOM,
        prenom: PRENOM,
        role: ROLE,
        actif: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
    if (updateError) throw new Error(`Mise a jour profil: ${updateError.message}`)
    console.log('Profil mis a jour')
  }

  const { data: config, error: configError } = await supabase
    .from('email_notifications_assistance_config')
    .select('recipient_emails')
    .eq('id', CONFIG_ID)
    .single()

  if (configError) {
    console.warn('Config email assistance non mise a jour:', configError.message)
  } else {
    let recipients = config.recipient_emails || {}
    if (typeof recipients === 'string') {
      try {
        recipients = JSON.parse(recipients)
      } catch {
        recipients = {}
      }
    }
    recipients[userId] = EMAIL_PRO
    const { error: updateConfigError } = await supabase
      .from('email_notifications_assistance_config')
      .update({
        recipient_emails: recipients,
        updated_at: new Date().toISOString(),
      })
      .eq('id', CONFIG_ID)
    if (updateConfigError) {
      console.warn('Erreur MAJ recipient_emails:', updateConfigError.message)
    } else {
      console.log('Email pro ajoute aux notifications assistance:', EMAIL_PRO)
    }
  }

  const { data: verify } = await supabase.from('profiles').select('*').eq('id', userId).single()
  console.log('\nCompte pret:')
  console.log('  Login:', EMAIL)
  console.log('  Mot de passe temporaire:', PASSWORD)
  console.log('  Role:', verify?.role)
  console.log('  ID:', userId)
}

main().catch((err) => {
  console.error('Erreur:', err.message)
  process.exit(1)
})
