export type CvTriStatut = 'en_attente' | 'accepte' | 'refuse'

export function getCvTriLabel(statut?: string | null): string {
  switch (statut) {
    case 'accepte':
      return 'CV accepté'
    case 'refuse':
      return 'CV refusé'
    default:
      return 'À trier'
  }
}

export function getCvTriColor(statut?: string | null): string {
  switch (statut) {
    case 'accepte':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    case 'refuse':
      return 'bg-red-100 text-red-800 border border-red-200'
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}

export function isCvAcceptedForDownload(statut?: string | null): boolean {
  return statut === 'accepte'
}

export function formatCvTelechargeLe(iso?: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

function formatEnvoisOrdinal(count: number): string {
  if (count === 1) return '1er envoi'
  if (count === 2) return '2e envoi'
  return `${count}e envoi`
}

/** Badge libellé + infobulle pour le suivi des envois CV. */
export function getCvEnvoisBadge(
  nbEnvois?: number | null,
  premierEnvoile?: string | null,
  dernierEnvoile?: string | null
): { label: string; title: string } | null {
  const count =
    nbEnvois && nbEnvois > 0 ? nbEnvois : premierEnvoile ? 1 : 0
  if (count <= 0) return null

  const premier = formatCvTelechargeLe(premierEnvoile)
  const dernier = formatCvTelechargeLe(dernierEnvoile ?? premierEnvoile)
  const ordinal = formatEnvoisOrdinal(count)
  const label = dernier ? `${ordinal} · ${dernier}` : ordinal

  const title =
    count === 1
      ? premier
        ? `Premier envoi le ${premier}`
        : 'Premier envoi enregistré'
      : premier && dernier
        ? `${count} envois · 1er le ${premier} · dernier le ${dernier}`
        : `${count} envois enregistrés`

  return { label, title }
}

export function hasCvEnvois(
  nbEnvois?: number | null,
  premierEnvoile?: string | null
): boolean {
  return (nbEnvois ?? 0) > 0 || Boolean(premierEnvoile)
}
