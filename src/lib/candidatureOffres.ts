export interface ProfilOffrePublic {
  pole_id: string
  filiere_id: string
  poste_intitule: string
  poste_description: string
  competences: string
  type_contrat: string
  salaire?: string
  duree?: string
}

export interface OffrePublique {
  id: string
  entreprise_nom?: string
  nom_entreprise?: string
  reference?: string
  statut?: string
  source: 'entreprises' | 'cv'
  profils: ProfilOffrePublic[]
  poste_recherche?: string
  description?: string
  description_poste?: string
  competences_requises?: string
  type_contrat?: string
  contact_nom?: string
  contact_email?: string
  created_at?: string
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

export function normalizeProfilOffre(raw: unknown): ProfilOffrePublic | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>

  const poste_intitule = pickString(p, 'poste_intitule', 'poste', 'titre', 'fonction', 'intitule')
  const poste_description = pickString(
    p,
    'poste_description',
    'description',
    'description_poste',
    'missions',
    'description_missions'
  )
  const competences = pickString(
    p,
    'competences',
    'competences_requises',
    'competences_techniques',
    'skills'
  )
  const type_contrat = pickString(p, 'type_contrat', 'contrat', 'type')

  if (!poste_intitule && !poste_description && !competences && !type_contrat) {
    return null
  }

  return {
    pole_id: pickString(p, 'pole_id'),
    filiere_id: pickString(p, 'filiere_id'),
    poste_intitule: poste_intitule || 'Poste à définir',
    poste_description,
    competences,
    type_contrat,
    salaire: pickString(p, 'salaire') || undefined,
    duree: pickString(p, 'duree') || undefined,
  }
}

export function parseProfils(raw: unknown): ProfilOffrePublic[] {
  if (!raw) return []

  let data: unknown = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      return []
    }
  }

  if (!Array.isArray(data)) return []

  return data
    .map(normalizeProfilOffre)
    .filter((p): p is ProfilOffrePublic => p !== null)
}

export function normalizeOffreEntreprise(row: Record<string, unknown>): OffrePublique {
  const profils = parseProfils(row.profils)

  return {
    id: String(row.id),
    entreprise_nom: pickString(row, 'entreprise_nom') || undefined,
    reference: pickString(row, 'reference') || undefined,
    statut: pickString(row, 'statut') || undefined,
    source: 'entreprises',
    profils,
    contact_nom: pickString(row, 'contact_nom') || undefined,
    contact_email: pickString(row, 'contact_email') || undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
  }
}

export function normalizeOffreCv(row: Record<string, unknown>): OffrePublique {
  return {
    id: String(row.id),
    nom_entreprise: pickString(row, 'nom_entreprise', 'entreprise_nom') || undefined,
    entreprise_nom: pickString(row, 'entreprise_nom', 'nom_entreprise') || undefined,
    reference: pickString(row, 'reference') || undefined,
    statut: pickString(row, 'statut') || undefined,
    source: 'cv',
    profils: [],
    poste_recherche: pickString(row, 'poste_recherche', 'poste') || undefined,
    description: pickString(row, 'description') || undefined,
    description_poste: pickString(row, 'description_poste', 'description') || undefined,
    competences_requises: pickString(row, 'competences_requises', 'competences') || undefined,
    type_contrat: pickString(row, 'type_contrat', 'contrat') || undefined,
    contact_nom: pickString(row, 'contact_nom') || undefined,
    contact_email: pickString(row, 'contact_email') || undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
  }
}
