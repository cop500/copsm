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
      return 'bg-emerald-600 text-white border border-emerald-700 shadow-sm'
    case 'refuse':
      return 'bg-red-600 text-white border border-red-700 shadow-sm'
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}

export function formatCvTriParLabel(
  cvTriParNom?: string | null,
  cvTriLe?: string | null
): string | null {
  if (!cvTriParNom?.trim()) return null
  if (!cvTriLe) return `Trié par ${cvTriParNom.trim()}`
  const date = new Date(cvTriLe).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `Trié par ${cvTriParNom.trim()} le ${date}`
}

/** Contour de fiche candidature selon le tri CV. */
export function getCandidatureTriShellClass(statut?: string | null): string {
  switch (statut) {
    case 'accepte':
      return 'ring-2 ring-emerald-500/70 bg-emerald-50/90'
    case 'refuse':
      return 'ring-2 ring-red-400/60 bg-red-50/70'
    default:
      return 'bg-gray-50'
  }
}

/** Bande latérale colorée (persistante) pour repérer le tri d’un coup d’œil. */
export function getCandidatureTriBorderClass(statut?: string | null): string {
  switch (statut) {
    case 'accepte':
      return 'border-l-4 border-emerald-600 bg-emerald-50/50'
    case 'refuse':
      return 'border-l-4 border-red-500 bg-red-50/40'
    default:
      return 'border-l-4 border-transparent bg-gray-50'
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
