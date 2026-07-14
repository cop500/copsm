import { NextResponse } from 'next/server'
import {
  createFormateurSessionToken,
  formateurSessionCookieName,
  parseFormateurCookie,
  verifyFormateurPassword,
  verifyFormateurSessionToken,
} from '@/lib/formateurAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  const { login, password } = await request.json()
  if (!login?.trim() || !password) {
    return NextResponse.json({ error: 'Identifiant et mot de passe requis.' }, { status: 400 })
  }

  const { data: formateur, error } = await supabaseAdmin
    .from('formateurs_video')
    .select('id, nom, login, password_hash, filiere, actif')
    .eq('login', login.trim().toLowerCase())
    .maybeSingle()

  if (error || !formateur || !formateur.actif) {
    return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
  }

  const ok = await verifyFormateurPassword(password, formateur.password_hash)
  if (!ok) {
    return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
  }

  const token = createFormateurSessionToken(formateur.id)
  const res = NextResponse.json({
    success: true,
    formateur: {
      id: formateur.id,
      nom: formateur.nom,
      filiere: formateur.filiere,
    },
  })

  res.cookies.set(formateurSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60,
  })

  return res
}

export async function GET(request: Request) {
  const token = parseFormateurCookie(request.headers.get('cookie'))
  const session = verifyFormateurSessionToken(token)
  if (!session || !supabaseAdmin) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('formateurs_video')
    .select('id, nom, filiere')
    .eq('id', session.formateurId)
    .eq('actif', true)
    .single()

  if (!data) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true, formateur: data })
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(formateurSessionCookieName(), '', { path: '/', maxAge: 0 })
  return res
}
