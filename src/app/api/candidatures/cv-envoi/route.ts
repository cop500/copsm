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
        if (row.cv_telecharge_le) {
          return Promise.resolve({ data: { id: row.id }, error: null })
        }
        return auth.supabaseAdmin!
          .from('candidatures_stagiaires')
          .update({
            cv_telecharge_le: now,
            cv_dernier_envoi_le: now,
            cv_nb_envois: 1,
          })
          .eq('id', row.id)
          .select('id')
          .single()
      })
    )

    const failed = updates.find((r) => r.error)
    if (failed?.error) {
      const hint =
        failed.error.message?.includes('cv_nb_envois') || failed.error.code === '42703'
          ? ' Exécutez add_cv_telecharge_le_to_candidatures.sql sur Supabase.'
          : ''
      throw new Error(failed.error.message + hint)
    }

    const { data: updatedRows, error: selectError } = await auth.supabaseAdmin!
      .from('candidatures_stagiaires')
      .select('id, cv_tri_statut, cv_telecharge_le, cv_dernier_envoi_le, cv_nb_envois')
      .in('id', candidatureIds)

    if (selectError) throw selectError

    return NextResponse.json({
      success: true,
      marked: currentRows?.length ?? 0,
      candidatures: updatedRows ?? [],
    })
  } catch (error) {
    console.error('Erreur API cv-envoi:', error)
    return NextResponse.json({ error: 'Erreur enregistrement envoi CV' }, { status: 500 })
  }
}
