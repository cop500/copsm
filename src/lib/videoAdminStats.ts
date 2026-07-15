import type { GrilleEvaluationData } from '@/lib/videoEvaluationGrid'

export interface VideoAdminStats {
  totalVideos: number
  totalFormateurs: number
  formateursActifs: number
  enAttenteAffectation: number
  affectees: number
  evaluees: number
  noteMoyenne: number | null
}

export function computeVideoAdminStats(
  videos: { statut: string; note: number | null }[],
  formateurs: { actif: boolean }[]
): VideoAdminStats {
  const evaluees = videos.filter((v) => v.statut === 'evaluee')
  const notes = evaluees.map((v) => v.note).filter((n): n is number => n != null)
  return {
    totalVideos: videos.length,
    totalFormateurs: formateurs.length,
    formateursActifs: formateurs.filter((f) => f.actif).length,
    enAttenteAffectation: videos.filter((v) => v.statut === 'en_attente_affectation').length,
    affectees: videos.filter((v) => v.statut === 'affectee').length,
    evaluees: evaluees.length,
    noteMoyenne:
      notes.length > 0
        ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10
        : null,
  }
}

export interface VideoGrillePrintData {
  id: string
  nom: string
  prenom: string
  cine: string
  filiere: string
  filiereLabel: string
  note: number | null
  commentaire: string | null
  grille_notes: GrilleEvaluationData | null
  evalue_le: string | null
  formateurNom: string | null
}
