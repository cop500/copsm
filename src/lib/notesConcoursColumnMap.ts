/** Normalisation des en-têtes Excel pour mapping flexible */
export function normalizeExcelHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/** Alias reconnus pour chaque champ métier */
export const EXCEL_FIELD_ALIASES: Record<string, string[]> = {
  dr: ['dr'],
  efp: ['efp'],
  niveau_formation: ['niveauformation', 'nivformation', 'niveau'],
  nom: ['nom', 'name'],
  prenom: ['prenom', 'firstname'],
  id_inscription_concours_national: [
    'idinscriptionconcoursnational',
    'idinscription',
    'inscriptionconcoursnational',
    'numeroinscription',
    'ninscription',
  ],
  cef: ['cef'],
  niveau_scolaire: ['niveauscolaire', 'nivscolaire'],
  moyenne: ['moyenne', 'moy'],
  branche: ['branche'],
  categorie: ['categorie', 'category'],
  filiere: [
    'filiere',
    'filliere',
    'filier',
    'specialite',
    'specialité',
    'options',
    'option',
    'filiereduchoix',
    'libellefiliere',
    'libfiliere',
  ],
  numero_choix: [
    'numerodechoix',
    'numerochoix',
    'numeroduchoix',
    'ndechoix',
    'numchoix',
    'numerodechoix',
  ],
  classement: ['classement', 'rang', 'rank'],
  statut: ['statut', 'status', 'etat'],
  tel_1: ['tel1', 'telephone1', 'telephone', 'tel', 'gsm', 'mobile'],
  tel_2: ['tel2', 'telephone2'],
  valide: ['valide', 'validé', 'validated'],
  absent: ['absent'],
  note_70: ['note70', 'note/70', 'note70'],
  note_20: ['note20', 'note/20', 'note20'],
}

export function buildExcelColumnIndex(headerRow: string[]): Partial<Record<string, number>> {
  const index: Partial<Record<string, number>> = {}

  headerRow.forEach((header, colIdx) => {
    const n = normalizeExcelHeader(header)
    if (!n) return

    for (const [field, aliases] of Object.entries(EXCEL_FIELD_ALIASES)) {
      if (index[field] != null) continue
      const matched = aliases.some(
        (alias) =>
          n === alias || (alias.length >= 5 && (n.endsWith(alias) || n.includes(alias)))
      )
      if (matched) index[field] = colIdx
    }
  })

  return index
}

export function cellAt(row: unknown[], colIdx: number | undefined): string {
  if (colIdx == null || colIdx < 0) return ''
  const v = row[colIdx]
  if (v == null || v === '') return ''
  if (typeof v === 'number') return String(v)
  return String(v).trim()
}
