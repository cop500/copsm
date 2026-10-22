import { NextRequest, NextResponse } from 'next/server'
import { verifyPlanningStaffFromRequest } from '@/lib/verifyAdminRequest'

export async function GET(request: NextRequest) {
  const auth = await verifyPlanningStaffFromRequest(request)
  if (auth.error) return auth.error
  const admin = auth.supabaseAdmin
  if (!admin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const { data, error } = await admin
    .from('reservations_visites_jpo')
    .select('*')
    .order('date_visite', { ascending: true })
    .order('creneau', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data || []
  const confirmerIds = Array.from(
    new Set(rows.map((row) => row.confirme_par).filter(Boolean) as string[])
  )

  let namesById: Record<string, string> = {}
  if (confirmerIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nom, prenom, email')
      .in('id', confirmerIds)

    namesById = Object.fromEntries(
      (profiles || []).map((profile) => {
        const fullName = `${profile.prenom || ''} ${profile.nom || ''}`.trim()
        return [profile.id, fullName || profile.email || 'Conseiller COP']
      })
    )
  }

  const reservations = rows.map((row) => ({
    ...row,
    confirme_par_nom: row.confirme_par ? namesById[row.confirme_par] || 'Conseiller COP' : null,
  }))

  return NextResponse.json({ reservations })
}
