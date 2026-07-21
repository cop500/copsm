'use client'

import {
  CheckCircle2,
  AlertCircle,
  CircleDashed,
  ChevronDown,
} from 'lucide-react'
import {
  getFillModeLabel,
  type CanevasColumnRule,
  type CanevasFillMode,
  type CanevasParametres,
  type CanevasSourceFile,
} from '@/lib/canevasRules'
import type { CanevasColumnWithRule } from '@/lib/canevasRules'
import {
  SOURCE_CATEGORY_LABELS,
  MODES_BY_CATEGORY,
  getSourceCategory,
  previewFieldValue,
  countConfiguredFields,
  type CanevasSourceCategory,
  type CanevasRubrique,
} from '@/lib/canevasRubrique'

const CATEGORY_COLORS: Record<CanevasSourceCategory, string> = {
  manual: 'bg-slate-100 text-slate-700 border-slate-200',
  excel: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  calcul: 'bg-violet-50 text-violet-800 border-violet-200',
  app: 'bg-amber-50 text-amber-700 border-amber-200',
}

interface CanevasFieldsPanelProps {
  colonnes: CanevasColumnWithRule[]
  columnRules: Record<number, CanevasColumnRule>
  parametres: CanevasParametres
  sourceFiles: CanevasSourceFile[]
  referenceSourceColumns: { index: number; label: string }[]
  rubriques: CanevasRubrique[]
  selectedRubriqueId: string
  onSelectRubrique: (id: string) => void
  onApplyRubrique: () => void
  onSaveRubrique: () => void
  onUpdateRule: (colIndex: number, patch: Partial<CanevasColumnRule>) => void
  onSetCategory: (colIndex: number, category: CanevasSourceCategory) => void
  onPickSourceColumn: (colIndex: number, label: string | null) => void
  onParametresChange: (patch: Partial<CanevasParametres>) => void
  useAgg: boolean
}

