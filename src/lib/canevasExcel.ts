import * as XLSX from 'xlsx'

export interface CanevasColumn {
  index: number
  label: string
}

export type CanevasDetectionMethod = 'table_header' | 'form_labels'

export interface CanevasParseOptions {
  sheetName?: string
  headerRowIndex?: number
}

export interface CanevasParseResult {
  sheetName: string
  sheetNames: string[]
  columns: CanevasColumn[]
  headerRowIndex: number
  detectionMethod: CanevasDetectionMethod
  titleHint?: string
  errors: string[]
}

const HEADER_KEYWORDS = [
  'cmc',
  'centre',
  'promotion',
  'promo',
  'mois',
  'annee',
  'année',
  'filiere',
  'filière',
  'secteur',
  'insertion',
  'laureat',
  'lauréat',
  'taux',
  'nombre',
  'effectif',
  'total',
  'region',
  'ville',
  'nom',
  'prenom',
  'prénom',
  'date',
  'commentaire',
  'observation',
  'accompagnement',
  'emploi',
  'stage',
  'formation',
  'nb',
  'nbr',
  'code',
  'libelle',
  'libellé',
]

const TITLE_PATTERNS = [
  /^[\d]+[\.\)]\s/,
  /^canevas\b/i,
  /^mod[èe]le\b/i,
  /^template\b/i,
  /^consolidation\b/i,
  /^export\b/i,
  /^rapport\b/i,
]

const MAX_SCAN_ROWS = 50

function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function rowCells(row: unknown[] | undefined): string[] {
  if (!row) return []
  return row.map((cell) => String(cell ?? '').trim()).filter(Boolean)
}

function parseHeaderRow(headerRow: unknown[]): CanevasColumn[] {
  const columns: CanevasColumn[] = []
  const seen = new Set<string>()

  headerRow.forEach((cell, index) => {
    const label = String(cell ?? '').trim()
    if (!label) return
    let unique = label
    let n = 2
    while (seen.has(unique.toLowerCase())) {
      unique = `${label} (${n})`
      n++
    }
    seen.add(unique.toLowerCase())
    columns.push({ index, label: unique })
  })

  return columns
}

function isLikelyTitleRow(cells: string[]): boolean {
  if (!cells.length) return false
  if (cells.length === 1) {
    const text = cells[0]
    if (text.length >= 45) return true
    if (TITLE_PATTERNS.some((p) => p.test(text))) return true
  }
  return false
}

function isLikelyDataRow(cells: string[]): boolean {
  if (cells.length < 2) return false
  const numeric = cells.filter((c) => /^[\d.,\s%€$-]+$/.test(c) && c.length < 24).length
  return numeric >= Math.ceil(cells.length * 0.55)
}

function scoreHeaderRow(cells: string[], rowIndex: number): number {
  if (!cells.length) return -100
  if (isLikelyTitleRow(cells)) return -80
  if (isLikelyDataRow(cells)) return -60

  let score = 0
  if (cells.length >= 3) score += cells.length * 10
  else if (cells.length === 2) score += 12
  else score += 1

  for (const cell of cells) {
    const n = normalizeLabel(cell)
    if (HEADER_KEYWORDS.some((k) => n.includes(k))) score += 18
    if (cell.length > 50) score -= 20
    if (/^[\d.,\s%]+$/.test(cell)) score -= 8
  }

  score -= rowIndex * 0.3
  return score
}

function detectTitleHint(matrix: unknown[][]): string | undefined {
  for (let i = 0; i < Math.min(5, matrix.length); i++) {
    const cells = rowCells(matrix[i])
    if (isLikelyTitleRow(cells)) return cells[0]
  }
  return undefined
}

export function detectBestHeaderRowIndex(matrix: unknown[][]): number {
  const limit = Math.min(MAX_SCAN_ROWS, matrix.length)
  let bestIndex = 0
  let bestScore = -Infinity

  for (let i = 0; i < limit; i++) {
    const score = scoreHeaderRow(rowCells(matrix[i]), i)
    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  }

  return bestIndex
}

