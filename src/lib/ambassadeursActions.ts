export const TYPES_ACTION_AMBASSADEUR = [
  {
    id: 'organisation_evenements',
    label: 'Organisation d’événements',
    detailLabel: 'Intitulé de l’événement',
    placeholder: 'Ex. Journée portes ouvertes, atelier CV…',
  },
  {
    id: 'forums_orientation',
    label: 'Participation aux forums d’orientation',
    detailLabel: 'Nom du forum',
    placeholder: 'Ex. Forum des métiers Agadir…',
  },
  {
    id: 'sensibilisation',
    label: 'Actions de sensibilisation',
    detailLabel: 'Thème / public',
    placeholder: 'Ex. Sensibilisation orientation lycée X…',
  },
  {
    id: 'taches_administratives',
    label: 'Tâches administratives sous l’encadrement d’un(e) conseiller(ère)',
    detailLabel: 'Nature de la tâche',
    placeholder: 'Ex. Accueil, classement dossiers…',
  },
  {
    id: 'visites_guidees',
    label: 'Accompagnement des visites guidées',
    detailLabel: 'Public / établissement visité',
    placeholder: 'Ex. Collège Y, délégation entreprise…',
  },
  {
    id: 'open_space',
    label: 'Animation de l’Open Space',
    detailLabel: 'Thème de l’animation',
    placeholder: 'Ex. Atelier CV, simulation entretien…',
  },
] as const

export type TypeActionAmbassadeurId = (typeof TYPES_ACTION_AMBASSADEUR)[number]['id']

export function libelleActionAmbassadeur(id: string): string {
  return TYPES_ACTION_AMBASSADEUR.find((a) => a.id === id)?.label || id
}

export function joindreActionsCochees(
  ids: string[],
  details: Record<string, string> = {}
): string {
  return ids
    .map((id) => {
      const label = libelleActionAmbassadeur(id)
      const extra = (details[id] || '').trim()
      return extra ? `${label} : ${extra}` : label
    })
    .join(' · ')
}

export function extraireActionsEnregistrees(responsable: string | null | undefined): string[] {
  if (!responsable?.trim()) return []
  return responsable
    .split(/\s*[·|•]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function labelTypeAction(volet: string | null | undefined): string {
  if (volet === 'collective') return 'Collective'
  if (volet === 'individuelle') return 'Individuelle'
  return ''
}
