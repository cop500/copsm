import { NextResponse } from 'next/server'
import { verifyVideoNotesAdminFromRequest } from '@/lib/verifyAdminRequest'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { CanevasRubrique, CanevasRubriqueFieldRule } from '@/lib/canevasRubrique'
import { DEFAULT_CANEVAS_PARAMETRES, type CanevasColumnRule } from '@/lib/canevasRules'
import type { CanevasParametres } from '@/lib/canevasRules'

export const runtime = 'nodejs'

function tableHint(error: { message?: string; code?: string }) {
  if (error.message?.includes('admission_canevas_rubriques') || error.code === '42P01') {
    return ' Exécutez create_admission_canevas_rubriques.sql sur Supabase.'
  }
  return ''
}

function normalizeRegles(raw: unknown): CanevasRubriqueFieldRule[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((r) => {
      const item = r as CanevasRubriqueFieldRule
      if (!item.fieldKey || !item.rule?.mode) return null
      return {
        fieldKey: String(item.fieldKey).trim(),
        fieldLabel: String(item.fieldLabel ?? item.fieldKey).trim(),
        rule: item.rule as CanevasColumnRule,
      }
    })
    .filter(Boolean) as CanevasRubriqueFieldRule[]
}

function normalizeParametres(raw: Partial<CanevasParametres> | undefined): CanevasParametres {
  const base = { ...DEFAULT_CANEVAS_PARAMETRES }
  if (!raw) return base
  return {
    groupSourceColumnIndex:
      raw.groupSourceColumnIndex == null ? null : Number(raw.groupSourceColumnIndex),
    groupSourceColumnLabel: raw.groupSourceColumnLabel?.trim() || null,
    tauxMin: Number.isFinite(Number(raw.tauxMin)) ? Number(raw.tauxMin) : base.tauxMin,
    tauxMax: Number.isFinite(Number(raw.tauxMax)) ? Number(raw.tauxMax) : base.tauxMax,
    tauxCible: Number.isFinite(Number(raw.tauxCible)) ? Number(raw.tauxCible) : base.tauxCible,
  }
}

export async function GET(request: Request) {
  const auth = await verifyVideoNotesAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('admission_canevas_rubriques')
    .select('id, nom, description, regles, parametres, created_at, updated_at')
    .order('nom')

  if (error) {
    return NextResponse.json({ error: error.message + tableHint(error) }, { status: 500 })
  }

  const rubriques = (data ?? []).map((row) => ({
    ...row,
    regles: normalizeRegles(row.regles),
    parametres: normalizeParametres(row.parametres as Partial<CanevasParametres>),
  }))

  return NextResponse.json({ rubriques: rubriques as CanevasRubrique[] })
}

export async function POST(request: Request) {
  const auth = await verifyVideoNotesAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  let body: {
    nom?: string
    description?: string
    regles?: CanevasRubriqueFieldRule[]
    parametres?: Partial<CanevasParametres>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const nom = body.nom?.trim()
  if (!nom) return NextResponse.json({ error: 'Nom de la rubrique requis.' }, { status: 400 })

  const regles = normalizeRegles(body.regles)
  if (!regles.length) {
    return NextResponse.json({ error: 'Au moins une règle requise.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('admission_canevas_rubriques')
    .insert({
      nom,
      description: body.description?.trim() || null,
      regles,
      parametres: normalizeParametres(body.parametres),
    })
    .select('id, nom, description, regles, parametres, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message + tableHint(error) }, { status: 500 })
  }

  return NextResponse.json({ success: true, rubrique: data as CanevasRubrique })
}

export async function PATCH(request: Request) {
  const auth = await verifyVideoNotesAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  let body: {
    id?: string
    nom?: string
    description?: string
    regles?: CanevasRubriqueFieldRule[]
    parametres?: Partial<CanevasParametres>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const id = body.id?.trim()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.nom?.trim()) update.nom = body.nom.trim()
  if (body.description !== undefined) update.description = body.description?.trim() || null
  if (body.regles) update.regles = normalizeRegles(body.regles)
  if (body.parametres) update.parametres = normalizeParametres(body.parametres)

  const { data, error } = await supabaseAdmin
    .from('admission_canevas_rubriques')
    .update(update)
    .eq('id', id)
    .select('id, nom, description, regles, parametres, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message + tableHint(error) }, { status: 500 })
  }

  return NextResponse.json({ success: true, rubrique: data as CanevasRubrique })
}

export async function DELETE(request: Request) {
  const auth = await verifyVideoNotesAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  const id = new URL(request.url).searchParams.get('id')?.trim()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { error } = await supabaseAdmin.from('admission_canevas_rubriques').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message + tableHint(error) }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
