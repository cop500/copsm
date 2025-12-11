import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type RowInput = Record<string, any>

const NOTES_FIELDS = [
  'niveau_technique',
  'communication',
  'soft_skills',
  'adequation_besoins',
  'organisation_globale',
  'accueil_accompagnement',
  'communication_avant_event',
  'pertinence_profils',
  'fluidite_delais',
  'logistique_espace'
]

const ENUM_PROFIL_INTERESSANT = ['oui', 'non', 'en_cours']
const ENUM_INTENTION_RECRUTER = ['oui', 'non', 'peut_etre']
const ENUM_NOMBRE_PROFILS = ['0', '1', '2-5', '+5']
const ENUM_INTENTION_REVENIR = ['oui', 'non', 'peut_etre']
const ENUM_RECOMMANDATION = ['oui', 'non']

function isValidNote(value: any) {
  const num = Number(value)
  return Number.isFinite(num) && num >= 1 && num <= 5
}

function normalizeString(value: any) {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed.length ? trimmed : null
}

function normalizeEnum(value: any, allowed: string[]) {
  if (value === null || value === undefined) return null
  const v = String(value).trim().toLowerCase()
  return allowed.includes(v) ? v : null
}

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY manquant côté serveur' },
      { status: 500 }
    )
  }

  // Auth via Bearer token (session Supabase côté client)
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null
  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
  }

  const {
    data: { user },
    error: userError
  } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
  }

  // Vérifier le rôle dans profiles
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })
  }

  if (profile.role !== 'business_developer') {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  let body: { rows?: RowInput[] }
  try {
    body = await request.json()
  } catch (err) {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const rows = body?.rows
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Aucune ligne à importer' }, { status: 400 })
  }

  const prepared: any[] = []
  const errors: Array<{ index: number; message: string }> = []

  rows.forEach((row, index) => {
    const nom_entreprise = normalizeString(row.nom_entreprise)
    const nom_representant = normalizeString(row.nom_representant)
    const fonction_representant = normalizeString(row.fonction_representant)
    const email_entreprise = normalizeString(row.email_entreprise)

    if (!nom_entreprise || !nom_representant || !fonction_representant || !email_entreprise) {
      errors.push({ index, message: 'Champs requis manquants' })
      return
    }

    const record: any = {
      nom_entreprise,
      nom_representant,
      fonction_representant,
      email_entreprise,
      telephone_entreprise: normalizeString(row.telephone_entreprise),
      profil_interessant: normalizeEnum(row.profil_interessant, ENUM_PROFIL_INTERESSANT),
      intention_recruter: normalizeEnum(row.intention_recruter, ENUM_INTENTION_RECRUTER),
      nombre_profils_retenus: normalizeEnum(row.nombre_profils_retenus, ENUM_NOMBRE_PROFILS),
      intention_revenir: normalizeEnum(row.intention_revenir, ENUM_INTENTION_REVENIR),
      recommandation_autres_entreprises: normalizeEnum(
        row.recommandation_autres_entreprises,
        ENUM_RECOMMANDATION
      ),
      suggestions: normalizeString(row.suggestions)
    }

    // Notes 1-5
    NOTES_FIELDS.forEach((field) => {
      const value = row[field]
      if (value === null || value === undefined || value === '') {
        record[field] = null
      } else if (isValidNote(value)) {
        record[field] = Number(value)
      } else {
        errors.push({ index, message: `Note invalide pour ${field}` })
      }
    })

    if (!errors.find((e) => e.index === index)) {
      prepared.push(record)
    }
  })

  if (prepared.length === 0) {
    return NextResponse.json({ error: 'Aucune ligne valide', details: errors }, { status: 400 })
  }

  const { error: insertError } = await supabaseAdmin
    .from('satisfaction_entreprises_jobdating')
    .insert(prepared)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    imported: prepared.length,
    rejected: errors,
    message: 'Import terminé'
  })
}

