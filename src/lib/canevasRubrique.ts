import type { CanevasColumn } from './canevasExcel'
import type {
  CanevasColumnRule,
  CanevasFillMode,
  CanevasParametres,
  CanevasSourceFile,
} from './canevasRules'
import {
  DEFAULT_CANEVAS_PARAMETRES,
  generateCanevasRowsFromSources,
  suggestRuleForColumn,
} from './canevasRules'

export type CanevasSourceCategory = 'manual' | 'excel' | 'calcul' | 'app'

export interface CanevasRubriqueFieldRule {
  /** Clé normalisée du libellé (cmc, promotion, filiere…) */
  fieldKey: string
  /** Libellé d'origine pour affichage */
  fieldLabel: string
  rule: CanevasColumnRule
}

export interface CanevasRubrique {
  id: string
  nom: string
  description: string | null
  regles: CanevasRubriqueFieldRule[]
  parametres: CanevasParametres
  created_at?: string
  updated_at?: string
}

export function normalizeFieldKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const EXCEL_MODES: CanevasFillMode[] = [
  'source_column',
  'source_mois',
  'source_annee',
  'file_promotion',
]

const CALCUL_MODES: CanevasFillMode[] = [
  'count_by_filiere',
  'insertions_proposed',
  'taux_insertion',
]

export function getSourceCategory(mode: CanevasFillMode): CanevasSourceCategory {
  if (mode === 'manual') return 'manual'
  if (EXCEL_MODES.includes(mode)) return 'excel'
  if (CALCUL_MODES.includes(mode)) return 'calcul'
  return 'app'
}

export const SOURCE_CATEGORY_LABELS: Record<CanevasSourceCategory, string> = {
  manual: 'Saisie manuelle',
  excel: 'Fichier Excel',
  calcul: 'Calcul automatique',
  app: 'Données COP',
}

export const MODES_BY_CATEGORY: Record<CanevasSourceCategory, CanevasFillMode[]> = {
  manual: ['manual'],
  excel: ['source_column', 'file_promotion', 'source_mois', 'source_annee'],
  calcul: ['count_by_filiere', 'insertions_proposed', 'taux_insertion'],
  app: [],
}

export function defaultModeForCategory(category: CanevasSourceCategory): CanevasFillMode {
  return MODES_BY_CATEGORY[category][0] ?? 'manual'
}

export function buildRubriqueFromState(
  colonnes: CanevasColumn[],
  rules: Record<number, CanevasColumnRule>,
  parametres: CanevasParametres,
  nom: string,
  description?: string
): Omit<CanevasRubrique, 'id' | 'created_at' | 'updated_at'> {
  return {
    nom,
    description: description?.trim() || null,
    regles: colonnes.map((col) => ({
      fieldKey: normalizeFieldKey(col.label),
      fieldLabel: col.label,
      rule: rules[col.index] ?? suggestRuleForColumn(col.label),
    })),
    parametres,
  }
}

function findRubriqueRule(
  rubrique: CanevasRubrique,
  colLabel: string
): CanevasRubriqueFieldRule | undefined {
  const key = normalizeFieldKey(colLabel)
  const exact = rubrique.regles.find((r) => r.fieldKey === key)
  if (exact) return exact

  return rubrique.regles.find((r) => {
    const rk = r.fieldKey
    return key.includes(rk) || rk.includes(key)
  })
}

export function applyRubriqueToCanevas(
  colonnes: CanevasColumn[],
  rubrique: CanevasRubrique
): { rules: Record<number, CanevasColumnRule>; parametres: CanevasParametres } {
  const rules: Record<number, CanevasColumnRule> = {}

  for (const col of colonnes) {
    const matched = findRubriqueRule(rubrique, col.label)
    rules[col.index] = matched?.rule ?? suggestRuleForColumn(col.label)
  }

  return {
    rules,
    parametres: { ...DEFAULT_CANEVAS_PARAMETRES, ...rubrique.parametres },
  }
}

export function suggestRubriqueForCanevas(
  colonnes: CanevasColumn[],
  rules: Record<number, CanevasColumnRule>,
  parametres: CanevasParametres
): Omit<CanevasRubrique, 'id' | 'created_at' | 'updated_at' | 'nom' | 'description'> {
  return {
    regles: colonnes.map((col) => ({
      fieldKey: normalizeFieldKey(col.label),
      fieldLabel: col.label,
      rule: rules[col.index] ?? suggestRuleForColumn(col.label),
    })),
    parametres,
  }
}

/** Aperçu d'une valeur pour un champ (1ère ligne / 1er groupe). */
export function previewFieldValue(
  colIndex: number,
  colonnes: CanevasColumn[],
  rules: Record<number, CanevasColumnRule>,
  parametres: CanevasParametres,
  sourceFiles: CanevasSourceFile[]
): { value: string; status: 'ok' | 'empty' | 'pending' } {
  const rule = rules[colIndex]
  if (!rule) return { value: '—', status: 'pending' }

  if (rule.mode === 'manual') {
    const v = rule.manualValue?.trim()
    return v ? { value: v, status: 'ok' } : { value: 'À saisir', status: 'empty' }
  }

  if (getSourceCategory(rule.mode) === 'calcul') {
    if (!sourceFiles.length) return { value: 'Calcul auto', status: 'pending' }
  }

  if (getSourceCategory(rule.mode) === 'excel' && !sourceFiles.length) {
    return { value: 'Importer un fichier Excel', status: 'pending' }
  }

  if (!sourceFiles.length) {
    return { value: '—', status: 'pending' }
  }

  const rows = generateCanevasRowsFromSources(sourceFiles, {
    columns: colonnes.map((c) => ({ ...c, rule: rules[c.index] })),
    rules,
    parametres,
  })

  if (!rows.length) return { value: '—', status: 'empty' }

  const ordered = [...colonnes].sort((a, b) => a.index - b.index)
  const pos = ordered.findIndex((c) => c.index === colIndex)
  if (pos < 0) return { value: '—', status: 'empty' }

  const val = rows[0][pos]
  const str = val == null ? '' : String(val).trim()
  return str ? { value: str, status: 'ok' } : { value: 'Vide', status: 'empty' }
}

export function countConfiguredFields(
  colonnes: CanevasColumn[],
  rules: Record<number, CanevasColumnRule>,
  parametres: CanevasParametres,
  sourceFiles: CanevasSourceFile[]
): { ok: number; total: number } {
  let ok = 0
  for (const col of colonnes) {
    const p = previewFieldValue(col.index, colonnes, rules, parametres, sourceFiles)
    if (p.status === 'ok') ok++
  }
  return { ok, total: colonnes.length }
}
