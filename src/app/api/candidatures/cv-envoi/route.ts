import { NextRequest, NextResponse } from 'next/server'
import { verifyStaffFromRequest } from '@/lib/verifyAdminRequest'

export async function POST(request: NextRequest) {
  const auth = await verifyStaffFromRequest(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const candidatureIds = Array.isArray(body.candidatureIds)
      ? ([...new Set(body.candidatureIds.filter(Boolean))] as string[])
      : []

    if (candidatureIds.length === 0) {
      return NextResponse.json({ success: true, marked: 0 })
    }

    const now = new Date().toISOString()
    const { data: currentRows, error: fetchError } = await auth.supabaseAdmin!
      .from('candidatures_stagiaires')
      .select('id, cv_nb_envois, cv_telecharge_le')
      .in('id', candidatureIds)

    if (fetchError) throw fetchError

    const updates = await Promise.all(
      (currentRows ?? []).map((row) => {
        const prevNb = row.cv_nb_envois ?? (row.cv_telecharge_le ? 1 : 0)
        const nextNb = prevNb + 1
        return auth.supabaseAdmin!
          .from('candidatures_stagiaires')
          .update({
            cv_nb_envois: nextNb,
            cv_dernier_envoi_le: now,
            cv_telecharge_le: row.cv_telecharge_le ?? now,
          })
          .eq('id', row.id)
          .select('id')
          .single()
      })
    )

    const failed = updates.find((r) => r.error)
    if (failed?.error) throw failed.error

    return NextResponse.json({ success: true, marked: currentRows?.length ?? 0 })
  } catch (error) {
    console.error('Erreur API cv-envoi:', error)
    return NextResponse.json({ error: 'Erreur enregistrement envoi CV' }, { status: 500 })
  }
}
