// ========================================
// Script pour créer le compte Directeur dans Supabase
// ========================================
// Ce script doit être exécuté dans la console Supabase ou via l'API

import { createClient } from '@supabase/supabase-js'

// Remplacez par vos vraies valeurs
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_KEY' // Clé de service, pas la clé publique

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createDirectorAccount() {
  try {
    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'Directeur@cmc',
      password: 'cop123',
      email_confirm: true // Confirmer automatiquement l'email
    })

    if (authError) {
      console.error('Erreur lors de la création de l\'utilisateur Auth:', authError)
      return
    }

    console.log('Utilisateur Auth créé:', authData.user.id)

    // 2. Créer le profil dans la table profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'Directeur@cmc',
        nom: 'Directeur',
        prenom: 'COP',
        role: 'directeur',
        actif: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Erreur lors de la création du profil:', profileError)
      return
    }

    console.log('Profil créé avec succès:', profileData)
    console.log('Compte Directeur créé avec succès !')
    console.log('Email: Directeur@cmc')
    console.log('Mot de passe: cop123')

  } catch (error) {
    console.error('Erreur générale:', error)
  }
}

// Exécuter le script
createDirectorAccount()
