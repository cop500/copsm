import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAtelierDatePassee } from '@/lib/atelierInscriptionDisponible'
import { synchroniserCapaciteAtelier } from '@/lib/atelierInscriptionsCount'
import { nomsCorrespondent, normalizeEmail } from '@/lib/atelierEvaluation'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const body = await request.json()
    const atelierId = typeof body?.atelier_id === 'string' ? body.atelier_id.trim() : ''
    const nom = typeof body?.nom === 'string' ? body.nom.trim() : ''
    const email = normalizeEmail(typeof body?.email === 'string' ? body.email : '')

    if (!atelierId || !nom || !email) {
      return NextResponse.json(
        { error: 'Indiquez le nom et l’e-mail utilisés à l’inscription.' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: atelier, error: atelierError } = await supabase
      .from('evenements')
      .select('id, titre, date_debut, date_fin')
      .eq('id', atelierId)
      .eq('type_evenement', 'atelier')
      .single()

    if (atelierError || !atelier) {
      return NextResponse.json({ error: 'Atelier introuvable' }, { status: 404 })
    }

    if (isAtelierDatePassee(atelier.date_debut, atelier.date_fin)) {
      return NextResponse.json(
        { error: 'Cet atelier est déjà passé. L’inscription ne peut plus être annulée.' },
        { status: 400 }
      )
    }

    const { data: rows, error: insErr } = await supabase
      .from('inscriptions_ateliers')
      .select('id, stagiaire_nom, stagiaire_email, statut, present')
      .eq('atelier_id', atelierId)
      .ilike('stagiaire_email', email)

    if (insErr) {
      return NextResponse.json({ error: 'Impossible de vérifier l’inscription.' }, { status: 500 })
    }

    const inscription = (rows || []).find(
      (row) => row.statut !== 'annule' && nomsCorrespondent(row.stagiaire_nom || '', nom)
    )

    if (!inscription) {
      return NextResponse.json(
        {
          error:
            'Aucune inscription active trouvée pour cet e-mail et ce nom. Vérifiez les informations saisies à l’inscription.',
        },
        { status: 404 }
      )
    }

    if (inscription.present === true) {
      return NextResponse.json(
        {
          error:
            'Votre présence a déjà été validée. L’inscription ne peut plus être annulée. Contactez le COP si besoin.',
        },
        { status: 403 }
      )
    }

    const { error: updErr } = await supabase
      .from('inscriptions_ateliers')
      .update({ statut: 'annule' })
      .eq('id', inscription.id)

    if (updErr) throw updErr

    await synchroniserCapaciteAtelier(supabase, atelierId)

    return NextResponse.json({
      success: true,
      message: `Inscription annulée pour l’atelier « ${atelier.titre} ». Une place a été libérée.`,
    })
  } catch (error) {
    console.error('Erreur annulation inscription atelier:', error)
    return NextResponse.json({ error: 'Erreur lors de l’annulation' }, { status: 500 })
  }
}
