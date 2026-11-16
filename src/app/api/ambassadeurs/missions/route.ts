import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  ROLES_MISSIONS_AMBASSADEURS,
  aujourdHuiCasablanca,
  missionEstPassee,
} from '@/lib/missionsAmbassadeurs'

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

export async function GET(request: NextRequest) {
  try {
    const supabase = client()
    if (!supabase) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    const staff = await staffFromRequest(request)
    const admin = request.nextUrl.searchParams.get('admin') === '1'

    if (admin) {
      if (!staff) {
        return NextResponse.json({ error: 'Accès réservé au conseiller.' }, { status: 403 })
      }
      const { data: missions, error } = await supabase
        .from('missions_ambassadeurs')
        .select('*')
        .order('date_mission', { ascending: true })
        .order('heure_debut', { ascending: true })
      if (error) throw error
      const ids = (missions || []).map((m) => m.id)
      let dispos: any[] = []
      if (ids.length > 0) {
        const { data: d, error: dErr } = await supabase
          .from('missions_ambassadeurs_disponibilites')
          .select('*')
          .in('mission_id', ids)
          .order('created_at', { ascending: true })
        if (dErr) throw dErr
        dispos = d || []
      }
      const parMission = new Map<string, any[]>()
      for (const row of dispos) {
        const list = parMission.get(row.mission_id) || []
        list.push(row)
        parMission.set(row.mission_id, list)
      }
      return NextResponse.json({
        missions: (missions || []).map((m) => ({
          ...m,
          disponibilites: parMission.get(m.id) || [],
          nb_disponibles: (parMission.get(m.id) || []).length,
        })),
      })
    }

    const today = aujourdHuiCasablanca()
    const { data, error } = await supabase
      .from('missions_ambassadeurs')
      .select('id, intitule, date_mission, lieu, heure_debut, heure_fin, conseiller_responsable, actif')
      .eq('actif', true)
      .gte('date_mission', today)
      .order('date_mission', { ascending: true })
      .order('heure_debut', { ascending: true })
    if (error) throw error
    const missions = (data || []).filter((m) => !missionEstPassee(m.date_mission, m.heure_debut))
    return NextResponse.json({ missions })
  } catch (e) {
    console.error('missions ambassadeurs GET', e)
    return NextResponse.json(
      { error: 'Impossible de charger les missions. Vérifiez que le SQL a été exécuté.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await staffFromRequest(request)
    if (!staff) {
      return NextResponse.json({ error: 'Accès réservé au conseiller.' }, { status: 403 })
    }
    const supabase = client()
    if (!supabase) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }
    const body = await request.json().catch(() => ({}))
    const intitule = typeof body?.intitule === 'string' ? body.intitule.trim() : ''
    const date_mission = typeof body?.date_mission === 'string' ? body.date_mission.trim() : ''
    const lieu = typeof body?.lieu === 'string' ? body.lieu.trim() : ''
    const heure_debut = typeof body?.heure_debut === 'string' ? body.heure_debut.trim() : ''
    const heure_fin = typeof body?.heure_fin === 'string' ? body.heure_fin.trim() : ''
    const conseiller_responsable =
      typeof body?.conseiller_responsable === 'string' ? body.conseiller_responsable.trim() : ''

    if (!intitule) return NextResponse.json({ error: 'Indiquez l’intitulé de la mission.' }, { status: 400 })
    if (!date_mission) return NextResponse.json({ error: 'Indiquez la date.' }, { status: 400 })
    if (!lieu) return NextResponse.json({ error: 'Indiquez le lieu.' }, { status: 400 })
    if (!heure_debut || !heure_fin) {
      return NextResponse.json({ error: 'Indiquez le créneau horaire.' }, { status: 400 })
    }
    if (heure_fin <= heure_debut) {
      return NextResponse.json({ error: 'L’heure de fin doit être après l’heure de début.' }, { status: 400 })
    }
    if (!conseiller_responsable) {
      return NextResponse.json({ error: 'Indiquez le conseiller responsable.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('missions_ambassadeurs')
      .insert({
        intitule,
        date_mission,
        lieu,
        heure_debut,
        heure_fin,
        conseiller_responsable,
        actif: true,
        created_by: staff.id,
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ ok: true, mission: data })
  } catch (e) {
    console.error('missions ambassadeurs POST', e)
    return NextResponse.json({ error: 'Enregistrement impossible.' }, { status: 500 })
  }
}
