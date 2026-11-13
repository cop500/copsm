import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 })
    }
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const { data: auth, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !auth.user) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle()
    if (profile?.role !== 'business_developer') {
      return NextResponse.json({ error: 'Réservé à l’administrateur' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const from = typeof body?.from === 'string' ? body.from.trim() : 'Siham'
    const to = typeof body?.to === 'string' ? body.to.trim() : 'Sihame'
    const role = typeof body?.role === 'string' ? body.role.trim() : 'conseillere_carriere'
    if (!from || !to) {
      return NextResponse.json({ error: 'Prénoms manquants' }, { status: 400 })
    }

    const { data: rows, error: listErr } = await supabaseAdmin
      .from('profiles')
      .select('id, prenom, nom, role')
      .eq('role', role)
    if (listErr) throw listErr

    const cibles = (rows || []).filter(
      (row) => String(row.prenom || '').trim().toLowerCase() === from.toLowerCase()
    )
    if (cibles.length === 0) {
      return NextResponse.json({ ok: true, misAJour: 0 })
    }

    const { error: updErr } = await supabaseAdmin
      .from('profiles')
      .update({ prenom: to })
      .in(
        'id',
        cibles.map((row) => row.id)
      )
    if (updErr) throw updErr

    return NextResponse.json({ ok: true, misAJour: cibles.length, prenom: to })
  } catch (e) {
    console.error('corriger prenom', e)
    return NextResponse.json({ error: 'Impossible de corriger le prénom.' }, { status: 500 })
  }
}
