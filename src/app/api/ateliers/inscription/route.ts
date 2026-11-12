import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAtelierComplet, isAtelierDatePassee } from '@/lib/atelierInscriptionDisponible'
import { compterInscriptionsActives, synchroniserCapaciteAtelier } from '@/lib/atelierInscriptionsCount'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const body = await request.json()
    const atelierId = body.atelier_id as string | undefined
    const nom = (body.nom as string | undefined)?.trim()
    const email = (body.email as string | undefined)?.trim().toLowerCase()
    const pole = (body.pole as string | undefined)?.trim()
    const filliere = (body.filliere as string | undefined)?.trim()
    const telephone = (body.telephone as string | undefined)?.trim() || null

    if (!atelierId || !nom || !email || !pole || !filliere) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs obligatoires' },
        { status: 400 }
      )
    }

    if (nom.length < 2) {
      return NextResponse.json(
        { error: 'Le nom doit contenir au moins 2 caractères' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: atelier, error: atelierError } = await supabase
      .from('evenements')
      .select('id, titre, capacite_maximale, capacite_actuelle, statut, visible_inscription, date_debut, date_fin')
      .eq('id', atelierId)
      .eq('type_evenement', 'atelier')
      .single()

    if (atelierError || !atelier) {
      return NextResponse.json({ error: 'Atelier introuvable' }, { status: 404 })
    }

    if (!atelier.visible_inscription) {
      return NextResponse.json(
        { error: 'Les inscriptions ne sont pas ouvertes pour cet atelier' },
        { status: 400 }
      )
    }

    if (isAtelierDatePassee(atelier.date_debut, atelier.date_fin)) {
      return NextResponse.json(
        { error: 'Les inscriptions sont closes : cet atelier est déjà passé.' },
        { status: 400 }
      )
    }

    const { data: existingRows } = await supabase
      .from('inscriptions_ateliers')
      .select('id, statut')
      .eq('atelier_id', atelierId)
      .eq('stagiaire_email', email)

    const activeExisting = (existingRows || []).find((row) => row.statut !== 'annule')
    if (activeExisting) {
      return NextResponse.json(
        { error: 'duplicate', message: 'Vous êtes déjà inscrit à cet atelier.' },
        { status: 409 }
      )
    }

    const counts = await compterInscriptionsActives(supabase, [atelierId])
    const activeCount = counts[atelierId] ?? 0
    if (isAtelierComplet(atelier.capacite_maximale, activeCount)) {
      return NextResponse.json({ error: 'Cet atelier est complet' }, { status: 400 })
    }

    const cancelledExisting = (existingRows || []).find((row) => row.statut === 'annule')
    if (cancelledExisting) {
      const { error: reactivateError } = await supabase
        .from('inscriptions_ateliers')
        .update({
          stagiaire_nom: nom,
          pole,
          filliere,
          stagiaire_telephone: telephone,
          statut: null,
          date_inscription: new Date().toISOString(),
        })
        .eq('id', cancelledExisting.id)
      if (reactivateError) throw reactivateError
      await synchroniserCapaciteAtelier(supabase, atelierId)
      return NextResponse.json({
        success: true,
        message: `Inscription confirmée pour l'atelier « ${atelier.titre} ».`,
      })
    }

    const { error: insertError } = await supabase.from('inscriptions_ateliers').insert([
      {
        atelier_id: atelierId,
        stagiaire_nom: nom,
        stagiaire_email: email,
        pole,
        filliere,
        stagiaire_telephone: telephone,
        date_inscription: new Date().toISOString(),
      },
    ])

    if (insertError) throw insertError

    await synchroniserCapaciteAtelier(supabase, atelierId)

    return NextResponse.json({
      success: true,
      message: `Inscription confirmée pour l'atelier « ${atelier.titre} ».`,
    })
  } catch (error) {
    console.error('Erreur API inscription atelier:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 })
  }
}
