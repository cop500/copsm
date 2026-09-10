export type GotTalentCategorie =
  | 'sportives'
  | 'culturelles'
  | 'environnementales'
  | 'innovation'

export interface GotTalentActivite {
  categorie: GotTalentCategorie
  activite: string
  autre?: string
}

export const GOT_TALENT_CATEGORIES: {
  id: GotTalentCategorie
  label: string
  subtitle: string
  color: string
  border: string
  activities: string[]
}[] = [
  {
    id: 'sportives',
    label: 'Sportives',
    subtitle: 'Activités physiques',
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-200',
    activities: ['BasketBall', 'FootBall', "Jeux d'échec", 'Autre'],
  },
  {
    id: 'culturelles',
    label: 'Culturelles et citoyennes',
    subtitle: 'Arts & citoyenneté',
    color: 'from-violet-500 to-purple-600',
    border: 'border-violet-200',
    activities: ['Cinéma', 'Peinture et dessin', 'Musique', 'Autre'],
  },
  {
    id: 'environnementales',
    label: 'Environnementales',
    subtitle: 'Écologie & entretien',
    color: 'from-green-500 to-lime-600',
    border: 'border-green-200',
    activities: ['Jardinage', 'Recyclage', 'Entretien', 'Autre'],
  },
  {
    id: 'innovation',
    label: 'Club Innovation',
    subtitle: 'Technologie & innovation',
    color: 'from-blue-500 to-indigo-600',
    border: 'border-blue-200',
    activities: [
      'Activités thématiques',
      "Activités d'innovation",
      'Activités technologiques',
      'Autre',
    ],
  },
]

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function formatActiviteLabel(a: GotTalentActivite): string {
  const cat = GOT_TALENT_CATEGORIES.find((c) => c.id === a.categorie)
  const label = a.activite === 'Autre' && a.autre ? a.autre : a.activite
  return `${cat?.label ?? a.categorie} — ${label}`
}
