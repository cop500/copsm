import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
      .select('id, titre, capacite_maximale, capacite_actuelle, statut, visible_inscription')
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

    const { data: existing } = await supabase
      .from('inscriptions_ateliers')
      .select('id')
      .eq('atelier_id', atelierId)
      .eq('stagiaire_email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'duplicate', message: 'Vous êtes déjà inscrit à cet atelier.' },
        { status: 409 }
      )
    }

    const { data: activeInscriptions, error: countError } = await supabase
      .from('inscriptions_ateliers')
      .select('id')
      .eq('atelier_id', atelierId)
      .or('statut.is.null,statut.neq.annule')

    if (countError) throw countError

    const activeCount = activeInscriptions?.length ?? 0
    const capaciteMax = atelier.capacite_maximale ?? 0
    if (capaciteMax > 0 && activeCount >= capaciteMax) {
      return NextResponse.json({ error: 'Cet atelier est complet' }, { status: 400 })
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

    const { error: updateError } = await supabase
      .from('evenements')
      .update({ capacite_actuelle: (atelier.capacite_actuelle ?? 0) + 1 })
      .eq('id', atelierId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: `Inscription confirmée pour l'atelier « ${atelier.titre} ».`,
    })
  } catch (error) {
    console.error('Erreur API inscription atelier:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 })
  }
}
