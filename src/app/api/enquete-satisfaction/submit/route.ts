import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { EnqueteSatisfactionFormData } from '@/hooks/useEnqueteSatisfaction'

/**
 * Route API pour soumettre une enquête de satisfaction (publique)
 * Utilise le service role key pour contourner RLS
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuration serveur manquante. Veuillez contacter le support.' 
        },
        { status: 500 }
      )
    }

    // Parser le body
    let data: EnqueteSatisfactionFormData
    try {
      data = await request.json()
    } catch (err) {
      console.error('❌ Erreur parsing JSON:', err)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Format de données invalide' 
        },
        { status: 400 }
      )
    }

    // Validation basique des champs obligatoires
    if (!data.nom_entreprise || !data.nom_representant || !data.fonction_representant || !data.email_entreprise) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Les champs obligatoires sont manquants' 
        },
        { status: 400 }
      )
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email_entreprise)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Format d\'email invalide' 
        },
        { status: 400 }
      )
    }

    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.group('📤 Soumission enquête satisfaction (API)')
      console.log('Données reçues:', data)
      console.groupEnd()
    }

    // Insertion avec service role (contourne RLS)
    const { data: newEnquete, error: insertError } = await supabaseAdmin
      .from('satisfaction_entreprises_jobdating')
      .insert([data as any])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erreur Supabase lors de l\'insertion (API):', insertError)
      return NextResponse.json(
        { 
          success: false, 
          error: insertError.message || 'Erreur lors de l\'enregistrement de l\'enquête' 
        },
        { status: 500 }
      )
    }

    // Log de succès
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Enquête soumise avec succès (API):', newEnquete?.id)
    }

    return NextResponse.json(
      { 
        success: true, 
        data: newEnquete 
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('❌ Erreur inattendue lors de la soumission:', err)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Une erreur inattendue est survenue. Veuillez réessayer.' 
      },
      { status: 500 }
    )
  }
}

