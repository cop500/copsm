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

/** Badge « 1er envoi » uniquement — pour repérer les CV déjà téléchargés vs nouveaux. */
export function getPremierEnvoiBadge(
  premierEnvoile?: string | null
): { label: string; title: string } | null {
  const premier = formatCvTelechargeLe(premierEnvoile)
  if (!premier) return null

  return {
    label: `1er envoi · ${premier}`,
    title: `Premier envoi le ${premier}`,
  }
}

/** @deprecated Utiliser getPremierEnvoiBadge — conserve la compatibilité des imports existants. */
export function getCvEnvoisBadge(
  _nbEnvois?: number | null,
  premierEnvoile?: string | null,
  _dernierEnvoile?: string | null
): { label: string; title: string } | null {
  return getPremierEnvoiBadge(premierEnvoile)
}

export function hasCvEnvois(
  _nbEnvois?: number | null,
  premierEnvoile?: string | null
): boolean {
  return Boolean(premierEnvoile)
}

export function hasPremierEnvoi(premierEnvoile?: string | null): boolean {
  return Boolean(premierEnvoile)
}
