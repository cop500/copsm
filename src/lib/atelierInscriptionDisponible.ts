/** Atelier dont le jour est déjà écoulé (date de fin, sinon date de début). */
export function isAtelierDatePassee(
  dateDebut?: string | null,
  dateFin?: string | null
): boolean {
  const raw = dateFin || dateDebut
  if (!raw) return false
  const end = new Date(raw)
  if (Number.isNaN(end.getTime())) return false
  const endOfDay = new Date(end)
  endOfDay.setHours(23, 59, 59, 999)
  return Date.now() > endOfDay.getTime()
}

export function isAtelierComplet(
  capaciteMaximale?: number | null,
  capaciteActuelle?: number | null
): boolean {
  const max = capaciteMaximale ?? 0
  if (max <= 0) return false
  return (capaciteActuelle ?? 0) >= max
}

export function peutSInscrireAtelier(atelier: {
  date_debut?: string | null
  date_fin?: string | null
  capacite_maximale?: number | null
  capacite_actuelle?: number | null
}): boolean {
  if (isAtelierDatePassee(atelier.date_debut, atelier.date_fin)) return false
  if (isAtelierComplet(atelier.capacite_maximale, atelier.capacite_actuelle)) return false
  return true
}
