import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const ASSISTANCE_ADMIN_ROLES = new Set(['business_developer'])
export const ASSISTANCE_CONSEILLER_ROLES = new Set(['conseiller_cop', 'conseillere_carriere'])

export type AssistanceProfile = {
  id: string
  role: string
  nom: string
  prenom: string
  email: string
}

export function isAssistanceAdmin(role: string) {
  return ASSISTANCE_ADMIN_ROLES.has(role)
}

export function isAssistanceConseiller(role: string) {
  return ASSISTANCE_CONSEILLER_ROLES.has(role)
}

export async function verifyAssistanceFromRequest(request: Request) {
  if (!supabaseAdmin) {
    return {
      error: NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY manquant côté serveur' },
        { status: 500 }
      ),
    }
  }

  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null
  if (!token) {
    return { error: NextResponse.json({ error: 'Token manquant' }, { status: 401 }) }
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) {
    return { error: NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, nom, prenom, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: 'Profil introuvable' }, { status: 403 }) }
  }

  if (!isAssistanceAdmin(profile.role) && !isAssistanceConseiller(profile.role)) {
    return {
      error: NextResponse.json(
        { error: 'Accès réservé aux conseillers et administrateurs assistance' },
        { status: 403 }
      ),
    }
  }

  return { user, profile: profile as AssistanceProfile, supabaseAdmin }
}
