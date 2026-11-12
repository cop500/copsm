import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { listerCvDemandesTerminees, supprimerPdfCandidatures } from '@/lib/libererCvTerminees'

async function assertAdmin(request: NextRequest) {
  if (!supabaseAdmin) {
    return { error: NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 }) }
  }
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }
  const { data: auth, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !auth.user) {
    return { error: NextResponse.json({ error: 'Session invalide' }, { status: 401 }) }
  }
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle()
  if (profile?.role !== 'business_developer') {
    return { error: NextResponse.json({ error: 'Réservé à l’administrateur' }, { status: 403 }) }
  }
  return { admin: supabaseAdmin }
}

export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request)
    if ('error' in gate && gate.error) return gate.error
    const cibles = await listerCvDemandesTerminees(gate.admin!)
    return NextResponse.json({
      ok: true,
      demandesTerminees: cibles.demandes,
      cvALiberer: cibles.candidaturesAvecCv,
      fichiersUniques: cibles.chemins.length,
    })
  } catch (e) {
    console.error('preview liberer cv', e)
    return NextResponse.json({ error: 'Impossible d’estimer les fichiers.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request)
    if ('error' in gate && gate.error) return gate.error
    const admin = gate.admin!
    const body = await request.json().catch(() => ({}))
    const demandeId = typeof body?.demandeId === 'string' ? body.demandeId.trim() : ''

    if (demandeId) {
      const { data: demande, error } = await admin
        .from('demandes_entreprises')
        .select('id, statut')
        .eq('id', demandeId)
        .maybeSingle()
      if (error || !demande) {
        return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
      }
      if (demande.statut !== 'terminee') {
        return NextResponse.json(
          { error: 'Les PDF ne sont retirés que pour une demande terminée.' },
          { status: 400 }
        )
      }
      const cibles = await listerCvDemandesTerminees(admin, [demandeId])
      const resultat = await supprimerPdfCandidatures(admin, cibles)
      return NextResponse.json({
        ok: true,
        demandesTerminees: 1,
        fichesConservees: cibles.candidaturesAvecCv,
        fichiersSupprimes: resultat.fichiersSupprimes,
        erreurs: resultat.erreurs,
      })
    }

    if (body?.confirm !== 'LIBERER') {
      return NextResponse.json(
        { error: 'Confirmation invalide. Saisissez LIBERER.' },
        { status: 400 }
      )
    }

    const cibles = await listerCvDemandesTerminees(admin)
    const resultat = await supprimerPdfCandidatures(admin, cibles)
    return NextResponse.json({
      ok: true,
      demandesTerminees: cibles.demandes,
      fichesConservees: cibles.candidaturesAvecCv,
      fichiersSupprimes: resultat.fichiersSupprimes,
      erreurs: resultat.erreurs,
    })
  } catch (e) {
    console.error('liberer cv terminees', e)
    return NextResponse.json({ error: 'Échec de la libération du stockage.' }, { status: 500 })
  }
}
