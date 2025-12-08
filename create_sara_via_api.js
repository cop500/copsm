// ========================================
// Script pour créer SARA HANZAZE via l'API Supabase Admin
// ========================================
// Ce script utilise la Service Role Key pour créer l'utilisateur directement

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Vérifier que les variables d'environnement sont présentes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur : Variables d\'environnement manquantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  console.error('\nVérifiez votre fichier .env.local')
  process.exit(1)
}

// Créer le client Supabase avec la Service Role Key (droits admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createSaraAccount() {
  try {
    console.log('🚀 Début de la création du compte SARA HANZAZE...\n')

    // 1. Vérifier si l'utilisateur existe déjà
    console.log('📋 Étape 1 : Vérification de l\'existence de l\'utilisateur...')
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers()
    const userExists = existingAuthUser?.users?.find(u => u.email === 'sara@cop.com')
    
    if (userExists) {
      console.log('⚠️  L\'utilisateur existe déjà dans auth.users')
      console.log('   ID:', userExists.id)
      console.log('   Email:', userExists.email)
      
      // Vérifier si le profil existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'sara@cop.com')
        .single()
      
      if (existingProfile) {
        console.log('✅ Le profil existe déjà aussi')
        console.log('   Rôle:', existingProfile.role)
        console.log('   Nom:', existingProfile.nom, existingProfile.prenom)
        return { success: true, message: 'Utilisateur et profil existent déjà' }
      } else {
        console.log('⚠️  Le profil n\'existe pas, création du profil...')
        // Créer le profil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userExists.id,
            email: 'sara@cop.com',
            nom: 'HANZAZE',
            prenom: 'SARA',
            role: 'conseiller_cop',
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (profileError) {
          console.error('❌ Erreur lors de la création du profil:', profileError)
          return { success: false, error: profileError.message }
        }
        
        console.log('✅ Profil créé avec succès!')
        return { success: true, userId: userExists.id, profileId: profileData.id }
      }
    }

    // 2. Créer l'utilisateur dans Supabase Auth
    console.log('\n📋 Étape 2 : Création de l\'utilisateur dans Supabase Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'sara@cop.com',
      password: 'sara123',
      email_confirm: true, // Confirmer automatiquement l'email
      user_metadata: {
        nom: 'HANZAZE',
        prenom: 'SARA'
      }
    })

    if (authError) {
      console.error('❌ Erreur lors de la création de l\'utilisateur Auth:', authError)
      return { success: false, error: authError.message }
    }

    console.log('✅ Utilisateur Auth créé avec succès!')
    console.log('   ID:', authData.user.id)
    console.log('   Email:', authData.user.email)

    // 3. Créer le profil dans la table profiles
    console.log('\n📋 Étape 3 : Création du profil dans la table profiles...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'sara@cop.com',
        nom: 'HANZAZE',
        prenom: 'SARA',
        role: 'conseiller_cop',
        actif: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Erreur lors de la création du profil:', profileError)
      // Essayer de supprimer l'utilisateur Auth créé
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: profileError.message }
    }

    console.log('✅ Profil créé avec succès!')
    console.log('   ID:', profileData.id)
    console.log('   Rôle:', profileData.role)

    // 4. Vérification finale
    console.log('\n📋 Étape 4 : Vérification finale...')
    const { data: verifyData } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'sara@cop.com')
      .single()

    if (verifyData) {
      console.log('✅ Vérification réussie!')
      console.log('\n📊 Résumé:')
      console.log('   Email:', verifyData.email)
      console.log('   Nom:', verifyData.nom)
      console.log('   Prénom:', verifyData.prenom)
      console.log('   Rôle:', verifyData.role)
      console.log('   Actif:', verifyData.actif)
    }

    console.log('\n🎉 Compte SARA HANZAZE créé avec succès!')
    console.log('\n📝 Informations de connexion:')
    console.log('   Email: sara@cop.com')
    console.log('   Mot de passe: sara123')
    console.log('   Rôle: conseiller_cop (même que Abdelhamid Inajjaren)')

    return { 
      success: true, 
      userId: authData.user.id,
      profileId: profileData.id
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
    return { success: false, error: error.message }
  }
}

// Exécuter le script
createSaraAccount()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Script terminé avec succès!')
      process.exit(0)
    } else {
      console.log('\n❌ Script terminé avec erreur:', result.error)
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

