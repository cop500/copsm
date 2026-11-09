import * as XLSX from 'xlsx'

export const AMBASSADEUR_EXCEL_HEADERS = [
  'Nom',
  'Prénom',
  'Date de naissance',
  'Lieu de naissance',
  'Sexe',
  'Situation familiale',
  'Nationalité',
  'Adresse',
  'Téléphone',
  'Email',
  'Province',
  'Niveau scolaire',
  'Année scolaire',
  'Type de formation',
  'Filière',
  'Groupe',
  'Intern',
] as const

function cell(row: Record<string, unknown>, names: string[]): string {
  const keys = Object.keys(row)
  for (const name of names) {
    if (row[name] != null && String(row[name]).trim() !== '') return String(row[name]).trim()
    const found = keys.find((k) => k.trim().toLowerCase() === name.toLowerCase())
    if (found && row[found] != null && String(row[found]).trim() !== '') {
      return String(row[found]).trim()
    }
  }
  return ''
}

export function parseInternat(value: unknown): boolean {
  const v = String(value ?? '')
    .trim()
    .toLowerCase()
  return ['oui', 'o', 'yes', 'y', '1', 'x', 'vrai', 'true', 'intern', 'internat'].includes(v)
}

export function parseExcelDate(value: unknown): string | null {
  if (value == null || value === '') return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const utc = Date.UTC(1899, 11, 30) + Math.round(value) * 86400000
    return new Date(utc).toISOString().slice(0, 10)
  }
  const s = String(value).trim()
  const fr = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (fr) return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return null
}

export type LigneAmbassadeurImport = {
  nom: string
  prenom: string
  email: string | null
  telephone: string | null
  date_naissance: string | null
  lieu_naissance: string | null
  sexe: string | null
  situation_familiale: string | null
  nationalite: string | null
  adresse: string | null
  province: string | null
  niveau_scolaire: string | null
  annee_scolaire: string | null
  type_formation: string | null
  groupe: string | null
  internat: boolean
  poleNom: string
  filiereNom: string
}

export function lireLigneAmbassadeurExcel(row: Record<string, unknown>): LigneAmbassadeurImport {
  const internRaw = cell(row, ['Intern', 'Internat', 'Résident internat', 'Resident internat'])
  return {
    nom: cell(row, ['Nom']),
    prenom: cell(row, ['Prénom', 'Prenom']),
    email: cell(row, ['Email', 'E-mail']) || null,
    telephone: cell(row, ['Téléphone', 'Telephone', 'Tél', 'Tel']) || null,
    date_naissance:
      parseExcelDate(row['Date de naissance'] ?? row['date_naissance'] ?? cell(row, ['Date de naissance'])) ||
      null,
    lieu_naissance: cell(row, ['Lieu de naissance']) || null,
    sexe: cell(row, ['Sexe']) || null,
    situation_familiale: cell(row, ['Situation familiale']) || null,
    nationalite: cell(row, ['Nationalité', 'Nationalite']) || null,
    adresse: cell(row, ['Adresse']) || null,
    province: cell(row, ['Province']) || null,
    niveau_scolaire: cell(row, ['Niveau scolaire', 'Niveau']) || null,
    annee_scolaire: cell(row, ['Année scolaire', 'Annee scolaire']) || null,
    type_formation: cell(row, ['Type de formation']) || null,
    groupe: cell(row, ['Groupe']) || null,
    internat: parseInternat(internRaw),
    poleNom: cell(row, ['Pôle', 'Pole']),
    filiereNom: cell(row, ['Filière', 'Filiere']),
  }
}

export function downloadModeleImportAmbassadeurs() {
  const exemple = [
    'ALAOUI',
    'FATIMA',
    '01/01/2005',
    'Agadir',
    'F',
    'Célibataire',
    'Marocaine',
    '',
    '0600000000',
    'fatima@ofppt.ma',
    'Agadir Ida Outanane',
    'TSGE',
    '2025/2026',
    'Résidentiel',
    'Gestion des Entreprises',
    '101',
    'Oui',
  ]
  const ws = XLSX.utils.aoa_to_sheet([AMBASSADEUR_EXCEL_HEADERS, exemple])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ambassadeurs')
  XLSX.writeFile(wb, 'modele_import_ambassadeurs.xlsx')
}
