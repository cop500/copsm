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
