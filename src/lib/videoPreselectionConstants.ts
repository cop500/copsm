export const VIDEO_FILIERES = [
  { id: 'assistant_administratif', label: 'Assistant administratif' },
  { id: 'art_de_la_table', label: "L'art de table" },
  { id: 'ambulancier', label: 'Ambulancier' },
] as const

export type VideoFiliereId = (typeof VIDEO_FILIERES)[number]['id']

export const VIDEO_STATUTS = {
  en_attente_affectation: 'En attente d\'affectation',
  affectee: 'Affectée',
  evaluee: 'Évaluée',
} as const

export type VideoStatut = keyof typeof VIDEO_STATUTS

export const VIDEO_MAX_BYTES = 50 * 1024 * 1024 // 50 Mo (plan gratuit Supabase)
export const VIDEO_MAX_DURATION_SEC = 120

export function filiereLabel(id: string): string {
  return VIDEO_FILIERES.find((f) => f.id === id)?.label ?? id
}

export function normalizeCine(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}
