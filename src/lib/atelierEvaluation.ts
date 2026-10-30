export const CRITERES_ATELIER = [
  { key: 'clarte', label: 'Clarté du contenu' },
  { key: 'utilite', label: 'Utilité pour mon projet professionnel' },
  { key: 'animation', label: 'Qualité de l’animation' },
  { key: 'organisation', label: 'Organisation (durée, rythme, supports)' },
  { key: 'recommandation', label: 'Je recommande cet atelier' },
] as const

export type CritereAtelierKey = (typeof CRITERES_ATELIER)[number]['key']

export type NotesAtelier = Record<CritereAtelierKey, number>

export const NOTES_VIDES: NotesAtelier = {
  clarte: 0,
  utilite: 0,
  animation: 0,
  organisation: 0,
  recommandation: 0,
}

export function normalizeEmail(value: string): string {
  return (value || '').trim().toLowerCase()
}

export function normalizeNom(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

export function nomsCorrespondent(a: string, b: string): boolean {
  const na = normalizeNom(a)
  const nb = normalizeNom(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const ta = na.split(' ').filter(Boolean).sort().join(' ')
  const tb = nb.split(' ').filter(Boolean).sort().join(' ')
  return ta === tb
}

export function noteValide(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5
}

export type EvaluationStagiaire = NotesAtelier & {
  inscription_id: string
  commentaire?: string | null
  created_at?: string
}

export function moyenneGlobaleNotes(notes: Partial<NotesAtelier>): number | null {
  const values = CRITERES_ATELIER.map(({ key }) => notes[key]).filter(
    (n): n is number => typeof n === 'number' && n >= 1 && n <= 5
  )
  return moyenne(values)
}

export type AtelierIndicateurs = {
  atelierId: string
  inscrits: number
  presents: number
  tauxPresence: number | null
  nbNotes: number
  moyennes: Record<CritereAtelierKey, number | null>
  moyenneGlobale: number | null
}

export function indicateursVides(atelierId: string): AtelierIndicateurs {
  return {
    atelierId,
    inscrits: 0,
    presents: 0,
    tauxPresence: null,
    nbNotes: 0,
    moyennes: {
      clarte: null,
      utilite: null,
      animation: null,
      organisation: null,
      recommandation: null,
    },
    moyenneGlobale: null,
  }
}

function moyenne(values: number[]): number | null {
  if (!values.length) return null
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
}

export function calculerIndicateurs(params: {
  atelierId: string
  inscriptions: Array<{ present?: boolean | null; statut?: string | null }>
  evaluations: Array<Partial<NotesAtelier>>
}): AtelierIndicateurs {
  const inscrits = params.inscriptions.filter((i) => i.statut !== 'annule').length
  const presents = params.inscriptions.filter(
    (i) => i.statut !== 'annule' && i.present === true
  ).length
  const tauxPresence = inscrits > 0 ? Math.round((presents / inscrits) * 100) : null

  const moyennes = Object.fromEntries(
    CRITERES_ATELIER.map(({ key }) => [
      key,
      moyenne(
        params.evaluations
          .map((e) => e[key])
          .filter((n): n is number => typeof n === 'number' && n >= 1 && n <= 5)
      ),
    ])
  ) as Record<CritereAtelierKey, number | null>

  const moyennesNumeriques = CRITERES_ATELIER.map(({ key }) => moyennes[key]).filter(
    (n): n is number => n != null
  )

  return {
    atelierId: params.atelierId,
    inscrits,
    presents,
    tauxPresence,
    nbNotes: params.evaluations.length,
    moyennes,
    moyenneGlobale: moyenne(moyennesNumeriques),
  }
}
