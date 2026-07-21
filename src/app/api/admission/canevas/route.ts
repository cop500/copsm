import { NextResponse } from 'next/server'
import { verifyVideoNotesAdminFromRequest } from '@/lib/verifyAdminRequest'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { CanevasColumnWithRule } from '@/lib/canevasRules'
import { DEFAULT_CANEVAS_PARAMETRES, type CanevasParametres } from '@/lib/canevasRules'

export const runtime = 'nodejs'

export interface AdmissionCanevasRow {
  id: string
  nom: string
  description: string | null
  fichier_source: string | null
  feuille_nom: string
  colonnes: CanevasColumnWithRule[]
  parametres: CanevasParametres
  created_at: string
  updated_at: string
}

function tableHint(error: { message?: string; code?: string }) {
  if (error.message?.includes('admission_canevas') || error.code === '42P01') {
    return ' Exécutez create_admission_canevas_tables.sql sur Supabase.'
  }
  if (error.message?.includes('parametres')) {
    return ' Exécutez add_admission_canevas_parametres.sql sur Supabase.'
  }
  return ''
}

function normalizeColonnes(colonnes: CanevasColumnWithRule[]): CanevasColumnWithRule[] {
  return colonnes
    .map((c, i) => ({
      index: typeof c.index === 'number' ? c.index : i,
      label: String(c.label ?? '').trim(),
      rule: c.rule
        ? {
            mode: c.rule.mode,
            manualValue: c.rule.manualValue?.trim() || undefined,
            sourceColumnIndex:
              c.rule.sourceColumnIndex === null || c.rule.sourceColumnIndex === undefined
                ? null
                : Number(c.rule.sourceColumnIndex),
            sourceColumnLabel: c.rule.sourceColumnLabel?.trim() || null,
            moisSourceColumnLabel: c.rule.moisSourceColumnLabel?.trim() || null,
            anneeSourceColumnLabel: c.rule.anneeSourceColumnLabel?.trim() || null,
          }
        : undefined,
    }))
    .filter((c) => c.label.length > 0)
}

function normalizeParametres(raw: Partial<CanevasParametres> | undefined): CanevasParametres {
  const base = { ...DEFAULT_CANEVAS_PARAMETRES }
  if (!raw) return base

  const tauxMin = Number(raw.tauxMin)
  const tauxMax = Number(raw.tauxMax)
  const tauxCible = Number(raw.tauxCible)

  return {
    groupSourceColumnIndex:
      raw.groupSourceColumnIndex === null || raw.groupSourceColumnIndex === undefined
        ? null
        : Number(raw.groupSourceColumnIndex),
    groupSourceColumnLabel: raw.groupSourceColumnLabel?.trim() || null,
    tauxMin: Number.isFinite(tauxMin) ? tauxMin : base.tauxMin,
    tauxMax: Number.isFinite(tauxMax) ? tauxMax : base.tauxMax,
    tauxCible: Number.isFinite(tauxCible) ? tauxCible : base.tauxCible,
  }
}

export async function GET(request: Request) {
  const auth = await verifyVideoNotesAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('admission_canevas')
    .select('id, nom, description, fichier_source, feuille_nom, colonnes, parametres, created_at, updated_at')
    .order('nom')

  if (error) {
    return NextResponse.json({ error: error.message + tableHint(error) }, { status: 500 })
  }

  const canevas = (data ?? []).map((row) => ({
    ...row,
    parametres: normalizeParametres(row.parametres as Partial<CanevasParametres> | undefined),
  }))

  return NextResponse.json({ canevas: canevas as AdmissionCanevasRow[] })
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
    fichier_source?: string
    feuille_nom?: string
    colonnes?: CanevasColumnWithRule[]
    parametres?: Partial<CanevasParametres>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const nom = body.nom?.trim()
  const colonnes = body.colonnes

  if (!nom) {
    return NextResponse.json({ error: 'Nom du canevas requis.' }, { status: 400 })
  }
  if (!Array.isArray(colonnes) || colonnes.length === 0) {
    return NextResponse.json({ error: 'Au moins une colonne est requise.' }, { status: 400 })
  }

  const normalized = normalizeColonnes(colonnes)
  if (!normalized.length) {
    return NextResponse.json({ error: 'Aucune colonne valide.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('admission_canevas')
    .insert({
      nom,
      description: body.description?.trim() || null,
      fichier_source: body.fichier_source?.trim() || null,
      feuille_nom: body.feuille_nom?.trim() || 'Feuille1',
      colonnes: normalized,
      parametres: normalizeParametres(body.parametres),
    })
    .select('id, nom, description, fichier_source, feuille_nom, colonnes, parametres, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message + tableHint(error) }, { status: 500 })
  }

  return NextResponse.json({ success: true, canevas: data as AdmissionCanevasRow })
}

export async function PATCH(request: Request) {
  const auth = await verifyVideoNotesAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  let body: {
    id?: string
    colonnes?: CanevasColumnWithRule[]
    parametres?: Partial<CanevasParametres>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const id = body.id?.trim()
  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.colonnes) {
    const normalized = normalizeColonnes(body.colonnes)
    if (!normalized.length) {
      return NextResponse.json({ error: 'Aucune colonne valide.' }, { status: 400 })
    }
    update.colonnes = normalized
  }

  if (body.parametres) {
    update.parametres = normalizeParametres(body.parametres)
  }

  const { data, error } = await supabaseAdmin
    .from('admission_canevas')
    .update(update)
    .eq('id', id)
    .select('id, nom, description, fichier_source, feuille_nom, colonnes, parametres, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message + tableHint(error) }, { status: 500 })
  }

  return NextResponse.json({ success: true, canevas: data as AdmissionCanevasRow })
}

export async function DELETE(request: Request) {
  const auth = await verifyVideoNotesAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  const id = new URL(request.url).searchParams.get('id')?.trim()
  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('admission_canevas').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message + tableHint(error) }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
