import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'

// POST: Valider les présences des inscriptions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const atelierId = resolvedParams.id

    if (!atelierId) {
      return NextResponse.json(
        { error: 'ID de l\'atelier manquant' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { inscriptionIds } = body

    if (!inscriptionIds || !Array.isArray(inscriptionIds) || inscriptionIds.length === 0) {
      return NextResponse.json(
        { error: 'Liste des IDs d\'inscriptions manquante ou vide' },
        { status: 400 }
      )
    }

    // Vérifier que l'atelier existe et est terminé
    const { data: atelier, error: atelierError } = await supabase
      .from('evenements')
      .select('id, statut, animateur_id')
      .eq('id', atelierId)
      .eq('type_evenement', 'atelier')
      .single()

    if (atelierError || !atelier) {
      return NextResponse.json(
        { error: 'Atelier non trouvé' },
        { status: 404 }
      )
    }

    if (atelier.statut !== 'termine') {
      return NextResponse.json(
        { error: 'L\'atelier doit être terminé pour valider les présences' },
        { status: 400 }
      )
    }

    // Vérifier que les inscriptions appartiennent bien à cet atelier
    const { data: inscriptions, error: inscriptionsError } = await supabase
      .from('inscriptions_ateliers')
      .select('id, atelier_id')
      .in('id', inscriptionIds)
      .eq('atelier_id', atelierId)

    if (inscriptionsError) {
      console.error('Erreur vérification inscriptions:', inscriptionsError)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des inscriptions' },
        { status: 500 }
      )
    }

    if (!inscriptions || inscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Aucune inscription valide trouvée' },
        { status: 400 }
      )
    }

    // Valider les présences et générer les tokens
    const now = new Date().toISOString()
    const updates: Array<{ id: string; present: boolean; date_validation_presence: string; certificat_token: string; date_generation_certificat: string }> = inscriptions.map(inscription => ({
      id: String(inscription.id),
      present: true,
      date_validation_presence: now,
      certificat_token: randomUUID(), // Générer un token unique pour chaque inscription
      date_generation_certificat: now
    }))

    // Mettre à jour les inscriptions une par une (car on doit générer un token unique pour chacune)
    const results: any[] = []
    const errors: Array<{ id: string; error: string }> = []

    for (const update of updates) {
      try {
        const { data, error } = await supabase
          .from('inscriptions_ateliers')
          .update({
            present: update.present,
            date_validation_presence: update.date_validation_presence,
            certificat_token: update.certificat_token,
            date_generation_certificat: update.date_generation_certificat
          })
          .eq('id', update.id)
          .select()
          .single()

        if (error) {
          console.error(`Erreur mise à jour inscription ${update.id}:`, error)
          errors.push({ id: update.id, error: error.message })
        } else {
          results.push(data)
        }
      } catch (err: any) {
        console.error(`Erreur mise à jour inscription ${update.id}:`, err)
        errors.push({ id: update.id, error: err.message })
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Aucune présence n\'a pu être validée', errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${results.length} présence(s) validée(s) avec succès`,
      validated: results,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Erreur validation présences:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la validation des présences', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Mettre à jour une seule inscription (validation individuelle)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const atelierId = resolvedParams.id

    if (!atelierId) {
      return NextResponse.json(
        { error: 'ID de l\'atelier manquant' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { inscriptionId, present } = body

    if (!inscriptionId) {
      return NextResponse.json(
        { error: 'ID de l\'inscription manquant' },
        { status: 400 }
      )
    }

    // Vérifier que l'atelier existe et est terminé
    const { data: atelier, error: atelierError } = await supabase
      .from('evenements')
      .select('id, statut')
      .eq('id', atelierId)
      .eq('type_evenement', 'atelier')
      .single()

    if (atelierError || !atelier) {
      return NextResponse.json(
        { error: 'Atelier non trouvé' },
        { status: 404 }
      )
    }

    if (atelier.statut !== 'termine') {
      return NextResponse.json(
        { error: 'L\'atelier doit être terminé pour valider les présences' },
        { status: 400 }
      )
    }

    // Vérifier que l'inscription appartient à cet atelier
    const { data: inscription, error: inscriptionError } = await supabase
      .from('inscriptions_ateliers')
      .select('id, atelier_id')
      .eq('id', inscriptionId)
      .eq('atelier_id', atelierId)
      .single()

    if (inscriptionError || !inscription) {
      return NextResponse.json(
        { error: 'Inscription non trouvée ou n\'appartient pas à cet atelier' },
        { status: 404 }
      )
    }

    const updateData: any = {
      present: present === true || present === 'true'
    }

    // Si on valide la présence, générer le token et la date
    if (updateData.present) {
      updateData.date_validation_presence = new Date().toISOString()
      updateData.certificat_token = randomUUID()
      updateData.date_generation_certificat = new Date().toISOString()
    } else {
      // Si on retire la validation, nettoyer les champs
      updateData.date_validation_presence = null
      updateData.certificat_token = null
      updateData.date_generation_certificat = null
    }

    // Mettre à jour l'inscription
    const { data: updatedInscription, error: updateError } = await supabase
      .from('inscriptions_ateliers')
      .update(updateData)
      .eq('id', inscriptionId)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur mise à jour inscription:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'inscription', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: updateData.present 
        ? 'Présence validée avec succès' 
        : 'Validation de présence retirée',
      inscription: updatedInscription
    })
  } catch (error: any) {
    console.error('Erreur mise à jour présence:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de la présence', details: error.message },
      { status: 500 }
    )
  }
}

