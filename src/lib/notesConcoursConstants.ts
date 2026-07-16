/** Colonnes Excel import/export (ordre identique au fichier source) */
export const NOTES_CONCOURS_EXCEL_COLUMNS = [
  'DR',
  'EFP',
  'Niveau Formation',
  'Nom',
  'Prénom',
  'id_InscriptionConcoursNational',
  'CEF',
  'Niveau scolaire',
  'Moyenne',
  'Branche',
  'Catégorie',
  'Filière',
  'Numéro de choix',
  'Classement',
  'Statut',
  'Tel 1',
  'Tel 2',
  'Validé',
  'Absent',
  'Note /70',
  'Note /20',
] as const

export type NotesConcoursExcelColumn = (typeof NOTES_CONCOURS_EXCEL_COLUMNS)[number]

/** Conversion proportionnelle Note /70 → Note /20 */
export function calcNote20From70(note70: number): number {
  const n = (note70 / 70) * 20
  return Math.round(n * 100) / 100
}

export function isCandidatTraite(note70: number | null | undefined): boolean {
  return note70 != null && !Number.isNaN(Number(note70))
}

export interface CandidatNotesRow {
  id: string
  dr: string | null
  efp: string | null
  niveau_formation: string | null
  nom: string
  prenom: string
  id_inscription_concours_national: string
  cef: string
  niveau_scolaire: string | null
  moyenne: string | null
  branche: string | null
  categorie: string | null
  filiere: string | null
  numero_choix: string | null
  classement: string | null
  statut: string | null
  tel_1: string | null
  tel_2: string | null
  valide: string | null
  absent: string | null
  note_70: number | null
  note_20: number | null
  agent_id: string | null
  saisi_le: string | null
  created_at: string
  updated_at: string
  agents_saisie_notes?: { nom: string } | null
}

export interface AgentSaisieRow {
  id: string
  nom: string
  login: string
  actif: boolean
  created_at: string
}

export const CANDIDAT_READONLY_FIELDS: { key: keyof CandidatNotesRow; label: string }[] = [
  { key: 'dr', label: 'DR' },
  { key: 'efp', label: 'EFP' },
  { key: 'niveau_formation', label: 'Niveau Formation' },
  { key: 'nom', label: 'Nom' },
  { key: 'prenom', label: 'Prénom' },
  { key: 'id_inscription_concours_national', label: 'id_InscriptionConcoursNational' },
  { key: 'cef', label: 'CEF' },
  { key: 'niveau_scolaire', label: 'Niveau scolaire' },
  { key: 'moyenne', label: 'Moyenne' },
  { key: 'branche', label: 'Branche' },
  { key: 'categorie', label: 'Catégorie' },
  { key: 'filiere', label: 'Filière' },
  { key: 'numero_choix', label: 'Numéro de choix' },
  { key: 'classement', label: 'Classement' },
  { key: 'statut', label: 'Statut' },
  { key: 'tel_1', label: 'Tel 1' },
  { key: 'tel_2', label: 'Tel 2' },
  { key: 'valide', label: 'Validé' },
  { key: 'absent', label: 'Absent' },
]
