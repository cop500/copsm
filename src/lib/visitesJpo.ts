export const VISITES_JPO_DEADLINE = new Date('2027-05-01T23:45:00+01:00')

export const VISITES_JPO_CRENEAUX = [
  { id: '09:00-12:00', label: '09h00', start: '09:00', end: '12:00' },
  { id: '13:00-16:00', label: '13h00', start: '13:00', end: '16:00' },
] as const

export const VALIDATEURS_JPO_EMAILS = [
  'abdelhamid.inajjaren@ofppt.ma',
  'sara.hanzaze@ofppt.ma',
]

export function peutValiderVisiteJpo(person: {
  role?: string | null
  email?: string | null
  nom?: string | null
  prenom?: string | null
}): boolean {
  if (person.role === 'business_developer') return true
  const email = (person.email || '').trim().toLowerCase()
  if (email && VALIDATEURS_JPO_EMAILS.includes(email)) return true
  const identity = `${person.prenom || ''} ${person.nom || ''}`.toLowerCase()
  if (identity.includes('sara') && identity.includes('hanzaze')) return true
  if (identity.includes('abdelhamid') && identity.includes('inajjaren')) return true
  return false
}

export const CRENEAU_RESERVE_MESSAGE =
  'Cette journée et ce créneau sont déjà réservés. Merci de réserver une autre date sur le planning.'

export type VisiteJpoStatut = 'en_attente' | 'confirmee' | 'refusee'

export type VisiteJpoReservation = {
  id: string
  nom_prenom: string
  telephone: string
  email: string
  fonction: string
  etablissement: string
  date_visite: string
  creneau: string
  nombre_participants: number
  nombre_accompagnateurs: number
  statut: VisiteJpoStatut
  calendrier_event_id?: string | null
  confirme_par?: string | null
  confirme_le?: string | null
  confirme_par_nom?: string | null
  created_at: string
}

export function creneauLabel(id: string): string {
  const slot = VISITES_JPO_CRENEAUX.find((c) => c.id === id)
  if (!slot) return id
  return `${slot.label} (${slot.start}–${slot.end})`
}

export function formatDateVisiteFr(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function inscriptionsOuvertes(): boolean {
  return Date.now() <= VISITES_JPO_DEADLINE.getTime()
}

export function isWeekendDate(isoDate: string): boolean {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return true
  const day = new Date(y, m - 1, d).getDay()
  return day === 0 || day === 6
}

export function creneauToRange(isoDate: string, creneauId: string): { debut: string; fin: string } | null {
  const slot = VISITES_JPO_CRENEAUX.find((c) => c.id === creneauId)
  if (!slot) return null
  return {
    debut: `${isoDate}T${slot.start}:00`,
    fin: `${isoDate}T${slot.end}:00`,
  }
}
