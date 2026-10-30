'use client'

import { Star, Users } from 'lucide-react'
import { CRITERES_ATELIER, type AtelierIndicateurs } from '@/lib/atelierEvaluation'

export function AtelierIndicateursBlock({
  stats,
  compact = false,
}: {
  stats?: AtelierIndicateurs
  compact?: boolean
}) {
  if (!stats) return null

  const taux =
    stats.tauxPresence == null ? '—' : `${stats.tauxPresence} %`
  const globale =
    stats.moyenneGlobale == null ? '—' : `${stats.moyenneGlobale}/5`

  return (
    <div className={compact ? 'mt-3 space-y-2' : 'mt-4 space-y-3'}>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
          <Users className="w-3.5 h-3.5" />
          Présence {taux}
          <span className="text-emerald-700/70">
            ({stats.presents}/{stats.inscrits})
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-100">
          <Star className="w-3.5 h-3.5" />
          Impact {globale}
          <span className="text-amber-800/70">
            {stats.nbNotes} avis
          </span>
        </span>
      </div>
      {stats.nbNotes > 0 && (
        <div className={`grid gap-1 ${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
          {CRITERES_ATELIER.map(({ key, label }) => (
            <div key={key} className="flex justify-between gap-2">
              <span className="truncate">{label}</span>
              <span className="font-medium text-gray-800 tabular-nums">
                {stats.moyennes[key] == null ? '—' : `${stats.moyennes[key]}/5`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