export default function CanevasFieldsPanel({
  colonnes,
  columnRules,
  parametres,
  sourceFiles,
  referenceSourceColumns,
  rubriques,
  selectedRubriqueId,
  onSelectRubrique,
  onApplyRubrique,
  onSaveRubrique,
  onUpdateRule,
  onSetCategory,
  onPickSourceColumn,
  onParametresChange,
  useAgg,
}: CanevasFieldsPanelProps) {
  const { ok, total } = countConfiguredFields(
    colonnes,
    columnRules,
    parametres,
    sourceFiles
  )

  return (
    <div className="space-y-4">
      {/* En-tête assistant */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-xl">
        <div>
          <h4 className="font-semibold text-gray-900">Champs à remplir</h4>
          <p className="text-sm text-gray-600 mt-0.5">
            {total} champs détectés · {ok}/{total} prêts
            {sourceFiles.length > 0 && ` · ${sourceFiles.length} fichier(s) source`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={selectedRubriqueId}
              onChange={(e) => onSelectRubrique(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm bg-white min-w-[180px]"
            >
              <option value="">Rubrique enregistrée…</option>
              {rubriques.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button
            type="button"
            disabled={!selectedRubriqueId}
            onClick={onApplyRubrique}
            className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Appliquer
          </button>
          <button
            type="button"
            onClick={onSaveRubrique}
            className="px-3 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Enregistrer rubrique
          </button>
        </div>
      </div>

      {/* Paramètres calcul */}
      {useAgg && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-violet-50/50 border border-violet-100 rounded-lg text-sm">
          <div>
            <label className="text-xs text-gray-600">Filière (regroupement)</label>
            <select
              value={parametres.groupSourceColumnLabel ?? ''}
              onChange={(e) => {
                const col = referenceSourceColumns.find((c) => c.label === e.target.value)
                onParametresChange({
                  groupSourceColumnLabel: col?.label ?? null,
                  groupSourceColumnIndex: col?.index ?? null,
                })
              }}
              className="w-full mt-1 px-2 py-1 border rounded text-xs bg-white"
            >
              <option value="">—</option>
              {referenceSourceColumns.map((c) => (
                <option key={c.index} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Taux min %</label>
            <input
              type="number"
              value={parametres.tauxMin}
              onChange={(e) => onParametresChange({ tauxMin: Number(e.target.value) })}
              className="w-full mt-1 px-2 py-1 border rounded text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Taux max %</label>
            <input
              type="number"
              value={parametres.tauxMax}
              onChange={(e) => onParametresChange({ tauxMax: Number(e.target.value) })}
              className="w-full mt-1 px-2 py-1 border rounded text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Taux cible %</label>
            <input
              type="number"
              value={parametres.tauxCible}
              onChange={(e) => onParametresChange({ tauxCible: Number(e.target.value) })}
              className="w-full mt-1 px-2 py-1 border rounded text-xs"
            />
          </div>
        </div>
      )}

      {/* Tableau champs */}
      <div className="border rounded-xl overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[minmax(140px,1fr)_120px_minmax(200px,1.5fr)_minmax(100px,0.8fr)_48px] gap-2 px-4 py-2.5 bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wide">
          <span>Champ du canevas</span>
          <span>Source</span>
          <span>Comment remplir</span>
          <span>Aperçu</span>
          <span className="text-center">État</span>
        </div>
        <div className="divide-y">
          {[...colonnes]
            .sort((a, b) => a.index - b.index)
            .map((col) => {
              const rule = columnRules[col.index] ?? { mode: 'source_column' as CanevasFillMode }
              const category = getSourceCategory(rule.mode)
              const preview = previewFieldValue(
                col.index,
                colonnes,
                columnRules,
                parametres,
                sourceFiles
              )

              return (
                <div
                  key={col.index}
                  className="grid grid-cols-1 md:grid-cols-[minmax(140px,1fr)_120px_minmax(200px,1.5fr)_minmax(100px,0.8fr)_48px] gap-3 md:gap-2 px-4 py-4 md:py-3 md:items-center hover:bg-gray-50/50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{col.label}</p>
                    <p className="text-xs text-gray-400 md:hidden mt-0.5">{getFillModeLabel(rule.mode)}</p>
                  </div>

                  <div>
                    <select
                      value={category}
                      onChange={(e) =>
                        onSetCategory(col.index, e.target.value as CanevasSourceCategory)
                      }
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs font-medium ${CATEGORY_COLORS[category]}`}
                    >
                      {(Object.keys(SOURCE_CATEGORY_LABELS) as CanevasSourceCategory[]).map(
                        (cat) => (
                          <option key={cat} value={cat} disabled={cat === 'app'}>
                            {SOURCE_CATEGORY_LABELS[cat]}
                            {cat === 'app' ? ' (bientôt)' : ''}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="min-w-0">
                    {category === 'manual' && (
                      <input
                        type="text"
                        value={rule.manualValue ?? ''}
                        onChange={(e) => onUpdateRule(col.index, { manualValue: e.target.value })}
                        placeholder="Valeur à saisir…"
                        className="w-full px-2 py-1.5 border rounded-lg text-sm"
                      />
                    )}

                    {category === 'excel' && (
                      <div className="space-y-1.5">
                        <select
                          value={rule.mode}
                          onChange={(e) =>
                            onUpdateRule(col.index, { mode: e.target.value as CanevasFillMode })
                          }
                          className="w-full px-2 py-1 border rounded-lg text-xs bg-white"
                        >
                          {MODES_BY_CATEGORY.excel.map((m) => (
                            <option key={m} value={m}>
                              {getFillModeLabel(m)}
                            </option>
                          ))}
                        </select>
                        {rule.mode === 'source_column' && (
                          <select
                            value={rule.sourceColumnLabel ?? ''}
                            onChange={(e) => onPickSourceColumn(col.index, e.target.value || null)}
                            disabled={!referenceSourceColumns.length}
                            className="w-full px-2 py-1 border rounded-lg text-xs bg-white disabled:bg-gray-50"
                          >
                            <option value="">Colonne Excel…</option>
                            {referenceSourceColumns.map((sc) => (
                              <option key={sc.index} value={sc.label}>
                                {sc.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {rule.mode === 'file_promotion' && (
                          <div className="flex gap-1">
                            <select
                              value={rule.moisSourceColumnLabel ?? ''}
                              onChange={(e) =>
                                onUpdateRule(col.index, {
                                  moisSourceColumnLabel: e.target.value || null,
                                })
                              }
                              className="flex-1 px-1 py-1 border rounded text-xs"
                            >
                              <option value="">Mois</option>
                              {referenceSourceColumns.map((sc) => (
                                <option key={sc.index} value={sc.label}>
                                  {sc.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={rule.anneeSourceColumnLabel ?? ''}
                              onChange={(e) =>
                                onUpdateRule(col.index, {
                                  anneeSourceColumnLabel: e.target.value || null,
                                })
                              }
                              className="flex-1 px-1 py-1 border rounded text-xs"
                            >
                              <option value="">Année</option>
                              {referenceSourceColumns.map((sc) => (
                                <option key={sc.index} value={sc.label}>
                                  {sc.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {(rule.mode === 'source_mois' || rule.mode === 'source_annee') && (
                          <select
                            value={
                              rule.moisSourceColumnLabel ??
                              rule.anneeSourceColumnLabel ??
                              rule.sourceColumnLabel ??
                              ''
                            }
                            onChange={(e) => {
                              const label = e.target.value || null
                              onUpdateRule(col.index, {
                                sourceColumnLabel: label,
                                moisSourceColumnLabel:
                                  rule.mode === 'source_mois' ? label : rule.moisSourceColumnLabel,
                                anneeSourceColumnLabel:
                                  rule.mode === 'source_annee' ? label : rule.anneeSourceColumnLabel,
                              })
                            }}
                            className="w-full px-2 py-1 border rounded-lg text-xs"
                          >
                            <option value="">Colonne…</option>
                            {referenceSourceColumns.map((sc) => (
                              <option key={sc.index} value={sc.label}>
                                {sc.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {category === 'calcul' && (
                      <select
                        value={rule.mode}
                        onChange={(e) =>
                          onUpdateRule(col.index, { mode: e.target.value as CanevasFillMode })
                        }
                        className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                      >
                        {MODES_BY_CATEGORY.calcul.map((m) => (
                          <option key={m} value={m}>
                            {getFillModeLabel(m)}
                          </option>
                        ))}
                      </select>
                    )}

                    {category === 'app' && (
                      <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-100">
                        Données COP — disponible prochainement (candidatures, notes…)
                      </p>
                    )}
                  </div>

                  <div className="text-sm truncate">
                    <span
                      className={
                        preview.status === 'ok'
                          ? 'text-gray-900 font-medium'
                          : preview.status === 'empty'
                            ? 'text-amber-600'
                            : 'text-gray-400 italic'
                      }
                    >
                      {preview.value}
                    </span>
                  </div>

                  <div className="flex justify-center">
                    {preview.status === 'ok' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" title="Prêt" />
                    ) : preview.status === 'empty' ? (
                      <AlertCircle className="w-5 h-5 text-amber-500" title="À compléter" />
                    ) : (
                      <CircleDashed className="w-5 h-5 text-gray-300" title="En attente" />
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
