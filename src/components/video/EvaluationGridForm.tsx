'use client'

import { useMemo } from 'react'
import {
  EVALUATION_CONTENU_CRITERIA,
  EVALUATION_FORME_CRITERIA,
  EVALUATION_MAX_CONTENU,
  EVALUATION_MAX_FORME,
  EVALUATION_MAX_TOTAL,
  computeGrilleTotals,
  formatPoints,
  type EvaluationCriterion,
  type GrilleObservations,
  type GrilleScores,
} from '@/lib/videoEvaluationGrid'

interface EvaluationGridFormProps {
  scores: GrilleScores
  observations: GrilleObservations
  onScoreChange: (id: string, value: number) => void
  onObservationChange: (id: string, value: string) => void
  disabled?: boolean
}

function CriteriaBlock({
  title,
  subtitle,
  criteria,
  scores,
  observations,
  onScoreChange,
  onObservationChange,
  disabled,
}: {
  title: string
  subtitle: string
  criteria: EvaluationCriterion[]
  scores: GrilleScores
  observations: GrilleObservations
  onScoreChange: (id: string, value: number) => void
  onObservationChange: (id: string, value: string) => void
  disabled?: boolean
}) {
  const subtotal = criteria.reduce((s, c) => s + (Number(scores[c.id]) || 0), 0)
  const max = criteria.reduce((s, c) => s + c.maxPoints, 0)

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500">Sous-total</p>
          <p className="text-lg font-bold text-[#0f3d6c]">
            {formatPoints(subtotal)} / {formatPoints(max)}
          </p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {criteria.map((c) => (
          <div key={c.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
            <div className="md:col-span-1">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-[#0f3d6c] font-bold text-sm">
                {formatPoints(c.maxPoints)}
              </span>
            </div>
            <div className="md:col-span-5">
              <p className="text-sm font-medium text-slate-800">{c.label}</p>
            </div>
            <div className="md:col-span-2">
              <label className="sr-only">Note {c.label}</label>
              <input
                type="number"
                min={0}
                max={c.maxPoints}
                step={0.5}
                disabled={disabled}
                value={scores[c.id] ?? 0}
                onChange={(e) => onScoreChange(c.id, Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0f3d6c]/20 focus:border-[#0f3d6c] disabled:bg-slate-50"
              />
            </div>
            <div className="md:col-span-4">
              <label className="sr-only">Observation {c.label}</label>
              <input
                type="text"
                disabled={disabled}
                value={observations[c.id] ?? ''}
                onChange={(e) => onObservationChange(c.id, e.target.value)}
                placeholder="Observation (optionnel)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0f3d6c]/20 focus:border-[#0f3d6c] disabled:bg-slate-50"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EvaluationGridForm({
  scores,
  observations,
  onScoreChange,
  onObservationChange,
  disabled,
}: EvaluationGridFormProps) {
  const totals = useMemo(() => computeGrilleTotals(scores), [scores])

  return (
    <div className="space-y-5">
      <CriteriaBlock
        title="Évaluation du contenu"
        subtitle="Ce qui est dit dans la vidéo"
        criteria={EVALUATION_CONTENU_CRITERIA}
        scores={scores}
        observations={observations}
        onScoreChange={onScoreChange}
        onObservationChange={onObservationChange}
        disabled={disabled}
      />
      <CriteriaBlock
        title="Évaluation de la forme"
        subtitle="Qualité technique de la vidéo"
        criteria={EVALUATION_FORME_CRITERIA}
        scores={scores}
        observations={observations}
        onScoreChange={onScoreChange}
        onObservationChange={onObservationChange}
        disabled={disabled}
      />

      <div className="rounded-xl border-2 border-[#0f3d6c]/20 bg-gradient-to-r from-blue-50 to-slate-50 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Contenu</p>
            <p className="text-2xl font-bold text-[#0f3d6c]">
              {formatPoints(totals.note_contenu)} / {formatPoints(EVALUATION_MAX_CONTENU)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Forme</p>
            <p className="text-2xl font-bold text-[#0f3d6c]">
              {formatPoints(totals.note_forme)} / {formatPoints(EVALUATION_MAX_FORME)}
            </p>
          </div>
          <div className="sm:border-l sm:border-slate-200 sm:pl-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-3xl font-bold text-[#0f3d6c]">
              {formatPoints(totals.note_totale)} / {formatPoints(EVALUATION_MAX_TOTAL)}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">
          * Cette note représente 20 % de la note globale lors des délibérations.
        </p>
      </div>
    </div>
  )
}