function detectFormLabelFields(matrix: unknown[][]): CanevasColumn[] {
  const fields: CanevasColumn[] = []
  const seen = new Set<string>()
  const limit = Math.min(matrix.length, 120)

  for (let r = 0; r < limit; r++) {
    const row = matrix[r] ?? []
    const rawLabel = String(row[0] ?? '').trim().replace(/:$/, '')
    if (!rawLabel || rawLabel.length > 70) continue
    if (isLikelyTitleRow([rawLabel])) continue

    const n = normalizeLabel(rawLabel)
    if (!n || n.length < 2) continue
    if (/^[\d.,\s%]+$/.test(rawLabel)) continue

    const restFilled = row.slice(1, 6).filter((c) => String(c ?? '').trim() !== '').length
    const looksLikeLabel =
      HEADER_KEYWORDS.some((k) => n.includes(k)) ||
      (rawLabel.length <= 45 && restFilled <= 1)

    if (!looksLikeLabel) continue
    if (seen.has(n)) continue
    seen.add(n)
    fields.push({ index: fields.length, label: rawLabel })
  }

  return fields
}

export function parseColumnsFromMatrix(
  matrix: unknown[][],
  headerRowIndex: number
): CanevasColumn[] {
  const headerRow = matrix[headerRowIndex] ?? []
  const columns = parseHeaderRow(headerRow)

  if (columns.length >= 2) return columns

  const prevRow = matrix[headerRowIndex - 1]
  if (prevRow && columns.length === 1) {
    const merged = parseHeaderRow(
      headerRow.map((cell, i) => {
        const cur = String(cell ?? '').trim()
        const prev = String(prevRow[i] ?? '').trim()
        if (cur && prev && cur !== prev) return `${prev} — ${cur}`
        return cur || prev
      })
    )
    if (merged.length > columns.length) return merged
  }

  return columns
}

export function analyzeCanevasMatrix(matrix: unknown[][]): {
  columns: CanevasColumn[]
  headerRowIndex: number
  detectionMethod: CanevasDetectionMethod
  titleHint?: string
} {
  if (!matrix.length) {
    return { columns: [], headerRowIndex: 0, detectionMethod: 'table_header' }
  }

  const titleHint = detectTitleHint(matrix)
  const headerRowIndex = detectBestHeaderRowIndex(matrix)
  const tableColumns = parseColumnsFromMatrix(matrix, headerRowIndex)

  if (tableColumns.length >= 2) {
    return { columns: tableColumns, headerRowIndex, detectionMethod: 'table_header', titleHint }
  }

  const formColumns = detectFormLabelFields(matrix)
  if (formColumns.length > tableColumns.length) {
    return { columns: formColumns, headerRowIndex: -1, detectionMethod: 'form_labels', titleHint }
  }

  return { columns: tableColumns, headerRowIndex, detectionMethod: 'table_header', titleHint }
}

function pickDefaultSheet(wb: XLSX.WorkBook): string {
  if (!wb.SheetNames.length) return ''
  if (wb.SheetNames.length === 1) return wb.SheetNames[0]

  let bestName = wb.SheetNames[0]
  let bestCount = 0

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name]
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
    const { columns } = analyzeCanevasMatrix(matrix)
    if (columns.length > bestCount) {
      bestCount = columns.length
      bestName = name
    }
  }

  return bestName
}

function readSheetMatrix(wb: XLSX.WorkBook, sheetName: string): unknown[][] {
  const sheet = wb.Sheets[sheetName]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
}

