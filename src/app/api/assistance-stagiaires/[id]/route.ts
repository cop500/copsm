import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Utiliser la clé de service pour contourner RLS, fallback sur clé anon
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Gérer params qui peut être une Promise dans Next.js 15+
    const resolvedParams = params instanceof Promise ? await params : params
    
    const { data, error } = await supabase
      .from('demandes_assistance_stagiaires')
      .select(`
        *,
        poles(nom, code, couleur),
        filieres(nom, code, color),
        profiles!conseiller_id(nom, prenom, email, role)
      `)
      .eq('id', resolvedParams.id)
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Gérer params qui peut être une Promise dans Next.js 15+
    const resolvedParams = params instanceof Promise ? await params : params
    
    // Vérifier que params.id est valide
    if (!resolvedParams || !resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id.trim() === '') {
      console.error('❌ params.id invalide:', resolvedParams)
      return NextResponse.json(
        { error: 'ID de demande invalide dans l\'URL' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('📥 Requête PUT reçue:', {
      demandeId: resolvedParams.id,
      bodyKeys: Object.keys(body),
      bodyConseillerId: body.conseiller_id
    })
    
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
    
    // Valider et ajouter conseiller_id seulement s'il est défini et valide
    if (body.conseiller_id) {
      const conseillerId = String(body.conseiller_id).trim()
      if (conseillerId && conseillerId !== 'undefined' && conseillerId !== 'null' && conseillerId.length > 0) {
        // Vérifier que c'est un UUID valide (format basique)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (uuidRegex.test(conseillerId)) {
          updateData.conseiller_id = conseillerId
        } else {
          console.error('Format UUID invalide pour conseiller_id:', conseillerId)
          return NextResponse.json(
            { error: 'Format ID conseiller invalide' },
            { status: 400 }
          )
        }
      } else {
        console.error('conseiller_id invalide ou undefined:', body.conseiller_id)
        return NextResponse.json(
          { error: 'ID conseiller invalide' },
          { status: 400 }
        )
      }
    }
    
    if (body.note_conseiller) updateData.note_conseiller = body.note_conseiller

    // Nettoyer updateData pour supprimer toute valeur undefined
    const cleanedUpdateData: any = {}
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== null && value !== 'undefined' && value !== 'null') {
        cleanedUpdateData[key] = value
      }
    }

    // Vérifier qu'il y a au moins un champ à mettre à jour
    if (Object.keys(cleanedUpdateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      )
    }

    console.log('Mise à jour demande assistance:', {
      id: resolvedParams.id,
      updateData: cleanedUpdateData,
      bodyReceived: body
    })

    // Mettre à jour la demande (sans select d'abord pour éviter les problèmes de relation)
    const { data: updateResult, error: updateError } = await supabase
      .from('demandes_assistance_stagiaires')
      .update(cleanedUpdateData)
      .eq('id', resolvedParams.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ Erreur mise à jour demande assistance:', {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        updateData,
        demandeId: resolvedParams.id
      })
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de la mise à jour de la demande'
      if (updateError.code === 'PGRST116') {
        errorMessage = 'Erreur de sécurité: vous n\'avez pas les permissions nécessaires'
      } else if (updateError.code === '23503') {
        errorMessage = 'Erreur: le conseiller sélectionné n\'existe pas'
      } else if (updateError.message) {
        errorMessage = `Erreur: ${updateError.message}`
      }
      
      return NextResponse.json(
        { error: errorMessage, details: updateError },
        { status: 500 }
      )
    }

    // Récupérer les données complètes avec les relations après la mise à jour
    const { data, error } = await supabase
      .from('demandes_assistance_stagiaires')
      .select(`
        *,
        poles(nom, code, couleur),
        filieres(nom, code, color),
        profiles!conseiller_id(nom, prenom, email, role)
      `)
      .eq('id', resolvedParams.id)
      .single()

    // Si erreur lors de la récupération avec relations, retourner quand même les données de base
    if (error) {
      console.warn('⚠️ Erreur récupération relations après mise à jour:', error)
      // On retourne quand même les données de base si la mise à jour a réussi
      if (updateResult) {
        return NextResponse.json({
          success: true,
          message: 'Demande mise à jour avec succès',
          data: updateResult
        }, { status: 200 })
      }
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Gérer params qui peut être une Promise dans Next.js 15+
    const resolvedParams = params instanceof Promise ? await params : params
    
    const { error } = await supabase
      .from('demandes_assistance_stagiaires')
      .delete()
      .eq('id', resolvedParams.id)

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
