import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { ROLES_MISSIONS_AMBASSADEURS } from '@/lib/missionsAmbassadeurs'

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function staffFromRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !supabaseAdmin) return null
  const { data: auth } = await supabaseAdmin.auth.getUser(token)
  if (!auth.user) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', auth.user.id)
    .maybeSingle()
  if (!profile || !ROLES_MISSIONS_AMBASSADEURS.includes(profile.role as (typeof ROLES_MISSIONS_AMBASSADEURS)[number])) {
    return null
  }
  return profile
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await staffFromRequest(request)
    if (!staff) return NextResponse.json({ error: 'Accès réservé au conseiller.' }, { status: 403 })
    const supabase = client()
    if (!supabase) return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const patch: Record<string, unknown> = {}
    if (typeof body?.actif === 'boolean') patch.actif = body.actif
    if (typeof body?.intitule === 'string') patch.intitule = body.intitule.trim()
    if (typeof body?.date_mission === 'string') patch.date_mission = body.date_mission.trim()
    if (typeof body?.lieu === 'string') patch.lieu = body.lieu.trim()
    if (typeof body?.heure_debut === 'string') patch.heure_debut = body.heure_debut.trim()
    if (typeof body?.heure_fin === 'string') patch.heure_fin = body.heure_fin.trim()
    if (typeof body?.conseiller_responsable === 'string') {
      patch.conseiller_responsable = body.conseiller_responsable.trim()
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Rien à modifier.' }, { status: 400 })
    }
    const { error } = await supabase.from('missions_ambassadeurs').update(patch).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('missions PATCH', e)
    return NextResponse.json({ error: 'Modification impossible.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await staffFromRequest(request)
    if (!staff) return NextResponse.json({ error: 'Accès réservé au conseiller.' }, { status: 403 })
    const supabase = client()
    if (!supabase) return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    const { id } = await params
    const { error } = await supabase.from('missions_ambassadeurs').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('missions DELETE', e)
    return NextResponse.json({ error: 'Suppression impossible.' }, { status: 500 })
  }
}
