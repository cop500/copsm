'use client'

import { Clock } from 'lucide-react'
import { computeDelaiTraitement } from '@/lib/delaiTraitementDemande'

export function DelaiTraitementDemandeBadge({
  demande,
  compact = false,
}: {
  demande: {
    created_at: string
    date_cloture?: string | null
    updated_at?: string | null
    statut?: string | null
  }
  compact?: boolean
}) {
  const delai = computeDelaiTraitement(demande)
  if (!delai) return null

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${delai.className}`}
      title={delai.hint}
    >
      <Clock className="h-3.5 w-3.5" />
      {delai.label}
      {!compact && (
        <span className="font-normal opacity-80">
          · {delai.cloturee ? `${delai.dateReception} → ${delai.dateCloture}` : `reçue le ${delai.dateReception}`}
        </span>
      )}
    </span>
  )
}
