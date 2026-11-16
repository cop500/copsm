import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { apercuCvConnect, viderCvConnect } from '@/lib/viderCvConnect'

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
    const apercu = await apercuCvConnect(gate.admin!)
    return NextResponse.json({
      ok: true,
      soumissions: apercu.soumissions,
      fichiers: apercu.fichiers,
    })
  } catch (e) {
    console.error('apercu cv-connect', e)
    return NextResponse.json({ error: 'Impossible d’estimer le stockage CV Connect.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request)
    if ('error' in gate && gate.error) return gate.error
    const body = await request.json().catch(() => ({}))
    if (body?.confirm !== 'VIDER_CV_CONNECT') {
      return NextResponse.json(
        { error: 'Confirmation invalide. Saisissez VIDER_CV_CONNECT.' },
        { status: 400 }
      )
    }
    const resultat = await viderCvConnect(gate.admin!)
    return NextResponse.json({
      ok: true,
      soumissions: resultat.soumissions,
      fichiersSupprimes: resultat.fichiersSupprimes,
      erreurs: resultat.erreurs,
    })
  } catch (e) {
    console.error('vider cv-connect', e)
    return NextResponse.json({ error: 'Échec de la suppression des CV Connect.' }, { status: 500 })
  }
}
