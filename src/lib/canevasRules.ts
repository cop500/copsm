import * as XLSX from 'xlsx'
import type { CanevasColumn } from './canevasExcel'

export type CanevasFillMode =
  | 'manual'
  | 'source_column'
  | 'source_mois'
  | 'source_annee'
  | 'file_promotion'
  | 'count_by_filiere'
  | 'insertions_proposed'
  | 'taux_insertion'

export interface CanevasColumnRule {
  mode: CanevasFillMode
  manualValue?: string
  sourceColumnIndex?: number | null
  /** Libellé stable pour fichiers sources multiples */
  sourceColumnLabel?: string | null
  moisSourceColumnLabel?: string | null
  anneeSourceColumnLabel?: string | null
}

export interface CanevasColumnWithRule extends CanevasColumn {
  rule?: CanevasColumnRule
}

export interface CanevasParametres {
  groupSourceColumnIndex: number | null
  groupSourceColumnLabel: string | null
  tauxMin: number
  tauxMax: number
  tauxCible: number
}

export const DEFAULT_CANEVAS_PARAMETRES: CanevasParametres = {
  groupSourceColumnIndex: null,
  groupSourceColumnLabel: null,
  tauxMin: 80,
  tauxMax: 90,
  tauxCible: 85,
}

export interface CanevasSourceFile {
  id: string
  fileName: string
  sheetName: string
  columns: CanevasColumn[]
  rows: unknown[][]
}

const FILL_MODE_LABELS: Record<CanevasFillMode, string> = {
  manual: 'Saisie manuelle',
  source_column: 'Colonne source',
  source_mois: 'Mois (colonne source)',
  source_annee: 'Année (colonne source)',
  file_promotion: 'Promotion (mois + année fichier)',
  count_by_filiere: 'Nb lauréats (compte par filière)',
  insertions_proposed: 'Nb insertions (proposé 80–90 %)',
  taux_insertion: 'Taux d\'insertion (calcul auto)',
}

export function getFillModeLabel(mode: CanevasFillMode): string {
  return FILL_MODE_LABELS[mode]
}

export const FILL_MODES: CanevasFillMode[] = [
  'manual',
  'source_column',
  'source_mois',
  'source_annee',
  'file_promotion',
  'count_by_filiere',
  'insertions_proposed',
  'taux_insertion',
]

function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function findColumnByLabel(columns: CanevasColumn[], label: string | null | undefined): CanevasColumn | undefined {
  if (!label) return undefined
  const n = normalizeLabel(label)
  return columns.find((c) => normalizeLabel(c.label) === n)
}

function findColumnByAliases(columns: CanevasColumn[], aliases: string[]): CanevasColumn | undefined {
  const normalized = aliases.map(normalizeLabel)
  return columns.find((c) => normalized.includes(normalizeLabel(c.label)))
}

export function resolveSourceColumnIndex(
  sourceColumns: CanevasColumn[],
  rule: Pick<CanevasColumnRule, 'sourceColumnIndex' | 'sourceColumnLabel'>
): number | null {
  const byLabel = findColumnByLabel(sourceColumns, rule.sourceColumnLabel)
  if (byLabel) return byLabel.index

  if (rule.sourceColumnIndex != null) {
    const byIndex = sourceColumns.find((c) => c.index === rule.sourceColumnIndex)
    if (byIndex) return byIndex.index
  }
  return null
}

function resolveGroupColumnIndex(
  sourceColumns: CanevasColumn[],
  parametres: CanevasParametres
): number | null {
  const byLabel = findColumnByLabel(sourceColumns, parametres.groupSourceColumnLabel)
  if (byLabel) return byLabel.index
  if (parametres.groupSourceColumnIndex != null) {
    return resolveSourceColumnIndex(sourceColumns, {
      sourceColumnIndex: parametres.groupSourceColumnIndex,
      sourceColumnLabel: parametres.groupSourceColumnLabel,
    })
  }
  return null
}

function ruleWithSourceLabel(
  rule: CanevasColumnRule,
  sourceColumns: CanevasColumn[],
  colIndex: number | null
): CanevasColumnRule {
  if (colIndex == null) return rule
  const col = sourceColumns.find((c) => c.index === colIndex)
  return {
    ...rule,
    sourceColumnIndex: colIndex,
    sourceColumnLabel: col?.label ?? rule.sourceColumnLabel ?? null,
  }
}

