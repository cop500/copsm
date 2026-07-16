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

  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const limit = Math.min(100, Math.max(10, Number(url.searchParams.get('limit') || 50)))
  const search = url.searchParams.get('search')?.trim() ?? ''
  const filter = url.searchParams.get('filter') ?? 'tous'
  const offset = (page - 1) * limit

  const [{ count: total, error: totalErr }, { count: traites, error: traitesErr }, agentsResult] =
    await Promise.all([
      supabaseAdmin.from('candidats_notes_concours').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('candidats_notes_concours')
        .select('*', { count: 'exact', head: true })
        .not('note_70', 'is', null),
      supabaseAdmin
        .from('agents_saisie_notes')
        .select('id, nom, login, actif, created_at')
        .order('nom'),
    ])

  const countErr = totalErr || traitesErr
  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 })
  }

  if (agentsResult.error) {
    return NextResponse.json({ error: agentsResult.error.message }, { status: 500 })
  }

  let candidatsQuery = supabaseAdmin
    .from('candidats_notes_concours')
    .select(`id, nom, prenom, cef, filiere, note_70, note_20, agents_saisie_notes ( nom )`, {
      count: 'exact',
    })

  if (filter === 'traites') candidatsQuery = candidatsQuery.not('note_70', 'is', null)
  if (filter === 'restants') candidatsQuery = candidatsQuery.is('note_70', null)

  if (search) {
    const q = `%${search.replace(/[%_]/g, '')}%`
    candidatsQuery = candidatsQuery.or(
      `cef.ilike.${q},nom.ilike.${q},prenom.ilike.${q},id_inscription_concours_national.ilike.${q}`
    )
  }

  const { data: candidats, error: cErr, count: filteredTotal } = await candidatsQuery
    .order('nom')
    .order('prenom')
    .range(offset, offset + limit - 1)

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  const totalCount = total ?? 0
  const traitesCount = traites ?? 0
  const listTotal = filteredTotal ?? 0

  return NextResponse.json({
    candidats: candidats ?? [],
    agents: agentsResult.data ?? [],
    stats: { total: totalCount, traites: traitesCount, restants: totalCount - traitesCount },
    pagination: {
      page,
      limit,
      total: listTotal,
      totalPages: Math.max(1, Math.ceil(listTotal / limit)),
    },
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
