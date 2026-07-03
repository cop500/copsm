import { NextRequest, NextResponse } from 'next/server'
import { verifyStaffFromRequest } from '@/lib/verifyAdminRequest'

const VALID_TRI = new Set(['en_attente', 'accepte', 'refuse'])

export async function PATCH(request: NextRequest) {
  const auth = await verifyStaffFromRequest(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const candidatureId = body.candidatureId as string | undefined
    const cvTriStatut = body.cv_tri_statut as string | undefined

    if (!candidatureId) {
      return NextResponse.json({ error: 'candidatureId requis' }, { status: 400 })
    }
    if (!cvTriStatut || !VALID_TRI.has(cvTriStatut)) {
      return NextResponse.json({ error: 'cv_tri_statut invalide' }, { status: 400 })
    }

    const dateMaj = new Date().toISOString().split('T')[0]
    const { data, error } = await auth.supabaseAdmin!
      .from('candidatures_stagiaires')
      .update({
        cv_tri_statut: cvTriStatut,
        date_derniere_maj: dateMaj,
      })
      .eq('id', candidatureId)
      .select('id, cv_tri_statut')
      .single()

    if (error) {
      console.error('Erreur API cv-tri:', error)
      const hint =
        error.message?.includes('cv_tri_statut') || error.code === '42703'
          ? ' Exécutez la migration add_cv_tri_statut_to_candidatures.sql sur Supabase.'
          : ''
      return NextResponse.json(
        { error: 'Impossible de sauvegarder le tri CV.' + hint, details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })
    }

    return NextResponse.json({ success: true, candidature: data })
  } catch (error) {
    console.error('Erreur API cv-tri:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
