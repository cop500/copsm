import { NextResponse } from 'next/server'
import {
  agentSessionCookieName,
  createAgentSessionToken,
  parseAgentCookie,
  verifyAgentPassword,
  verifyAgentSessionToken,
} from '@/lib/agentNotesAuth'
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

  const { data: agent, error } = await supabaseAdmin
    .from('agents_saisie_notes')
    .select('id, nom, login, password_hash, actif')
    .eq('login', login.trim().toLowerCase())
    .maybeSingle()

  if (error || !agent || !agent.actif) {
    return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
  }

  const ok = await verifyAgentPassword(password, agent.password_hash)
  if (!ok) {
    return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
  }

  const token = createAgentSessionToken(agent.id)
  const res = NextResponse.json({
    success: true,
    agent: { id: agent.id, nom: agent.nom },
  })

  res.cookies.set(agentSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60,
  })

  return res
}

export async function GET(request: Request) {
  const token = parseAgentCookie(request.headers.get('cookie'))
  const session = verifyAgentSessionToken(token)
  if (!session || !supabaseAdmin) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('agents_saisie_notes')
    .select('id, nom')
    .eq('id', session.agentId)
    .eq('actif', true)
    .single()

  if (!data) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true, agent: data })
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(agentSessionCookieName(), '', { path: '/', maxAge: 0 })
  return res
}
