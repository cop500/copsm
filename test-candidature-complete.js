// ========================================
// Script de test complet pour les candidatures
// ========================================

const { createClient } = require('@supabase/supabase-js')

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testComplete() {
  console.log('🔍 Test complet des candidatures...\n')

  // 1. Test de connexion
  console.log('1️⃣ Test de connexion...')
  try {
    const { data, error } = await supabase.from('candidatures_stagiaires').select('count').limit(1)
    if (error) throw error
    console.log('✅ Connexion réussie')
  } catch (err) {
    console.log('❌ Erreur de connexion:', err.message)
    return
  }

  // 2. Test d'insertion
  console.log('\n2️⃣ Test d\'insertion...')
  try {
    const testData = {
      nom: 'Test',
      prenom: 'Candidature',
      email: 'test@candidature.com',
      telephone: '0612345678',
      date_candidature: new Date().toISOString().split('T')[0],
      source_offre: 'Site web',
      statut_candidature: 'envoye',
      entreprise_nom: 'Test Entreprise',
      poste: 'Test Poste',
      type_contrat: 'cv',
      cv_url: 'https://test.com/cv.pdf'
    }

    const { data, error } = await supabase
      .from('candidatures_stagiaires')
      .insert([testData])
      .select()

    if (error) throw error
    console.log('✅ Insertion réussie:', data[0].id)
    
    // Nettoyer
    await supabase.from('candidatures_stagiaires').delete().eq('id', data[0].id)
    console.log('✅ Nettoyage effectué')
  } catch (err) {
    console.log('❌ Erreur d\'insertion:', err.message)
  }

  // 3. Test du bucket de stockage
  console.log('\n3️⃣ Test du bucket cv-stagiaires...')
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) throw error
    
    const cvBucket = buckets.find(b => b.name === 'cv-stagiaires')
    if (cvBucket) {
      console.log('✅ Bucket cv-stagiaires existe')
    } else {
      console.log('❌ Bucket cv-stagiaires manquant')
    }
  } catch (err) {
    console.log('❌ Erreur bucket:', err.message)
  }

  // 4. Test de l'API route
  console.log('\n4️⃣ Test de l\'API route...')
  try {
    const response = await fetch('https://copsm.space/api/candidatures', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nom: 'Test API',
        prenom: 'Route',
        email: 'test@api.com',
        telephone: '0612345678',
        cv_url: 'https://test.com/cv.pdf',
        entreprise_nom: 'Test API',
        poste: 'Test API',
        type_contrat: 'cv'
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ API route fonctionne:', result.message)
    } else {
      const error = await response.json()
      console.log('❌ Erreur API route:', error.error)
    }
  } catch (err) {
    console.log('❌ Erreur API route:', err.message)
  }

  console.log('\n🏁 Test terminé')
}

testComplete()
