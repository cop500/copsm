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

    const diagnostic = {
      timestamp: new Date().toISOString(),
      supabaseUrl: supabaseUrl,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      tables: {},
      policies: {},
      errors: []
    }

    // 1. Vérifier la connexion
    try {
      const { data: connectionTest, error: connectionError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)
      
      if (connectionError) {
        diagnostic.errors.push(`Erreur de connexion: ${connectionError.message}`)
      }
    } catch (err) {
      diagnostic.errors.push(`Erreur de connexion: ${err}`)
    }

    // 2. Lister toutes les tables
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public')
      
      if (tablesError) {
        diagnostic.errors.push(`Erreur liste tables: ${tablesError.message}`)
      } else {
        diagnostic.tables = tables || []
      }
    } catch (err) {
      diagnostic.errors.push(`Erreur liste tables: ${err}`)
    }

    // 3. Vérifier la table candidatures_stagiaires spécifiquement
    try {
      const { data: candidaturesTable, error: candidaturesError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'candidatures_stagiaires')
        .eq('table_schema', 'public')
      
      if (candidaturesError) {
        diagnostic.errors.push(`Erreur structure candidatures_stagiaires: ${candidaturesError.message}`)
      } else {
        diagnostic.candidatures_stagiaires_structure = candidaturesTable || []
      }
    } catch (err) {
      diagnostic.errors.push(`Erreur structure candidatures_stagiaires: ${err}`)
    }

    // 4. Tester l'insertion d'une candidature de test
    try {
      const testData = {
        demande_cv_id: 'test-diagnostic',
        date_candidature: new Date().toISOString().split('T')[0],
        source_offre: 'Site web',
        statut_candidature: 'envoye',
        cv_url: 'https://test.com/cv.pdf',
        nom: 'Test',
        prenom: 'Diagnostic',
        email: 'test@diagnostic.com',
        telephone: '0612345678',
        pole_id: 'test-pole',
        filiere_id: 'test-filiere',
        entreprise_nom: 'Test Entreprise',
        poste: 'Test Poste',
        type_contrat: 'Test Contrat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: insertTest, error: insertError } = await supabase
        .from('candidatures_stagiaires')
        .insert([testData])
        .select()

      if (insertError) {
        diagnostic.insertTest = {
          success: false,
          error: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        }
      } else {
        diagnostic.insertTest = {
          success: true,
          data: insertTest
        }
        
        // Supprimer le test si l'insertion a réussi
        if (insertTest && insertTest[0]) {
          await supabase
            .from('candidatures_stagiaires')
            .delete()
            .eq('id', insertTest[0].id)
        }
      }
    } catch (err) {
      diagnostic.insertTest = {
        success: false,
        error: `Erreur lors du test d'insertion: ${err}`
      }
    }

    // 5. Vérifier les politiques RLS
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'candidatures_stagiaires')
      
      if (policiesError) {
        diagnostic.errors.push(`Erreur politiques RLS: ${policiesError.message}`)
      } else {
        diagnostic.policies = policies || []
      }
    } catch (err) {
      diagnostic.errors.push(`Erreur politiques RLS: ${err}`)
    }

    // 6. Vérifier les permissions sur la table
    try {
      const { data: permissions, error: permissionsError } = await supabase
        .from('information_schema.table_privileges')
        .select('*')
        .eq('table_name', 'candidatures_stagiaires')
        .eq('table_schema', 'public')
      
      if (permissionsError) {
        diagnostic.errors.push(`Erreur permissions: ${permissionsError.message}`)
      } else {
        diagnostic.permissions = permissions || []
      }
    } catch (err) {
      diagnostic.errors.push(`Erreur permissions: ${err}`)
    }

    return NextResponse.json(diagnostic, { status: 200 })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erreur lors du diagnostic',
        details: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
