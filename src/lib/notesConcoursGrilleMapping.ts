/**
 * Correspondance filière (libellé import Excel / concours) → code grille de notation /70.
 * Source : tableau COP (22 filières → 16 grilles).
 */

export type NotesConcoursGrilleCode =
  | 'AGRI'
  | 'AIG'
  | 'ARTISANAT'
  | 'BTP'
  | 'DES'
  | 'DD'
  | 'ID'
  | 'QHSE'
  | 'FGT'
  | 'GC'
  | 'GE'
  | 'GM'
  | 'MA'
  | 'SANTE'
  | 'MH'
  | 'MT'

export const NOTES_CONCOURS_GRILLE_LABELS: Record<NotesConcoursGrilleCode, string> = {
  AGRI: 'Agriculture',
  AIG: 'Arts industriels / graphisme',
  ARTISANAT: 'Artisanat',
  BTP: 'Bâtiment et travaux publics',
  DES: 'Design',
  DD: 'Développement digital',
  ID: 'Infrastructure digitale',
  QHSE: 'Qualité, hygiène, sécurité, environnement',
  FGT: 'Filières de gestion et technologie',
  GC: 'Gestion des entreprises',
  GE: 'Génie électrique',
  GM: 'Génie mécanique',
  MA: 'Maintenance automobile',
  SANTE: 'Santé',
  MH: 'Management hôtelier',
  MT: 'Management touristique',
}

/** Libellé exact ou variante courante → code grille */
export const FILIERE_TO_GRILLE: Record<string, NotesConcoursGrilleCode> = {
  'management agricole': 'AGRI',
  'techniques agricoles': 'AGRI',
  'infographie prépresse': 'AIG',
  'infographie prepresse': 'AIG',
  'production graphique': 'AIG',
  'bijouterie joaillerie': 'ARTISANAT',
  'haute couture': 'ARTISANAT',
  'génie civil': 'BTP',
  'genie civil': 'BTP',
  'digital design': 'DES',
  'développement digital': 'DD',
  'developpement digital': 'DD',
  'infrastructure digitale': 'ID',
  'qualité hygiène sécurité environnement': 'QHSE',
  'qualite hygiene securite environnement': 'QHSE',
  'génie energétique': 'FGT',
  'genie energetique': 'FGT',
  'gestion des entreprises': 'GC',
  'génie électrique': 'GE',
  'genie electrique': 'GE',
  'génie mécanique': 'GM',
  'genie mecanique': 'GM',
  'diagnostic et electronique embarquée automobile': 'MA',
  'diagnostic et électronique embarquée automobile': 'MA',
  'analyses médicales': 'SANTE',
  'analyses medicales': 'SANTE',
  'auxiliaire de soins': 'SANTE',
  'installation et maintenance biomédicale': 'SANTE',
  'installation et maintenance biomedicales': 'SANTE',
  'radiologie diagnostique': 'SANTE',
  'management hôtelier': 'MH',
  'management hotelier': 'MH',
  'management touristique': 'MT',
}

export function normalizeFiliereKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

/** Retourne le code grille pour une filière candidat, ou null si non couverte. */
export function resolveGrilleCodeFromFiliere(filiere: string | null | undefined): NotesConcoursGrilleCode | null {
  if (!filiere?.trim()) return null
  const normalized = normalizeFiliereKey(filiere)
  if (FILIERE_TO_GRILLE[normalized]) return FILIERE_TO_GRILLE[normalized]

  // Correspondance partielle (libellés Excel légèrement différents)
  for (const [key, code] of Object.entries(FILIERE_TO_GRILLE)) {
    if (normalized.includes(key) || key.includes(normalized)) return code
  }
  return null
}

export function isFiliereEligibleGrille(filiere: string | null | undefined): boolean {
  return resolveGrilleCodeFromFiliere(filiere) != null
}

export const FILIERES_AVEC_GRILLE = Object.keys(FILIERE_TO_GRILLE).length

export const GRILLES_UNIQUES = Object.keys(NOTES_CONCOURS_GRILLE_LABELS) as NotesConcoursGrilleCode[]
