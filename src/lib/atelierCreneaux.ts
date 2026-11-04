export const TZ_MAROC = 'Africa/Casablanca'

export const CRENEAUX_ATELIER = [
  { id: '09-11', label: '09h00 – 11h00', debutH: 9, debutM: 0, finH: 11, finM: 0 },
  { id: '10h30-13', label: '10h30 – 13h00', debutH: 10, debutM: 30, finH: 13, finM: 0 },
  { id: '13h30-15h30', label: '13h30 – 15h30', debutH: 13, debutM: 30, finH: 15, finM: 30 },
] as const

export type CreneauAtelierId = (typeof CRENEAUX_ATELIER)[number]['id']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function partsAuMaroc(date: Date) {
  const bits = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ_MAROC,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => Number(bits.find((p) => p.type === type)?.value || '0')
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

/** 09h00 au Maroc → ISO UTC correct, quel que soit le fuseau du PC. */
function heureMarocVersIso(dateJour: string, hour: number, minute: number): string {
  const [y, mo, d] = dateJour.split('-').map(Number)
  let ms = Date.UTC(y, mo - 1, d, hour, minute, 0)
  for (let i = 0; i < 4; i += 1) {
    const got = partsAuMaroc(new Date(ms))
    const delta =
      Date.UTC(y, mo - 1, d, hour, minute, 0) -
      Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute, 0)
    if (delta === 0) break
    ms += delta
  }
  return new Date(ms).toISOString()
}

function trouveCreneau(debutH: number, debutM: number, finH?: number | null, finM?: number | null) {
  return CRENEAUX_ATELIER.find((c) => {
    if (c.debutH !== debutH || c.debutM !== debutM) return false
    if (finH == null || finM == null) return true
    return c.finH === finH && c.finM === finM
  })
}

/** Date YYYY-MM-DD au Maroc. */
export function isoToDateLocale(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = partsAuMaroc(d)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

export function matchCreneauId(dateDebutIso?: string | null, dateFinIso?: string | null): CreneauAtelierId | '' {
  if (!dateDebutIso) return ''
  const debut = new Date(dateDebutIso)
  if (Number.isNaN(debut.getTime())) return ''
  const fin = dateFinIso ? new Date(dateFinIso) : null
  const finOk = fin && !Number.isNaN(fin.getTime()) ? fin : null

  const casa = partsAuMaroc(debut)
  const casaFin = finOk ? partsAuMaroc(finOk) : null
  const viaCasa = trouveCreneau(
    casa.hour,
    casa.minute,
    casaFin ? casaFin.hour : null,
    casaFin ? casaFin.minute : null
  )
  if (viaCasa) return viaCasa.id

  // Anciens enregistrements : 09h stocké comme 09:00 UTC (s’affiche 10h au Maroc)
  const viaUtc = trouveCreneau(
    debut.getUTCHours(),
    debut.getUTCMinutes(),
    finOk ? finOk.getUTCHours() : null,
    finOk ? finOk.getUTCMinutes() : null
  )
  return viaUtc?.id || ''
}

/** Construit date/heure du centre (Africa/Casablanca), pas l’heure du navigateur. */
export function creneauToLocalDateTimes(dateJour: string, creneauId: string) {
  const creneau = CRENEAUX_ATELIER.find((c) => c.id === creneauId)
  if (!dateJour || !creneau) return { date_debut: '', date_fin: '' }
  const parts = dateJour.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !n && n !== 0)) return { date_debut: '', date_fin: '' }
  return {
    date_debut: heureMarocVersIso(dateJour, creneau.debutH, creneau.debutM),
    date_fin: heureMarocVersIso(dateJour, creneau.finH, creneau.finM),
  }
}

export function formatDateAtelier(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { timeZone: TZ_MAROC })
}

export function formatHeureAtelier(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('fr-FR', {
    timeZone: TZ_MAROC,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatCreneauAtelier(debutIso?: string | null, finIso?: string | null): string {
  const id = matchCreneauId(debutIso, finIso)
  const known = CRENEAUX_ATELIER.find((c) => c.id === id)
  if (known) return known.label
  const debut = formatHeureAtelier(debutIso)
  const fin = formatHeureAtelier(finIso)
  if (debut && fin) return `${debut} – ${fin}`
  return debut || '—'
}

export function aujourdHuiLocal(): string {
  return isoToDateLocale(new Date().toISOString())
}
