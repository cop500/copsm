import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  CRITERES_ATELIER,
  nomsCorrespondent,
  normalizeEmail,
  noteValide,
  type CritereAtelierKey,
} from '@/lib/atelierEvaluation'

const MSG_NON_ELIGIBLE =
  'Vous n’êtes pas inscrit à cet atelier, ou votre présence n’a pas encore été validée par l’animateur.'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration serveur incomplète' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const action = body?.action === 'noter' ? 'noter' : 'verifier'
    const atelierId = typeof body?.atelier_id === 'string' ? body.atelier_id.trim() : ''
    const nom = typeof body?.nom === 'string' ? body.nom.trim() : ''
    const email = normalizeEmail(typeof body?.email === 'string' ? body.email : '')

    if (!atelierId || !nom || !email) {
      return NextResponse.json(
        { error: 'Indiquez votre nom et votre e-mail d’inscription.' },
        { status: 400 }
      )
    }

    const { data: inscriptions, error: insErr } = await supabaseAdmin
      .from('inscriptions_ateliers')
      .select('id, stagiaire_nom, stagiaire_email, present, statut')
      .eq('atelier_id', atelierId)
      .ilike('stagiaire_email', email)

    if (insErr) {
      console.error('evaluation lookup', insErr)
      return NextResponse.json({ error: 'Impossible de vérifier l’inscription.' }, { status: 500 })
    }

    const inscription = (inscriptions || []).find(
      (row) =>
        row.statut !== 'annule' &&
        nomsCorrespondent(row.stagiaire_nom || '', nom)
    )

    if (!inscription) {
      return NextResponse.json({ error: MSG_NON_ELIGIBLE }, { status: 403 })
    }

    if (inscription.present !== true) {
      return NextResponse.json(
        {
          error:
            'Votre présence n’a pas encore été validée par l’animateur. Vous pourrez noter l’atelier une fois la présence confirmée.',
        },
        { status: 403 }
      )
    }

    const { data: existante } = await supabaseAdmin
      .from('evaluations_ateliers')
      .select('id')
      .eq('inscription_id', inscription.id)
      .maybeSingle()

    if (existante) {
      return NextResponse.json(
        { error: 'Vous avez déjà noté cet atelier. Merci !', dejaNote: true },
        { status: 409 }
      )
    }

    if (action === 'verifier') {
      return NextResponse.json({ ok: true, inscription_id: inscription.id })
    }

    const notes: Partial<Record<CritereAtelierKey, number>> = {}
    for (const { key } of CRITERES_ATELIER) {
      const n = Number(body?.notes?.[key])
      if (!noteValide(n)) {
        return NextResponse.json(
          { error: 'Merci de noter chaque critère de 1 à 5.' },
          { status: 400 }
        )
      }
      notes[key] = n
    }

    const commentaire =
      typeof body?.commentaire === 'string' ? body.commentaire.trim().slice(0, 1000) : ''

    const { error: insertErr } = await supabaseAdmin.from('evaluations_ateliers').insert({
      atelier_id: atelierId,
      inscription_id: inscription.id,
      clarte: notes.clarte,
      utilite: notes.utilite,
      animation: notes.animation,
      organisation: notes.organisation,
      recommandation: notes.recommandation,
      commentaire: commentaire || null,
    })

    if (insertErr) {
      if (insertErr.code === '23505') {
        return NextResponse.json(
          { error: 'Vous avez déjà noté cet atelier. Merci !', dejaNote: true },
          { status: 409 }
        )
      }
      console.error('evaluation insert', insertErr)
      return NextResponse.json({ error: 'Enregistrement impossible pour le moment.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('evaluation POST', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
