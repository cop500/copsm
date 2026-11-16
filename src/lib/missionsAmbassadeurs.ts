export type MissionAmbassadeur = {
  id: string
  intitule: string
  date_mission: string
  lieu: string
  heure_debut: string
  heure_fin: string
  conseiller_responsable: string
  actif: boolean
  created_at?: string
  disponibilites?: DisponibiliteMission[]
  nb_disponibles?: number
}

export type DisponibiliteMission = {
  id: string
  mission_id: string
  stagiaire_id: string
  nom: string
  prenom: string
  telephone: string
  created_at?: string
}

export const ROLES_MISSIONS_AMBASSADEURS = [
  'business_developer',
  'manager_cop',
  'conseiller_cop',
  'conseillere_carriere',
  'directeur',
] as const

export function normaliserNom(valeur: string) {
  return valeur
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function normaliserTelephone(valeur: string) {
  return valeur.replace(/[\s.\-]/g, '')
}

export function telephoneMarocValide(valeur: string) {
  return /^0[5-7]\d{8}$/.test(normaliserTelephone(valeur))
}

export function aujourdHuiCasablanca() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' })
}

export function maintenantCasablanca() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value || ''
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    heure: `${get('hour')}:${get('minute')}`,
  }
}

export function heureHHMM(valeur: string) {
  return String(valeur || '').slice(0, 5)
}

export function missionEstPassee(dateMission: string, heureDebut: string) {
  const { date, heure } = maintenantCasablanca()
  const jour = String(dateMission || '').slice(0, 10)
  if (!jour) return true
  if (jour < date) return true
  if (jour > date) return false
  return heureHHMM(heureDebut) <= heure
}

export function creneauxChevauchent(
  a: { date_mission: string; heure_debut: string; heure_fin: string },
  b: { date_mission: string; heure_debut: string; heure_fin: string }
) {
  if (String(a.date_mission).slice(0, 10) !== String(b.date_mission).slice(0, 10)) return false
  return heureHHMM(a.heure_debut) < heureHHMM(b.heure_fin) && heureHHMM(b.heure_debut) < heureHHMM(a.heure_fin)
}

export function formatCreneau(debut: string, fin: string) {
  const h = (t: string) => {
    const [hh = '00', mm = '00'] = String(t || '').slice(0, 5).split(':')
    return `${hh}h${mm}`
  }
  return `${h(debut)} – ${h(fin)}`
}

export function formatDateMission(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
