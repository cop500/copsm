// Script de test pour vérifier les politiques RLS
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testRLSPolicies() {
  console.log('🔍 Test des politiques RLS pour enquete_reponses...\n')

  // Test 1: Vérifier si on peut insérer sans authentification
  console.log('Test 1: Insertion sans authentification...')
  const testData = {
    nom: 'TEST',
    prenom: 'User',
    genre: 'homme',
    pole_id: null,
    filiere_id: null,
    poursuite_etudes: false,
    en_activite: false,
  }

  const { data, error } = await supabase
    .from('enquete_reponses')
    .insert(testData)
    .select()

  if (error) {
    console.error('❌ Erreur:', error.message)
    console.error('Code:', error.code)
    console.error('Détails:', error.details)
    console.error('Hints:', error.hints)
  } else {
    console.log('✅ Insertion réussie!')
    console.log('Données insérées:', data)
    
    // Nettoyer les données de test
    if (data && data[0]) {
      await supabase
        .from('enquete_reponses')
        .delete()
        .eq('id', data[0].id)
      console.log('🧹 Données de test supprimées')
    }
  }

  console.log('\n' + '='.repeat(60) + '\n')
  console.log('💡 SOLUTION RECOMMANDÉE:')
  console.log('1. Allez dans Supabase Dashboard > Authentication > Policies')
  console.log('2. Sélectionnez la table "enquete_reponses"')
  console.log('3. Supprimez TOUTES les politiques existantes')
  console.log('4. Créez une nouvelle politique avec ces paramètres:')
  console.log('   - Nom: "Allow public insert"')
  console.log('   - Type: INSERT')
  console.log('   - Target roles: anon, authenticated')
  console.log('   - USING expression: true')
  console.log('   - WITH CHECK expression: true')
  console.log('\nOU utilisez le script SQL fourni ci-dessous:')
  console.log('='.repeat(60))
}

testRLSPolicies().catch(console.error)

