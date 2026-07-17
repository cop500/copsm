import { NextResponse } from 'next/server'
import {
  parseAgentCookie,
  verifyAgentSessionToken,
} from '@/lib/agentNotesAuth'
import { calcNote20From70, isCandidatTraite } from '@/lib/notesConcoursConstants'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

async function requireAgent(request: Request) {
  const token = parseAgentCookie(request.headers.get('cookie'))
  const session = verifyAgentSessionToken(token)
  if (!session || !supabaseAdmin) return null
  const { data } = await supabaseAdmin
    .from('agents_saisie_notes')
    .select('id, nom')
    .eq('id', session.agentId)
    .eq('actif', true)
    .single()
  return data ? { ...data, agentId: session.agentId } : null
}

const CANDIDAT_FIELDS = `
  id, dr, efp, niveau_formation, nom, prenom,
  id_inscription_concours_national, cef, niveau_scolaire, moyenne,
  branche, categorie, filiere, numero_choix, classement, statut,
  tel_1, tel_2, valide, absent, note_70, note_20, saisi_le
`

export async function GET(request: Request) {
  const agent = await requireAgent(request)
  if (!agent) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const cef = new URL(request.url).searchParams.get('cef')?.trim()
  if (!cef) {
    return NextResponse.json({ error: 'CEF requis.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin!
    .from('candidats_notes_concours')
    .select(CANDIDAT_FIELDS)
    .eq('cef', cef)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) {
    return NextResponse.json({ error: 'Aucun candidat trouvé pour ce CEF.' }, { status: 404 })
  }

  return NextResponse.json({ candidat: data })
}

export async function POST(request: Request) {
  const agent = await requireAgent(request)
  if (!agent) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const body = await request.json()
  const { id, note_70 } = body as { id?: string; note_70?: number }

  if (!id) return NextResponse.json({ error: 'Candidat requis.' }, { status: 400 })

  const { data: existing, error: existingErr } = await supabaseAdmin!
    .from('candidats_notes_concours')
    .select('note_70')
    .eq('id', id)
    .single()

  if (existingErr || !existing) {
    return NextResponse.json({ error: 'Candidat introuvable.' }, { status: 404 })
  }

  if (isCandidatTraite(existing.note_70)) {
    return NextResponse.json(
      {
        error:
          'La note est déjà saisie pour ce candidat. Merci de contacter l\'administrateur pour toute modification.',
      },
      { status: 409 }
    )
  }

  const note70 = Number(note_70)
  if (Number.isNaN(note70) || note70 < 0 || note70 > 70) {
    return NextResponse.json({ error: 'Note /70 invalide (0 à 70).' }, { status: 400 })
  }

  const note20 = calcNote20From70(note70)
  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin!
    .from('candidats_notes_concours')
    .update({
      note_70: note70,
      note_20: note20,
      agent_id: agent.agentId,
      saisi_le: now,
      updated_at: now,
    })
    .eq('id', id)
    .select(CANDIDAT_FIELDS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    candidat: data,
    message: 'Notes enregistrées.',
  })
}
