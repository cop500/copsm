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

    // Récupérer toutes les demandes entreprises
    const { data: demandesEntreprises, error: errorEntreprises } = await supabase
      .from('demandes_entreprises')
      .select('id, entreprise_nom, type_demande, statut, created_at')
      .order('created_at', { ascending: false })

    // Récupérer toutes les demandes CV
    const { data: demandesCV, error: errorCV } = await supabase
      .from('demandes_cv')
      .select('id, nom_entreprise, statut, created_at')
      .order('created_at', { ascending: false })

    if (errorEntreprises) {
      console.error('Erreur demandes_entreprises:', errorEntreprises)
    }
    if (errorCV) {
      console.error('Erreur demandes_cv:', errorCV)
    }

    // Analyser les statuts
    const statutsEntreprises = demandesEntreprises?.reduce((acc: any, d: any) => {
      acc[d.statut || 'null'] = (acc[d.statut || 'null'] || 0) + 1
      return acc
    }, {}) || {}

    const statutsCV = demandesCV?.reduce((acc: any, d: any) => {
      acc[d.statut || 'null'] = (acc[d.statut || 'null'] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({
      success: true,
      demandes_entreprises: {
        total: demandesEntreprises?.length || 0,
        statuts: statutsEntreprises,
        data: demandesEntreprises?.slice(0, 10) // Les 10 plus récentes
      },
      demandes_cv: {
        total: demandesCV?.length || 0,
        statuts: statutsCV,
        data: demandesCV?.slice(0, 10) // Les 10 plus récentes
      },
      filtres_appliques: {
        demandes_entreprises: "type_demande = 'cv' AND statut IN ('en_cours', 'en_attente')",
        demandes_cv: "statut IN ('en_cours', 'en_attente', 'nouvelle')"
      }
    })

  } catch (error) {
    console.error('Erreur debug demandes:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
