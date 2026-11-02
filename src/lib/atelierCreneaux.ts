export const CRENEAUX_ATELIER = [
  { id: '09-11', label: '09h00 – 11h00', debutH: 9, debutM: 0, finH: 11, finM: 0 },
  { id: '10h30-13', label: '10h30 – 13h00', debutH: 10, debutM: 30, finH: 13, finM: 0 },
  { id: '13h30-15h30', label: '13h30 – 15h30', debutH: 13, debutM: 30, finH: 15, finM: 30 },
] as const

export type CreneauAtelierId = (typeof CRENEAUX_ATELIER)[number]['id']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Date locale YYYY-MM-DD à partir d’un ISO. */
export function isoToDateLocale(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function matchCreneauId(dateDebutIso?: string | null, dateFinIso?: string | null): CreneauAtelierId | '' {
  if (!dateDebutIso) return ''
  const debut = new Date(dateDebutIso)
  if (Number.isNaN(debut.getTime())) return ''
  const fin = dateFinIso ? new Date(dateFinIso) : null
  const found = CRENEAUX_ATELIER.find((c) => {
    const debutOk = debut.getHours() === c.debutH && debut.getMinutes() === c.debutM
    if (!debutOk) return false
    if (!fin || Number.isNaN(fin.getTime())) return true
    return fin.getHours() === c.finH && fin.getMinutes() === c.finM
  })
  return found?.id || ''
}

/** Construit date/heure locale (pas d’interprétation UTC du champ datetime-local). */
export function creneauToLocalDateTimes(dateJour: string, creneauId: string) {
  const creneau = CRENEAUX_ATELIER.find((c) => c.id === creneauId)
  if (!dateJour || !creneau) return { date_debut: '', date_fin: '' }
  const parts = dateJour.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !n && n !== 0)) return { date_debut: '', date_fin: '' }
  const [y, mo, d] = parts
  const debut = new Date(y, mo - 1, d, creneau.debutH, creneau.debutM, 0, 0)
  const fin = new Date(y, mo - 1, d, creneau.finH, creneau.finM, 0, 0)
  return {
    date_debut: debut.toISOString(),
    date_fin: fin.toISOString(),
  }
}

export function aujourdHuiLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
