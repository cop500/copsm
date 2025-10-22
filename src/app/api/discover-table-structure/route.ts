import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results = {
      timestamp: new Date().toISOString(),
      tableStructure: {},
      testInsert: {},
      errors: []
    }

    // Test 1: Essayer de lire la table pour voir sa structure
    try {
      const { data: readData, error: readError } = await supabase
        .from('candidatures_stagiaires')
        .select('*')
        .limit(1)
      
      if (readError) {
        results.errors.push(`Erreur lecture: ${readError.message}`)
      } else {
        results.tableStructure = {
          canRead: true,
          sampleData: readData,
          columns: readData && readData[0] ? Object.keys(readData[0]) : []
        }
      }
    } catch (err) {
      results.errors.push(`Erreur lecture: ${err}`)
    }

    // Test 2: Essayer d'insérer avec des données minimales
    try {
      const minimalData = {
        demande_cv_id: 'test-' + Date.now(),
        nom: 'Test',
        prenom: 'Test',
        email: 'test@test.com'
      }

      const { data: insertData, error: insertError } = await supabase
        .from('candidatures_stagiaires')
        .insert([minimalData])
        .select()
      
      if (insertError) {
        results.testInsert = {
          success: false,
          error: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        }
      } else {
        results.testInsert = {
          success: true,
          data: insertData
        }
        
        // Nettoyer si l'insertion a réussi
        if (insertData && insertData[0]) {
          await supabase
            .from('candidatures_stagiaires')
            .delete()
            .eq('id', insertData[0].id)
        }
      }
    } catch (err) {
      results.testInsert = {
        success: false,
        error: `Erreur test insertion: ${err}`
      }
    }

    // Test 3: Essayer d'insérer avec plus de champs
    try {
      const extendedData = {
        demande_cv_id: 'test-extended-' + Date.now(),
        nom: 'Test',
        prenom: 'Test',
        email: 'test@test.com',
        telephone: '0612345678',
        date_candidature: new Date().toISOString().split('T')[0],
        source_offre: 'Site web',
        statut_candidature: 'envoye',
        cv_url: 'https://test.com/cv.pdf',
        entreprise_nom: 'Test Entreprise',
        poste: 'Test Poste',
        type_contrat: 'CDI'
      }

      const { data: insertData2, error: insertError2 } = await supabase
        .from('candidatures_stagiaires')
        .insert([extendedData])
        .select()
      
      if (insertError2) {
        results.extendedTestInsert = {
          success: false,
          error: insertError2.message,
          code: insertError2.code,
          details: insertError2.details,
          hint: insertError2.hint
        }
      } else {
        results.extendedTestInsert = {
          success: true,
          data: insertData2
        }
        
        // Nettoyer si l'insertion a réussi
        if (insertData2 && insertData2[0]) {
          await supabase
            .from('candidatures_stagiaires')
            .delete()
            .eq('id', insertData2[0].id)
        }
      }
    } catch (err) {
      results.extendedTestInsert = {
        success: false,
        error: `Erreur test insertion étendue: ${err}`
      }
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erreur lors de la découverte de la structure',
        details: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
