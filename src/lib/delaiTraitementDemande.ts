export function isDemandeCloturee(statut?: string | null): boolean {
  const value = (statut || '').toLowerCase()
  return ['terminee', 'termine', 'refusee', 'refuse', 'annulee', 'annule'].includes(value)
}

export type DelaiTraitement = {
  jours: number
  cloturee: boolean
  dateReception: string
  dateCloture: string | null
  label: string
  hint: string
  className: string
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function formatDateFr(iso?: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-FR')
}

function formatJours(jours: number) {
  if (jours <= 0) return "moins d'un jour"
  if (jours === 1) return '1 jour'
  return `${jours} jours`
}

export function computeDelaiTraitement(demande: {
  created_at: string
  date_cloture?: string | null
  updated_at?: string | null
  statut?: string | null
}): DelaiTraitement | null {
  const start = new Date(demande.created_at)
  if (Number.isNaN(start.getTime())) return null

  const cloturee = isDemandeCloturee(demande.statut)
  const endIso = cloturee
    ? demande.date_cloture || demande.updated_at || new Date().toISOString()
    : new Date().toISOString()
  const end = new Date(endIso)
  if (Number.isNaN(end.getTime())) return null

  const jours = Math.max(0, Math.round((startOfDay(end) - startOfDay(start)) / 86400000))
  const tone =
    jours <= 7
      ? 'border-teal-200 bg-teal-50 text-teal-900'
      : jours <= 14
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-red-200 bg-red-50 text-red-900'

  const dateReception = formatDateFr(demande.created_at)
  const dateCloture = cloturee ? formatDateFr(endIso) : null

  return {
    jours,
    cloturee,
    dateReception,
    dateCloture,
    label: cloturee ? `Traité en ${formatJours(jours)}` : `En traitement : ${formatJours(jours)}`,
    hint: cloturee
      ? `Réception ${dateReception} → clôture ${dateCloture}`
      : `Réception ${dateReception} — en cours`,
    className: tone,
  }
}
