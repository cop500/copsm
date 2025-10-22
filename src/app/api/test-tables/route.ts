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
      tests: {}
    }

    // Tables à tester
    const tablesToTest = [
      'candidatures_stagiaires',
      'demandes_cv',
      'demandes_entreprises',
      'cv_connect_submissions',
      'stagiaires',
      'profiles'
    ]

    for (const tableName of tablesToTest) {
      try {
        // Test 1: Vérifier si la table existe
        const { data: tableExists, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')
          .single()

        if (tableError) {
          results.tests[tableName] = {
            exists: false,
            error: tableError.message
          }
          continue
        }

        // Test 2: Vérifier la structure de la table
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')

        // Test 3: Tester la lecture
        const { data: readTest, error: readError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        // Test 4: Tester l'insertion (avec des données minimales)
        let insertTest = null
        let insertError = null
        
        if (tableName === 'candidatures_stagiaires') {
          const testData = {
            demande_cv_id: 'test-' + Date.now(),
            nom: 'Test',
            prenom: 'Test',
            email: 'test@test.com',
            pole_id: 'test',
            filiere_id: 'test',
            created_at: new Date().toISOString()
          }
          
          const { data: insertData, error: insertErr } = await supabase
            .from(tableName)
            .insert([testData])
            .select()
          
          insertTest = insertData
          insertError = insertErr
          
          // Nettoyer si l'insertion a réussi
          if (insertData && insertData[0]) {
            await supabase
              .from(tableName)
              .delete()
              .eq('id', insertData[0].id)
          }
        }

        results.tests[tableName] = {
          exists: true,
          columns: columns || [],
          readTest: {
            success: !readError,
            error: readError?.message,
            dataCount: readTest?.length || 0
          },
          insertTest: insertTest ? {
            success: !insertError,
            error: insertError?.message,
            data: insertTest
          } : null
        }

      } catch (err) {
        results.tests[tableName] = {
          exists: false,
          error: `Erreur lors du test: ${err}`
        }
      }
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erreur lors des tests',
        details: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
