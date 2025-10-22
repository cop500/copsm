import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Utiliser la clé de service pour contourner RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('demandes_assistance_stagiaires')
      .select(`
        *,
        poles(nom, code, couleur),
        filieres(nom, code, color),
        profiles!conseiller_id(nom, prenom, email, role)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Erreur récupération demande assistance:', error)
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 200 })

  } catch (error) {
    console.error('Erreur API GET assistance-stagiaires/[id]:', error)
    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validation du statut si fourni
    if (body.statut) {
      const validStatuts = ['en_attente', 'en_cours', 'terminee']
      if (!validStatuts.includes(body.statut)) {
        return NextResponse.json(
          { error: 'Statut invalide' },
          { status: 400 }
        )
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    
    if (body.statut) updateData.statut = body.statut
    if (body.conseiller_id) updateData.conseiller_id = body.conseiller_id
    if (body.note_conseiller) updateData.note_conseiller = body.note_conseiller

    // Mettre à jour la demande
    const { data, error } = await supabase
      .from('demandes_assistance_stagiaires')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        poles(nom, code, couleur),
        filieres(nom, code, color),
        profiles!conseiller_id(nom, prenom, email, role)
      `)
      .single()

    if (error) {
      console.error('Erreur mise à jour demande assistance:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la demande' },
        { status: 500 }
      )
    }

    // Log pour le suivi
    console.log('Demande d\'assistance mise à jour:', {
      id: data.id,
      statut: data.statut,
      conseiller: data.profiles?.prenom + ' ' + data.profiles?.nom
    })

    return NextResponse.json({
      success: true,
      message: 'Demande mise à jour avec succès',
      data
    }, { status: 200 })

  } catch (error) {
    console.error('Erreur API PUT assistance-stagiaires/[id]:', error)
    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('demandes_assistance_stagiaires')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Erreur suppression demande assistance:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la demande' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Demande supprimée avec succès'
    }, { status: 200 })

  } catch (error) {
    console.error('Erreur API DELETE assistance-stagiaires/[id]:', error)
    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue.' },
      { status: 500 }
    )
  }
}
