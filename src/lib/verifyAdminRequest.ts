import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function verifyAdminFromRequest(request: Request) {
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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: 'Profil introuvable' }, { status: 403 }) }
  }

  if (profile.role !== 'business_developer') {
    return { error: NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 }) }
  }

  return { user, profile }
}

/** Admin ou Manager COP — accès modules Vidéo et NOTE. */
const VIDEO_NOTES_ADMIN_ROLES = new Set(['business_developer', 'manager_cop'])

export async function verifyVideoNotesAdminFromRequest(request: Request) {
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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: 'Profil introuvable' }, { status: 403 }) }
  }

  if (!VIDEO_NOTES_ADMIN_ROLES.has(profile.role)) {
    return {
      error: NextResponse.json(
        { error: 'Accès réservé aux administrateurs et managers COP' },
        { status: 403 }
      ),
    }
  }

  return { user, profile, supabaseAdmin }
}

const STAFF_CANDIDATURE_ROLES = new Set([
  'business_developer',
  'conseillere_carriere',
  'conseiller_cop',
  'manager_cop',
])

/** Staff autorisé à gérer les candidatures (tri CV, envois…). */
export async function verifyStaffFromRequest(request: Request) {
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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: 'Profil introuvable' }, { status: 403 }) }
  }

  if (!STAFF_CANDIDATURE_ROLES.has(profile.role)) {
    return { error: NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 }) }
  }

  return { user, profile, supabaseAdmin }
}