/** Analyse un fichier Excel et détecte automatiquement les champs à remplir. */
export function parseCanevasHeaders(
  buffer: ArrayBuffer,
  options: CanevasParseOptions = {}
): CanevasParseResult {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetNames = wb.SheetNames
  if (!sheetNames.length) {
    return {
      sheetName: '',
      sheetNames: [],
      columns: [],
      headerRowIndex: 0,
      detectionMethod: 'table_header',
      errors: ['Fichier Excel vide.'],
    }
  }

  const sheetName = options.sheetName && sheetNames.includes(options.sheetName)
    ? options.sheetName
    : pickDefaultSheet(wb)

  const matrix = readSheetMatrix(wb, sheetName)
  if (!matrix.length) {
    return {
      sheetName,
      sheetNames,
      columns: [],
      headerRowIndex: 0,
      detectionMethod: 'table_header',
      errors: ['Aucune ligne dans l\'onglet sélectionné.'],
    }
  }

  const headerRowIndex =
    options.headerRowIndex != null && options.headerRowIndex >= 0
      ? options.headerRowIndex
      : detectBestHeaderRowIndex(matrix)

  const analyzed =
    options.headerRowIndex != null && options.headerRowIndex >= 0
      ? {
          columns: parseColumnsFromMatrix(matrix, headerRowIndex),
          headerRowIndex,
          detectionMethod: 'table_header' as const,
          titleHint: detectTitleHint(matrix),
        }
      : analyzeCanevasMatrix(matrix)

  if (!analyzed.columns.length) {
    return {
      sheetName,
      sheetNames,
      columns: [],
      headerRowIndex: analyzed.headerRowIndex,
      detectionMethod: analyzed.detectionMethod,
      titleHint: analyzed.titleHint,
      errors: [
        'Aucun champ détecté — le fichier contient peut-être uniquement un titre ou un tableau sans en-têtes lisibles.',
      ],
    }
  }

  return {
    sheetName,
    sheetNames,
    columns: analyzed.columns,
    headerRowIndex: analyzed.headerRowIndex,
    detectionMethod: analyzed.detectionMethod,
    titleHint: analyzed.titleHint,
    errors: [],
  }
}

/** Lit en-têtes + lignes de données d'un fichier source Excel (détection auto des en-têtes). */
export function parseSourceExcel(
  buffer: ArrayBuffer,
  options: CanevasParseOptions = {}
): {
  sheetName: string
  sheetNames: string[]
  columns: CanevasColumn[]
  rows: unknown[][]
  headerRowIndex: number
  errors: string[]
} {
  const parsed = parseCanevasHeaders(buffer, options)
  if (!parsed.columns.length) {
    return {
      sheetName: parsed.sheetName,
      sheetNames: parsed.sheetNames,
      columns: [],
      rows: [],
      headerRowIndex: parsed.headerRowIndex,
      errors: parsed.errors,
    }
  }

  const wb = XLSX.read(buffer, { type: 'array' })
  const matrix = readSheetMatrix(wb, parsed.sheetName)
  const dataStart =
    parsed.detectionMethod === 'form_labels' || parsed.headerRowIndex < 0
      ? 0
      : parsed.headerRowIndex + 1

  const rows = matrix
    .slice(dataStart)
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))

  return {
    sheetName: parsed.sheetName,
    sheetNames: parsed.sheetNames,
    columns: parsed.columns,
    rows,
    headerRowIndex: parsed.headerRowIndex,
    errors: [],
  }
}

/** Propose une correspondance automatique canevas → source (par libellé). */
export function suggestColumnMapping(
  canevasColumns: CanevasColumn[],
  sourceColumns: CanevasColumn[]
): Record<number, number | null> {
  const mapping: Record<number, number | null> = {}
  const usedSource = new Set<number>()

  for (const cc of canevasColumns) {
    const cn = normalizeLabel(cc.label)
    let match: number | null = null

    for (const sc of sourceColumns) {
      if (usedSource.has(sc.index)) continue
      const sn = normalizeLabel(sc.label)
      if (!sn) continue
      if (cn === sn || (cn.length >= 4 && sn.includes(cn)) || (sn.length >= 4 && cn.includes(sn))) {
        match = sc.index
        break
      }
    }

    mapping[cc.index] = match
    if (match != null) usedSource.add(match)
  }

  return mapping
}

export function buildFilledCanevasWorkbook(
  canevasColumns: CanevasColumn[],
  sourceRows: unknown[][],
  mapping: Record<number, number | null>,
  sheetName = 'Export'
): XLSX.WorkBook {
  const ordered = [...canevasColumns].sort((a, b) => a.index - b.index)
  const headerRow = ordered.map((c) => c.label)
  const dataRows = sourceRows.map((row) =>
    ordered.map((col) => {
      const srcIdx = mapping[col.index]
      if (srcIdx == null) return ''
      const val = row[srcIdx]
      return val == null ? '' : val
    })
  )

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  return wb
}

export function downloadFilledCanevas(
  canevasColumns: CanevasColumn[],
  sourceRows: unknown[][],
  mapping: Record<number, number | null>,
  fileName: string,
  sheetName = 'Export'
): void {
  const wb = buildFilledCanevasWorkbook(canevasColumns, sourceRows, mapping, sheetName)
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`)
}