/** Devine le mode de remplissage à partir du libellé de colonne canevas. */
export function suggestRuleForColumn(label: string): CanevasColumnRule {
  const n = normalizeLabel(label)

  if (n === 'cmc' || n.includes('centre')) {
    return { mode: 'manual', manualValue: '' }
  }
  if (n === 'mois' || n.endsWith('mois')) {
    return { mode: 'source_mois', sourceColumnLabel: 'MOIS' }
  }
  if (n === 'annee' || n === 'année' || n.includes('annee')) {
    return { mode: 'source_annee', sourceColumnLabel: 'ANNEE' }
  }
  if (n.includes('promotion') || n.includes('promo')) {
    return {
      mode: 'file_promotion',
      moisSourceColumnLabel: 'MOIS',
      anneeSourceColumnLabel: 'ANNEE',
    }
  }
  if (n.includes('taux') && n.includes('insertion')) {
    return { mode: 'taux_insertion' }
  }
  if (n.includes('insertion') && (n.includes('nb') || n.includes('nombre'))) {
    return { mode: 'insertions_proposed' }
  }
  if (n.includes('laureat') || n.includes('lauréat')) {
    return { mode: 'count_by_filiere' }
  }
  if (n.includes('filiere') || n.includes('filière') || n.includes('secteur')) {
    return { mode: 'source_column', sourceColumnIndex: null }
  }

  return { mode: 'source_column', sourceColumnIndex: null }
}

export function suggestRulesForCanevas(
  columns: CanevasColumn[],
  sourceColumns: CanevasColumn[]
): Record<number, CanevasColumnRule> {
  const rules: Record<number, CanevasColumnRule> = {}

  for (const col of columns) {
    let rule = suggestRuleForColumn(col.label)

    if (rule.mode === 'source_column' && sourceColumns.length) {
      const cn = normalizeLabel(col.label)
      for (const sc of sourceColumns) {
        const sn = normalizeLabel(sc.label)
        if (cn === sn || cn.includes(sn) || sn.includes(cn)) {
          rule = ruleWithSourceLabel(rule, sourceColumns, sc.index)
          break
        }
      }
    }

    if (rule.mode === 'source_mois') {
      const moisCol = findColumnByAliases(sourceColumns, ['mois', 'month'])
      if (moisCol) {
        rule = { ...rule, moisSourceColumnLabel: moisCol.label, sourceColumnLabel: moisCol.label }
      }
    }

    if (rule.mode === 'source_annee') {
      const anneeCol = findColumnByAliases(sourceColumns, ['annee', 'année', 'year', 'anne'])
      if (anneeCol) {
        rule = { ...rule, anneeSourceColumnLabel: anneeCol.label, sourceColumnLabel: anneeCol.label }
      }
    }

    if (rule.mode === 'file_promotion') {
      const moisCol = findColumnByAliases(sourceColumns, ['mois', 'month'])
      const anneeCol = findColumnByAliases(sourceColumns, ['annee', 'année', 'year', 'anne'])
      rule = {
        ...rule,
        moisSourceColumnLabel: moisCol?.label ?? rule.moisSourceColumnLabel ?? 'MOIS',
        anneeSourceColumnLabel: anneeCol?.label ?? rule.anneeSourceColumnLabel ?? 'ANNEE',
      }
    }

    rules[col.index] = rule
  }

  return rules
}

/** Extrait une promotion / date depuis le nom du fichier source. */
export function extractPromotionFromFileName(fileName: string): string {
  const base = fileName.replace(/\.(xlsx|xls|csv)$/i, '').trim()

  const yearRange = base.match(/(20\d{2})\s*[-_/]\s*(20\d{2})/)
  if (yearRange) return `${yearRange[1]}-${yearRange[2]}`

  const promoYear = base.match(/promo[\s_-]*(20\d{2})/i)
  if (promoYear) return promoYear[1]

  const years = base.match(/20\d{2}/g)
  if (years?.length) return years[years.length - 1]

  const dmy = base.match(/(\d{2})[-_/](\d{2})[-_/](20\d{2})/)
  if (dmy) return `${dmy[3]}-${dmy[2]}`

  return base
}

export function formatMoisAnnee(mois: string, annee: string): string {
  const m = mois.trim()
  const a = annee.trim()
  if (m && a) {
    const monthNum = m.replace(/\D/g, '')
    const monthFormatted = monthNum ? monthNum.padStart(2, '0') : m
    return `${monthFormatted}/${a}`
  }
  if (a) return a
  if (m) return m
  return ''
}

function resolveMoisIndex(sourceColumns: CanevasColumn[], rule: CanevasColumnRule): number | null {
  const col = findColumnByLabel(sourceColumns, rule.moisSourceColumnLabel)
    ?? findColumnByAliases(sourceColumns, ['mois', 'month'])
  return col?.index ?? null
}

