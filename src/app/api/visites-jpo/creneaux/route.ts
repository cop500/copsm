import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const from = request.nextUrl.searchParams.get('from')
  const to = request.nextUrl.searchParams.get('to')
  const date = request.nextUrl.searchParams.get('date')

  let query = supabaseAdmin
    .from('reservations_visites_jpo')
    .select('date_visite, creneau, statut')
    .in('statut', ['en_attente', 'confirmee'])

  if (date) {
    query = query.eq('date_visite', date)
  } else {
    if (from) query = query.gte('date_visite', from)
    if (to) query = query.lte('date_visite', to)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { occupe: data || [] },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
