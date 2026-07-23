'use client'

import {
  computeBlocSubtotal,
  computeGrilleTotal,
  type NotesConcoursGrilleDefinition,
  type NotesConcoursGrilleObservations,
  type NotesConcoursGrilleScores,
} from '@/lib/notesConcoursGrilles'

interface NotesConcoursGrilleFormProps {
  definition: NotesConcoursGrilleDefinition
  scores: NotesConcoursGrilleScores
  observations: NotesConcoursGrilleObservations
  onScoreChange: (id: string, value: number) => void
  onObservationChange: (id: string, value: string) => void
  disabled?: boolean
  /** compact = tableau dense pour affichage côte à côte avec la fiche candidat */
  layout?: 'standard' | 'compact'
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5]

function ScoreButtons({
  criterionId,
  label,
  scores,
  disabled,
  onScoreChange,
  size = 'md',
}: {
  criterionId: string
  label: string
  scores: NotesConcoursGrilleScores
  disabled?: boolean
  onScoreChange: (id: string, value: number) => void
  size?: 'md' | 'sm'
}) {
  const btnClass =
    size === 'sm'
      ? 'min-w-[1.75rem] h-7 px-1.5 text-xs'
      : 'min-w-[2.5rem] px-3 py-1.5 text-sm'

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {SCORE_OPTIONS.map((n) => {
        const selected = scores[criterionId] === n
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            aria-label={`${label.slice(0, 60)} — note ${n} sur 5`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onScoreChange(criterionId, n)}
            className={`inline-flex items-center justify-center rounded-md border font-semibold transition-colors ${btnClass} ${
              selected
                ? 'bg-[#0f4c81] text-white border-[#0f4c81]'
                : 'bg-white text-slate-700 border-slate-200 hover:border-[#0f4c81]/40 hover:bg-slate-50'
            } disabled:opacity-50 disabled:pointer-events-none`}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

function BlocTable({
  bloc,
  scores,
  observations,
  disabled,
  onScoreChange,
  onObservationChange,
}: {
  bloc: NotesConcoursGrilleDefinition['blocs'][0]
  scores: NotesConcoursGrilleScores
  observations: NotesConcoursGrilleObservations
  disabled?: boolean
  onScoreChange: (id: string, value: number) => void
  onObservationChange: (id: string, value: string) => void
}) {
  const subtotal = computeBlocSubtotal(bloc, scores)
  const blocMax = bloc.criteria.reduce((s, c) => s + c.maxPoints, 0)

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white flex flex-col min-h-0">
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm">{bloc.label}</h4>
          <p className="text-[10px] text-slate-500 truncate">{bloc.subtotalLabel}</p>
        </div>
        <p className="text-base font-bold text-[#0f4c81] shrink-0">
          {subtotal}/{blocMax}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
              <th className="text-left font-medium px-2 py-1.5 w-8">#</th>
              <th className="text-left font-medium px-2 py-1.5">Critère</th>
              <th className="text-center font-medium px-1 py-1.5 whitespace-nowrap">1–5</th>
              <th className="text-left font-medium px-2 py-1.5 min-w-[100px]">Obs.</th>
            </tr>
          </thead>
          <tbody>
            {bloc.criteria.map((c, index) => (
              <tr key={c.id} className="border-b border-slate-50 align-top hover:bg-slate-50/50">
                <td className="px-2 py-1.5 text-slate-400 font-mono">{index + 1}</td>
                <td className="px-2 py-1.5 text-slate-800 leading-snug max-w-[220px] lg:max-w-none">
                  {c.label}
                </td>
                <td className="px-1 py-1.5">
                  <div className="flex justify-center">
                    <ScoreButtons
                      criterionId={c.id}
                      label={c.label}
                      scores={scores}
                      disabled={disabled}
                      onScoreChange={onScoreChange}
                      size="sm"
                    />
                  </div>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    disabled={disabled}
                    value={observations[c.id] ?? ''}
                    onChange={(e) => onObservationChange(c.id, e.target.value)}
                    placeholder="…"
                    className="w-full min-w-[72px] border border-slate-200 rounded px-1.5 py-1 text-[11px] focus:ring-1 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] disabled:bg-slate-50"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function NotesConcoursGrilleForm({
  definition,
  scores,
  observations,
  onScoreChange,
  onObservationChange,
  disabled,
  layout = 'standard',
}: NotesConcoursGrilleFormProps) {
  const total = computeGrilleTotal(definition, scores)

  if (layout === 'compact') {
    return (
      <div className="flex flex-col gap-3 min-h-0">
        <div className="rounded-lg border border-teal-200 bg-teal-50/90 px-3 py-2 text-xs text-teal-900 shrink-0">
          <span className="font-semibold">{definition.secteur}</span>
          <span className="text-teal-700"> — {definition.scoreMin} à {definition.scoreMax} par critère</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 min-h-0">
          {definition.blocs.map((bloc) => (
            <BlocTable
              key={bloc.id}
              bloc={bloc}
              scores={scores}
              observations={observations}
              disabled={disabled}
              onScoreChange={onScoreChange}
              onObservationChange={onObservationChange}
            />
          ))}
        </div>

        <div className="rounded-lg border border-[#0f4c81]/30 bg-[#0f4c81]/5 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Note d&apos;entretien</p>
            <p className="text-xl font-bold text-[#0f4c81]">
              {total} / {definition.maxTotal}
            </p>
          </div>
          <p className="text-xs text-slate-500">Total TPSS + TPM</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm text-teal-900">
        <p className="font-semibold">{definition.title}</p>
        <p>
          Secteur : <strong>{definition.secteur}</strong> — Noter chaque critère de{' '}
          {definition.scoreMin} à {definition.scoreMax} (total max {definition.maxTotal}/70)
        </p>
      </div>

      {definition.blocs.map((bloc) => {
        const subtotal = computeBlocSubtotal(bloc, scores)
        const blocMax = bloc.criteria.reduce((s, c) => s + c.maxPoints, 0)
        return (
          <div key={bloc.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-900">Bloc : {bloc.label}</h4>
                <p className="text-xs text-slate-500">{bloc.subtotalLabel}</p>
              </div>
              <p className="text-lg font-bold text-[#0f4c81]">
                {subtotal} / {blocMax}
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {bloc.criteria.map((c, index) => (
                <div key={c.id} className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-[#0f4c81]/10 text-[#0f4c81] text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <p className="text-sm font-medium text-slate-800 flex-1">{c.label}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-10">
                    <span className="text-xs text-slate-500 w-full sm:w-auto">Note :</span>
                    <ScoreButtons
                      criterionId={c.id}
                      label={c.label}
                      scores={scores}
                      disabled={disabled}
                      onScoreChange={onScoreChange}
                    />
                  </div>
                  <div className="pl-10">
                    <input
                      type="text"
                      disabled={disabled}
                      value={observations[c.id] ?? ''}
                      onChange={(e) => onObservationChange(c.id, e.target.value)}
                      placeholder="Observation (optionnel)"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0f4c81]/20 focus:border-[#0f4c81] disabled:bg-slate-50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="rounded-xl border-2 border-[#0f4c81] bg-[#0f4c81]/5 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">Note d&apos;entretien (total grille)</p>
          <p className="text-2xl font-bold text-[#0f4c81]">
            {total} / {definition.maxTotal}
          </p>
        </div>
        <p className="text-sm text-slate-500">→ convertie automatiquement en note /20</p>
      </div>
    </div>
  )
}
