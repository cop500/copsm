import * as XLSX from 'xlsx'
import {
  NOTES_CONCOURS_EXCEL_COLUMNS,
  calcNote20From70,
  type CandidatNotesRow,
} from './notesConcoursConstants'

function cellStr(v: unknown): string {
  if (v == null || v === '') return ''
  if (typeof v === 'number') return String(v)
  return String(v).trim()
}

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
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const errors: string[] = []
  const rows: Record<string, string | number | null>[] = []

  raw.forEach((r, i) => {
    const line = i + 2
    const idInsc = cellStr(r['id_InscriptionConcoursNational'] ?? r['id_inscription_concours_national'])
    const cef = cellStr(r['CEF'] ?? r['cef'])
    const nom = cellStr(r['Nom'] ?? r['nom'])
    const prenom = cellStr(r['Prénom'] ?? r['Prenom'] ?? r['prenom'])

    if (!cef && !idInsc) return
    if (!cef) {
      errors.push(`Ligne ${line} : CEF manquant.`)
      return
    }
    if (!idInsc) {
      errors.push(`Ligne ${line} : id_InscriptionConcoursNational manquant.`)
      return
    }
    if (!nom || !prenom) {
      errors.push(`Ligne ${line} : Nom ou Prénom manquant.`)
      return
    }

    const note70 = cellNum(r['Note /70'] ?? r['Note / 70'])
    const note20Raw = cellNum(r['Note /20'] ?? r['Note / 20'])
    const note20 =
      note70 != null ? calcNote20From70(note70) : note20Raw

    rows.push({
      dr: cellStr(r['DR']),
      efp: cellStr(r['EFP']),
      niveau_formation: cellStr(r['Niveau Formation']),
      nom,
      prenom,
      id_inscription_concours_national: idInsc,
      cef,
      niveau_scolaire: cellStr(r['Niveau scolaire']),
      moyenne: cellStr(r['Moyenne']),
      branche: cellStr(r['Branche']),
      categorie: cellStr(r['Catégorie'] ?? r['Categorie']),
      filiere: cellStr(r['Filière'] ?? r['Filiere']),
      numero_choix: cellStr(r['Numéro de choix'] ?? r['Numero de choix']),
      classement: cellStr(r['Classement']),
      statut: cellStr(r['Statut']),
      tel_1: cellStr(r['Tel 1']),
      tel_2: cellStr(r['Tel 2']),
      valide: cellStr(r['Validé'] ?? r['Valide']),
      absent: cellStr(r['Absent']),
      note_70: note70,
      note_20: note20,
    })
  })

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