function resolveAnneeIndex(sourceColumns: CanevasColumn[], rule: CanevasColumnRule): number | null {
  const col = findColumnByLabel(sourceColumns, rule.anneeSourceColumnLabel)
    ?? findColumnByAliases(sourceColumns, ['annee', 'année', 'year', 'anne'])
  return col?.index ?? null
}

function buildPromotionValue(
  groupRows: unknown[][],
  sourceColumns: CanevasColumn[],
  rule: CanevasColumnRule,
  fileName: string
): string {
  const moisIdx = resolveMoisIndex(sourceColumns, rule)
  const anneeIdx = resolveAnneeIndex(sourceColumns, rule)
  const mois = firstNonEmptyInGroup(groupRows, moisIdx)
  const annee = firstNonEmptyInGroup(groupRows, anneeIdx)
  const formatted = formatMoisAnnee(mois, annee)
  if (formatted) return formatted
  return extractPromotionFromFileName(fileName)
}

export function proposeInsertions(
  laureats: number,
  parametres: CanevasParametres
): number {
  if (laureats <= 0) return 0

  const min = Math.min(parametres.tauxMin, parametres.tauxMax)
  const max = Math.max(parametres.tauxMin, parametres.tauxMax)
  const cible = Math.min(max, Math.max(min, parametres.tauxCible))

  let insertions = Math.round((laureats * cible) / 100)
  insertions = Math.min(laureats, Math.max(0, insertions))

  const minIns = Math.ceil((laureats * min) / 100)
  const maxIns = Math.floor((laureats * max) / 100)

  if (insertions < minIns) insertions = minIns
  if (insertions > maxIns) insertions = maxIns

  return insertions
}

function groupRowsByColumn(
  rows: unknown[][],
  colIdx: number | null | undefined
): Map<string, unknown[][]> {
  const groups = new Map<string, unknown[][]>()
  if (colIdx == null) {
    groups.set('__all__', rows)
    return groups
  }

  for (const row of rows) {
    const key = String(row[colIdx] ?? '').trim() || '(vide)'
    const list = groups.get(key) ?? []
    list.push(row)
    groups.set(key, list)
  }
  return groups
}

function firstNonEmptyInGroup(rows: unknown[][], colIdx: number | null | undefined): string {
  if (colIdx == null) return ''
  for (const row of rows) {
    const v = String(row[colIdx] ?? '').trim()
    if (v) return v
  }
  return ''
}

function findColumnIndexByMode(
  columns: CanevasColumnWithRule[],
  rules: Record<number, CanevasColumnRule>,
  mode: CanevasFillMode
): number | null {
  for (const col of columns) {
    if (rules[col.index]?.mode === mode) return col.index
  }
  return null
}

export interface GenerateCanevasInput {
  columns: CanevasColumnWithRule[]
  rules: Record<number, CanevasColumnRule>
  parametres: CanevasParametres
  sourceRows: unknown[][]
  sourceColumns: CanevasColumn[]
  sourceFileName: string
  manualOverrides?: Record<number, string>
}

