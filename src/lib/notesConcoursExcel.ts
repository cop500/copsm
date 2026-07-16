import * as XLSX from 'xlsx'
import {
  NOTES_CONCOURS_EXCEL_COLUMNS,
  calcNote20From70,
  type CandidatNotesRow,
} from './notesConcoursConstants'
import {
  buildExcelColumnIndex,
  cellAt,
} from './notesConcoursColumnMap'

function cellNum(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function parseNotesConcoursWorkbook(buffer: ArrayBuffer): {
  rows: Record<string, string | number | null>[]
  errors: string[]
} {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return { rows: [], errors: ['Fichier Excel vide.'] }

  const sheet = wb.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })

  if (matrix.length < 2) {
    return { rows: [], errors: ['Aucune ligne de candidat trouvée dans le fichier.'] }
  }

  const headerRow = matrix[0].map((h) => String(h ?? '').trim())
  const colIndex = buildExcelColumnIndex(headerRow)
  const errors: string[] = []
  const rows: Record<string, string | number | null>[] = []

  const get = (row: unknown[], field: keyof typeof colIndex) =>
    cellAt(row, colIndex[field])

  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i]
    if (!row || row.every((c) => c == null || c === '')) continue

    const line = i + 1
    const idInsc = get(row, 'id_inscription_concours_national')
    const cef = get(row, 'cef')
    const nom = get(row, 'nom')
    const prenom = get(row, 'prenom')

    if (!cef && !idInsc) continue
    if (!cef) {
      errors.push(`Ligne ${line} : CEF manquant.`)
      continue
    }
    if (!idInsc) {
      errors.push(`Ligne ${line} : N° inscription manquant.`)
      continue
    }
    if (!nom || !prenom) {
      errors.push(`Ligne ${line} : Nom ou Prénom manquant.`)
      continue
    }

    const note70Col = colIndex.note_70
    const note70 = note70Col != null ? cellNum(row[note70Col]) : null
    const note20Col = colIndex.note_20
    const note20Raw = note20Col != null ? cellNum(row[note20Col]) : null
    const note20 = note70 != null ? calcNote20From70(note70) : note20Raw

    rows.push({
      dr: get(row, 'dr'),
      efp: get(row, 'efp'),
      niveau_formation: get(row, 'niveau_formation'),
      nom,
      prenom,
      id_inscription_concours_national: idInsc,
      cef,
      niveau_scolaire: get(row, 'niveau_scolaire'),
      moyenne: get(row, 'moyenne'),
      branche: get(row, 'branche'),
      categorie: get(row, 'categorie'),
      filiere: get(row, 'filiere'),
      numero_choix: get(row, 'numero_choix'),
      classement: get(row, 'classement'),
      statut: get(row, 'statut'),
      tel_1: get(row, 'tel_1'),
      tel_2: get(row, 'tel_2'),
      valide: get(row, 'valide'),
      absent: get(row, 'absent'),
      note_70: note70,
      note_20: note20,
    })
  }

  if (!rows.length && !errors.length) {
    errors.push('Aucune ligne de candidat trouvée dans le fichier.')
  }

  return { rows, errors }
}

export function candidatToExcelRow(c: CandidatNotesRow): Record<string, string | number> {
  return {
    DR: c.dr ?? '',
    EFP: c.efp ?? '',
    'Niveau Formation': c.niveau_formation ?? '',
    Nom: c.nom,
    Prénom: c.prenom,
    id_InscriptionConcoursNational: c.id_inscription_concours_national,
    CEF: c.cef,
    'Niveau scolaire': c.niveau_scolaire ?? '',
    Moyenne: c.moyenne ?? '',
    Branche: c.branche ?? '',
    Catégorie: c.categorie ?? '',
    Filière: c.filiere ?? '',
    'Numéro de choix': c.numero_choix ?? '',
    Classement: c.classement ?? '',
    Statut: c.statut ?? '',
    'Tel 1': c.tel_1 ?? '',
    'Tel 2': c.tel_2 ?? '',
    Validé: c.valide ?? '',
    Absent: c.absent ?? '',
    'Note /70': c.note_70 ?? '',
    'Note /20': c.note_20 ?? '',
  }
}

export function buildNotesConcoursExportBuffer(candidats: CandidatNotesRow[]): Buffer {
  const data = candidats.map(candidatToExcelRow)
  const ws = XLSX.utils.json_to_sheet(data, { header: [...NOTES_CONCOURS_EXCEL_COLUMNS] })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Notes')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
