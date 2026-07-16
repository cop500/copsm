import { NextResponse } from 'next/server'
import { verifyAdminFromRequest } from '@/lib/verifyAdminRequest'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { hashAgentPassword } from '@/lib/agentNotesAuth'
import { buildNotesConcoursExportBuffer } from '@/lib/notesConcoursExcel'
import { calcNote20From70, type CandidatNotesRow } from '@/lib/notesConcoursConstants'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await verifyAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  const url = new URL(request.url)
  if (url.searchParams.get('export') === 'excel') {
    const { data: candidats, error } = await supabaseAdmin
      .from('candidats_notes_concours')
      .select('*')
      .order('nom')
      .order('prenom')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const buf = buildNotesConcoursExportBuffer((candidats ?? []) as CandidatNotesRow[])
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="notes_concours_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  }

  const { data: candidats, error: cErr } = await supabaseAdmin
    .from('candidats_notes_concours')
    .select(
      `*, agents_saisie_notes ( nom )`
    )
    .order('nom')
    .order('prenom')

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  const { data: agents, error: aErr } = await supabaseAdmin
    .from('agents_saisie_notes')
    .select('id, nom, login, actif, created_at')
    .order('nom')

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })

  const list = candidats ?? []
  const total = list.length
  const traites = list.filter((c) => c.note_70 != null).length

  return NextResponse.json({
    candidats: list,
    agents: agents ?? [],
    stats: { total, traites, restants: total - traites },
  })
}

export async function POST(request: Request) {
  const auth = await verifyAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  const body = await request.json()
  const action = body.action as string

  if (action === 'create_agent') {
    const { nom, login, password } = body
    if (!nom?.trim() || !login?.trim() || !password || password.length < 6) {
      return NextResponse.json({ error: 'Nom, login et mot de passe (6+ car.) requis.' }, { status: 400 })
    }
    const password_hash = await hashAgentPassword(password)
    const { data, error } = await supabaseAdmin
      .from('agents_saisie_notes')
      .insert({
        nom: nom.trim(),
        login: login.trim().toLowerCase(),
        password_hash,
        actif: true,
      })
      .select('id, nom, login, actif, created_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ agent: data })
  }

  if (action === 'toggle_agent') {
    const { id, actif } = body
    const { error } = await supabaseAdmin
      .from('agents_saisie_notes')
      .update({ actif: !!actif })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'reset_agent_password') {
    const { id, password } = body
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Mot de passe min. 6 caractères.' }, { status: 400 })
    }
    const password_hash = await hashAgentPassword(password)
    const { error } = await supabaseAdmin
      .from('agents_saisie_notes')
      .update({ password_hash })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Mot de passe mis à jour.' })
  }

  if (action === 'delete_agent') {
    const { id } = body as { id?: string }
    if (!id) return NextResponse.json({ error: 'Agent requis.' }, { status: 400 })
    const { error } = await supabaseAdmin.from('agents_saisie_notes').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Agent supprimé.' })
  }

  if (action === 'update_note') {
    const { id, note_70 } = body as { id?: string; note_70?: number | null }
    if (!id) return NextResponse.json({ error: 'Candidat requis.' }, { status: 400 })

    let note70: number | null = null
    let note20: number | null = null

    if (note_70 != null) {
      note70 = Number(note_70)
      if (Number.isNaN(note70) || note70 < 0 || note70 > 70) {
        return NextResponse.json({ error: 'Note /70 invalide (0 à 70).' }, { status: 400 })
      }
      note20 = calcNote20From70(note70)
    }

    const { data, error } = await supabaseAdmin
      .from('candidats_notes_concours')
      .update({
        note_70: note70,
        note_20: note20,
        saisi_le: note70 != null ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ candidat: data })
  }

  return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 })
}