export function generateCanevasRows(input: GenerateCanevasInput): unknown[][] {
  const {
    columns,
    rules,
    parametres,
    sourceRows,
    sourceColumns,
    sourceFileName,
    manualOverrides = {},
  } = input

  const ordered = [...columns].sort((a, b) => a.index - b.index)
  const groupIdx = resolveGroupColumnIndex(sourceColumns, parametres)

  const usesAggregation = ordered.some((c) => {
    const mode = rules[c.index]?.mode
    return mode === 'count_by_filiere' || mode === 'insertions_proposed' || mode === 'taux_insertion'
  })

  const groups = usesAggregation
    ? groupRowsByColumn(sourceRows, groupIdx)
    : new Map<string, unknown[][]>([['__row__', sourceRows]])

  const laureatsColIdx = findColumnIndexByMode(columns, rules, 'count_by_filiere')
  const insertionsColIdx = findColumnIndexByMode(columns, rules, 'insertions_proposed')
  const tauxColIdx = findColumnIndexByMode(columns, rules, 'taux_insertion')

  const output: unknown[][] = []

  if (usesAggregation) {
    for (const [filiereKey, groupRows] of groups) {
      const rowValues: Record<number, unknown> = {}
      const laureats = groupRows.length

      for (const col of ordered) {
        const rule = rules[col.index] ?? { mode: 'source_column' as const }

        switch (rule.mode) {
          case 'manual':
            rowValues[col.index] = manualOverrides[col.index] ?? rule.manualValue ?? ''
            break
          case 'file_promotion':
            rowValues[col.index] = buildPromotionValue(groupRows, sourceColumns, rule, sourceFileName)
            break
          case 'source_mois': {
            const idx = resolveMoisIndex(sourceColumns, rule)
              ?? resolveSourceColumnIndex(sourceColumns, rule)
            rowValues[col.index] = firstNonEmptyInGroup(groupRows, idx)
            break
          }
          case 'source_annee': {
            const idx = resolveAnneeIndex(sourceColumns, rule)
              ?? resolveSourceColumnIndex(sourceColumns, rule)
            rowValues[col.index] = firstNonEmptyInGroup(groupRows, idx)
            break
          }
          case 'source_column': {
            const srcIdx = resolveSourceColumnIndex(sourceColumns, rule)
            if (normalizeLabel(col.label).includes('filiere')) {
              rowValues[col.index] = filiereKey === '(vide)' ? '' : filiereKey
            } else {
              rowValues[col.index] = firstNonEmptyInGroup(groupRows, srcIdx)
            }
            break
          }
          case 'count_by_filiere':
            rowValues[col.index] = laureats
            break
          case 'insertions_proposed':
            rowValues[col.index] = proposeInsertions(laureats, parametres)
            break
          case 'taux_insertion':
            break
          default:
            rowValues[col.index] = ''
        }
      }

      if (insertionsColIdx != null && laureatsColIdx != null && tauxColIdx != null) {
        const ins = Number(rowValues[insertionsColIdx] ?? 0)
        const laur = Number(rowValues[laureatsColIdx] ?? 0)
        rowValues[tauxColIdx] = laur > 0 ? Math.round((ins / laur) * 1000) / 10 : 0
      }

      output.push(ordered.map((c) => rowValues[c.index] ?? ''))
    }
  } else {
    for (const srcRow of sourceRows) {
      const rowValues: Record<number, unknown> = {}

      for (const col of ordered) {
        const rule = rules[col.index] ?? { mode: 'source_column' as const }

        switch (rule.mode) {
          case 'manual':
            rowValues[col.index] = manualOverrides[col.index] ?? rule.manualValue ?? ''
            break
          case 'file_promotion':
            rowValues[col.index] = buildPromotionValue([srcRow], sourceColumns, rule, sourceFileName)
            break
          case 'source_mois': {
            const idx = resolveMoisIndex(sourceColumns, rule)
              ?? resolveSourceColumnIndex(sourceColumns, rule)
            rowValues[col.index] = idx == null ? '' : srcRow[idx] ?? ''
            break
          }
          case 'source_annee': {
            const idx = resolveAnneeIndex(sourceColumns, rule)
              ?? resolveSourceColumnIndex(sourceColumns, rule)
            rowValues[col.index] = idx == null ? '' : srcRow[idx] ?? ''
            break
          }
          case 'source_column': {
            const srcIdx = resolveSourceColumnIndex(sourceColumns, rule)
            rowValues[col.index] = srcIdx == null ? '' : srcRow[srcIdx] ?? ''
            break
          }
          default:
            rowValues[col.index] = ''
        }
      }

      output.push(ordered.map((c) => rowValues[c.index] ?? ''))
    }
  }

  return output
}

export function generateCanevasRowsFromSources(
  sources: CanevasSourceFile[],
  input: Omit<GenerateCanevasInput, 'sourceRows' | 'sourceColumns' | 'sourceFileName'>
): unknown[][] {
  const all: unknown[][] = []
  for (const src of sources) {
    const rows = generateCanevasRows({
      ...input,
      sourceRows: src.rows,
      sourceColumns: src.columns,
      sourceFileName: src.fileName,
    })
    all.push(...rows)
  }
  return all
}

export function buildCanevasWorkbookFromRules(
  columns: CanevasColumnWithRule[],
  dataRows: unknown[][],
  sheetName = 'Export'
): XLSX.WorkBook {
  const ordered = [...columns].sort((a, b) => a.index - b.index)
  const headerRow = ordered.map((c) => c.label)
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  return wb
}

export function downloadCanevasWithRules(
  columns: CanevasColumnWithRule[],
  dataRows: unknown[][],
  fileName: string,
  sheetName = 'Export'
): void {
  const wb = buildCanevasWorkbookFromRules(columns, dataRows, sheetName)
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`)
}

export function needsAggregation(rules: Record<number, CanevasColumnRule>): boolean {
  return Object.values(rules).some(
    (r) =>
      r.mode === 'count_by_filiere' ||
      r.mode === 'insertions_proposed' ||
      r.mode === 'taux_insertion'
  )
}

export function previewPromotionFromSource(
  sourceColumns: CanevasColumn[],
  sourceRows: unknown[][],
  rule: CanevasColumnRule,
  fileName: string
): string {
  if (!sourceRows.length) return extractPromotionFromFileName(fileName)
  return buildPromotionValue(sourceRows.slice(0, 5), sourceColumns, rule, fileName)
}
