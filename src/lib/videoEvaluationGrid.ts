export interface EvaluationCriterion {
  id: string
  label: string
  maxPoints: number
  hint?: string
}

export const EVALUATION_CONTENU_CRITERIA: EvaluationCriterion[] = [
  { id: 'aspect_vestimentaire', label: 'Aspect vestimentaire', maxPoints: 2 },
  {
    id: 'infos_personnelles',
    label: 'Présentation des informations personnelles',
    maxPoints: 3,
  },
  {
    id: 'capacites_communication',
    label: 'Capacités communicationnelles (élocution, richesse du vocabulaire…)',
    maxPoints: 3.5,
  },
  {
    id: 'connaissances_secteur',
    label: 'Connaissances sur le secteur',
    maxPoints: 2.5,
  },
  {
    id: 'experience_secteur',
    label: 'Expérience professionnelle liée au secteur choisi',
    maxPoints: 2.5,
  },
  {
    id: 'projet_ppp',
    label: 'Projet Personnel et Professionnel bien définis',
    maxPoints: 3.5,
  },
  { id: 'motivation', label: 'Motivation, enthousiasme', maxPoints: 3 },
]

export const EVALUATION_FORME_CRITERIA: EvaluationCriterion[] = [
  {
    id: 'duree',
    label: 'Respect de la durée maximale de la vidéo',
    maxPoints: 2,
  },
  {
    id: 'dynamique',
    label: 'La vidéo est dynamique et concise',
    maxPoints: 1.5,
  },
  { id: 'audio', label: 'La qualité audio', maxPoints: 2 },
  { id: 'eclairage', label: "L'éclairage de la vidéo", maxPoints: 1.5 },
  {
    id: 'montage',
    label: 'Le montage (créativité, sous-titres…)',
    maxPoints: 2,
  },
]

export const EVALUATION_ALL_CRITERIA = [
  ...EVALUATION_CONTENU_CRITERIA,
  ...EVALUATION_FORME_CRITERIA,
]

export const EVALUATION_MAX_CONTENU = EVALUATION_CONTENU_CRITERIA.reduce(
  (s, c) => s + c.maxPoints,
  0
)
export const EVALUATION_MAX_FORME = EVALUATION_FORME_CRITERIA.reduce(
  (s, c) => s + c.maxPoints,
  0
)
export const EVALUATION_MAX_TOTAL = EVALUATION_MAX_CONTENU + EVALUATION_MAX_FORME

export type GrilleScores = Record<string, number>
export type GrilleObservations = Record<string, string>

export interface GrilleEvaluationData {
  scores: GrilleScores
  observations: GrilleObservations
  note_contenu: number
  note_forme: number
  note_totale: number
}

export const CANDIDATE_GUIDE_SECTIONS = [
  {
    id: 'infos',
    title: 'I — Informations personnelles',
    items: [
      'Nom / prénom',
      'Date de naissance',
      'Ville',
      'Nationalité',
    ],
  },
  {
    id: 'scolarite',
    title: 'II — Scolarité',
    items: [
      'Quel est votre niveau scolaire ?',
      "Quelle formation souhaitez-vous suivre à l'OFPPT ?",
    ],
  },
  {
    id: 'motivations',
    title: 'III — Motivations',
    items: [
      'Pourquoi avez-vous choisi cette formation ?',
      'Comment cette formation peut contribuer à la réalisation de votre projet professionnel à court et à long terme ?',
    ],
  },
  {
    id: 'qualites',
    title: 'IV — Qualités',
    items: [
      'Citez trois de vos qualités générales.',
      'Citez trois de vos atouts majeurs pour suivre la formation.',
    ],
  },
  {
    id: 'experience',
    title: 'Expérience professionnelle',
    items: [
      'Précisez vos expériences (si vous en avez) en relation avec la filière choisie.',
    ],
  },
] as const

export function emptyGrilleScores(): GrilleScores {
  const scores: GrilleScores = {}
  for (const c of EVALUATION_ALL_CRITERIA) scores[c.id] = 0
  return scores
}

export function emptyGrilleObservations(): GrilleObservations {
  const obs: GrilleObservations = {}
  for (const c of EVALUATION_ALL_CRITERIA) obs[c.id] = ''
  return obs
}

export function sumCriteria(
  criteria: EvaluationCriterion[],
  scores: GrilleScores
): number {
  return criteria.reduce((sum, c) => sum + (Number(scores[c.id]) || 0), 0)
}

export function computeGrilleTotals(scores: GrilleScores): {
  note_contenu: number
  note_forme: number
  note_totale: number
} {
  const note_contenu = sumCriteria(EVALUATION_CONTENU_CRITERIA, scores)
  const note_forme = sumCriteria(EVALUATION_FORME_CRITERIA, scores)
  return {
    note_contenu,
    note_forme,
    note_totale: note_contenu + note_forme,
  }
}

export function buildGrilleData(
  scores: GrilleScores,
  observations: GrilleObservations
): GrilleEvaluationData {
  const totals = computeGrilleTotals(scores)
  return { scores, observations, ...totals }
}

export function validateGrilleScores(scores: GrilleScores): string | null {
  for (const c of EVALUATION_ALL_CRITERIA) {
    const val = Number(scores[c.id])
    if (Number.isNaN(val) || val < 0 || val > c.maxPoints) {
      return `Note invalide pour « ${c.label} » (0 à ${c.maxPoints}).`
    }
  }
  return null
}

export function formatPoints(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '')
}
