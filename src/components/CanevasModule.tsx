'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Upload,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  Columns3,
  Plus,
  CheckCircle2,
  Download,
  Database,
  Save,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  parseCanevasHeaders,
  parseSourceExcel,
  type CanevasColumn,
} from '@/lib/canevasExcel'
import {
  DEFAULT_CANEVAS_PARAMETRES,
  generateCanevasRowsFromSources,
  downloadCanevasWithRules,
  suggestRuleForColumn,
  suggestRulesForCanevas,
  getFillModeLabel,
  needsAggregation,
  type CanevasColumnRule,
  type CanevasColumnWithRule,
  type CanevasParametres,
  type CanevasSourceFile,
} from '@/lib/canevasRules'
import CanevasFieldsPanel from '@/components/CanevasFieldsPanel'
import {
  applyRubriqueToCanevas,
  buildRubriqueFromState,
  countConfiguredFields,
  defaultModeForCategory,
  type CanevasRubrique,
  type CanevasSourceCategory,
} from '@/lib/canevasRubrique'

interface CanevasRow {
  id: string
  nom: string
  description: string | null
  fichier_source: string | null
  feuille_nom: string
  colonnes: CanevasColumnWithRule[]
  parametres?: CanevasParametres
  created_at: string
  updated_at: string
}

function readSupabaseAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('sb-') || !key.endsWith('-auth-token')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as { access_token?: string }
      if (parsed.access_token) return parsed.access_token
    }
  } catch {
    /* ignore */
  }
  return null
}

interface CanevasModuleProps {
  isActive?: boolean
}

export default function CanevasModule({ isActive = true }: CanevasModuleProps) {
  const tokenRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sourceFileInputRef = useRef<HTMLInputElement>(null)
  const previewBufferRef = useRef<ArrayBuffer | null>(null)
  const prevSelectedIdRef = useRef<string | null>(null)
  const lastRulesKeyRef = useRef<string>('')
  const [canevasList, setCanevasList] = useState<CanevasRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [newNom, setNewNom] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [previewColumns, setPreviewColumns] = useState<CanevasColumn[]>([])
  const [previewSheet, setPreviewSheet] = useState('')
  const [previewSheetNames, setPreviewSheetNames] = useState<string[]>([])
  const [previewFileName, setPreviewFileName] = useState('')
  const [previewHeaderRowIndex, setPreviewHeaderRowIndex] = useState<number | null>(null)
  const [previewDetectionMethod, setPreviewDetectionMethod] = useState<'table_header' | 'form_labels'>('table_header')
  const [previewTitleHint, setPreviewTitleHint] = useState('')

  const [sourceFiles, setSourceFiles] = useState<CanevasSourceFile[]>([])
  const [columnRules, setColumnRules] = useState<Record<number, CanevasColumnRule>>({})
  const [parametres, setParametres] = useState<CanevasParametres>(DEFAULT_CANEVAS_PARAMETRES)
  const [rulesDirty, setRulesDirty] = useState(false)
  const [rubriques, setRubriques] = useState<CanevasRubrique[]>([])
  const [selectedRubriqueId, setSelectedRubriqueId] = useState('')

  const selected = canevasList.find((c) => c.id === selectedId) ?? null
  const referenceSourceColumns = sourceFiles[0]?.columns ?? []
  const totalSourceRows = sourceFiles.reduce((n, f) => n + f.rows.length, 0)

  const getAuthHeaders = useCallback(async () => {
    const cached = tokenRef.current || readSupabaseAccessToken()
    if (cached) {
      tokenRef.current = cached
      return {
        Authorization: `Bearer ${cached}`,
        'Content-Type': 'application/json',
      }
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Session expirée — reconnectez-vous.')
    tokenRef.current = session.access_token
    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }, [])

  const load = useCallback(async () => {
    if (!isActive) return
    setLoading(true)
    setError('')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/admission/canevas', { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur chargement')
      const list = (json.canevas as CanevasRow[]) ?? []
      setCanevasList(list)
      setSelectedId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev
        return list[0]?.id ?? null
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, isActive])

  const loadRubriques = useCallback(async () => {
    if (!isActive) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/admission/canevas/rubriques', { headers })
      const json = await res.json()
      if (res.ok) setRubriques((json.rubriques as CanevasRubrique[]) ?? [])
    } catch {
      /* rubriques optionnelles si migration absente */
    }
  }, [getAuthHeaders, isActive])

  useEffect(() => {
    if (isActive) {
      void load()
      void loadRubriques()
    }
  }, [isActive, load, loadRubriques])

  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(() => setSuccessMsg(''), 4000)
    return () => clearTimeout(t)
  }, [successMsg])

  const resetSourceState = useCallback(() => {
    setSourceFiles([])
    if (sourceFileInputRef.current) sourceFileInputRef.current.value = ''
  }, [])

  const loadRulesFromCanevas = useCallback((canevas: CanevasRow, sources: CanevasColumn[] = []) => {
    const rules: Record<number, CanevasColumnRule> = {}
    for (const col of canevas.colonnes) {
      rules[col.index] = col.rule ?? suggestRuleForColumn(col.label)
    }
    if (sources.length) {
      const suggested = suggestRulesForCanevas(canevas.colonnes, sources)
      for (const col of canevas.colonnes) {
        if (!canevas.colonnes.find((c) => c.index === col.index)?.rule) {
          rules[col.index] = suggested[col.index]
        }
      }
    }
    setColumnRules(rules)
    setParametres(canevas.parametres ?? DEFAULT_CANEVAS_PARAMETRES)
    setRulesDirty(false)
  }, [])

  useEffect(() => {
    if (selectedId !== prevSelectedIdRef.current) {
      resetSourceState()
      prevSelectedIdRef.current = selectedId
      lastRulesKeyRef.current = ''
    }
    if (!selectedId) return
    const c = canevasList.find((x) => x.id === selectedId)
    if (!c) return
    const rulesKey = `${c.id}:${c.updated_at}:${c.colonnes.length}`
    if (lastRulesKeyRef.current === rulesKey) return
    lastRulesKeyRef.current = rulesKey
    loadRulesFromCanevas(c)
  }, [selectedId, canevasList, resetSourceState, loadRulesFromCanevas])

  const applyPreviewParse = useCallback((buffer: ArrayBuffer, sheetName?: string, headerRowIndex?: number) => {
    const parsed = parseCanevasHeaders(buffer, {
      sheetName,
      headerRowIndex,
    })
    if (parsed.errors.length && !parsed.columns.length) {
      throw new Error(parsed.errors.join(' '))
    }
    setPreviewColumns(parsed.columns)
    setPreviewSheet(parsed.sheetName)
    setPreviewSheetNames(parsed.sheetNames)
    setPreviewHeaderRowIndex(parsed.headerRowIndex >= 0 ? parsed.headerRowIndex : null)
    setPreviewDetectionMethod(parsed.detectionMethod)
    setPreviewTitleHint(parsed.titleHint ?? '')
    if (parsed.errors.length) setError(parsed.errors.join(' '))
    return parsed
  }, [])

  const handlePickFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setPreviewColumns([])
    setPreviewSheetNames([])
    setPreviewHeaderRowIndex(null)
    setPreviewTitleHint('')
    try {
      const buffer = await file.arrayBuffer()
      previewBufferRef.current = buffer
      applyPreviewParse(buffer)
      setPreviewFileName(file.name)
      if (!newNom.trim()) {
        setNewNom(file.name.replace(/\.(xlsx|xls|csv)$/i, ''))
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fichier illisible')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePreviewSheetChange = (sheetName: string) => {
    if (!previewBufferRef.current) return
    setError('')
    try {
      applyPreviewParse(previewBufferRef.current, sheetName)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analyse impossible')
    }
  }

  const handlePreviewHeaderRowChange = (rowIndex: number) => {
    if (!previewBufferRef.current || !previewSheet) return
    setError('')
    try {
      applyPreviewParse(previewBufferRef.current, previewSheet, rowIndex)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analyse impossible')
    }
  }

  const handleImport = async () => {
    if (!newNom.trim() || !previewColumns.length) return
    setActionLoading('import')
    setError('')
    try {
      const headers = await getAuthHeaders()
      const colonnesWithRules: CanevasColumnWithRule[] = previewColumns.map((col) => ({
        ...col,
        rule: suggestRuleForColumn(col.label),
      }))
      const res = await fetch('/api/admission/canevas', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nom: newNom.trim(),
          description: newDescription.trim() || undefined,
          fichier_source: previewFileName || undefined,
          feuille_nom: previewSheet || undefined,
          colonnes: colonnesWithRules,
          parametres: DEFAULT_CANEVAS_PARAMETRES,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Import impossible')
      setSuccessMsg(`Canevas « ${newNom.trim()} » enregistré (${previewColumns.length} colonnes).`)
      setNewNom('')
      setNewDescription('')
      setPreviewColumns([])
      setPreviewSheet('')
      setPreviewSheetNames([])
      setPreviewFileName('')
      setPreviewHeaderRowIndex(null)
      setPreviewTitleHint('')
      previewBufferRef.current = null
      await load()
      if (json.canevas?.id) setSelectedId(json.canevas.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePickSourceFiles = async (fileList: FileList | null) => {
    if (!fileList?.length || !selectedId) return
    const canevas = canevasList.find((c) => c.id === selectedId)
    if (!canevas) return
    setError('')

    const added: CanevasSourceFile[] = []
    const errors: string[] = []

    for (const file of Array.from(fileList)) {
      try {
        const buffer = await file.arrayBuffer()
        const { sheetName, columns, rows, errors: parseErrors } = parseSourceExcel(buffer)
        if (parseErrors.length && !columns.length) {
          errors.push(`${file.name} : ${parseErrors.join(' ')}`)
          continue
        }
        added.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          fileName: file.name,
          sheetName,
          columns,
          rows,
        })
        if (parseErrors.length) errors.push(`${file.name} : ${parseErrors.join(' ')}`)
      } catch {
        errors.push(`${file.name} : fichier illisible`)
      }
    }

    if (!added.length) {
      setError(errors.join(' ') || 'Aucun fichier source valide.')
      return
    }

    setSourceFiles((prev) => {
      const isFirst = prev.length === 0
      const next = [...prev, ...added]
      if (isFirst && added[0]) {
        const filiereCol = added[0].columns.find((c) => {
          const l = c.label.toLowerCase()
          return l.includes('filiere') || l.includes('filière')
        })
        if (filiereCol) {
          setParametres((p) => ({
            ...p,
            groupSourceColumnIndex: filiereCol.index,
            groupSourceColumnLabel: filiereCol.label,
          }))
        }
        setColumnRules(suggestRulesForCanevas(canevas.colonnes, added[0].columns))
        setRulesDirty(true)
      }
      return next
    })

    const totalLines = added.reduce((n, f) => n + f.rows.length, 0)
    setSuccessMsg(
      `${added.length} fichier${added.length > 1 ? 's' : ''} source ajouté${added.length > 1 ? 's' : ''} (${totalLines} ligne${totalLines > 1 ? 's' : ''}).`
    )
    if (errors.length) setError(errors.join(' '))
    if (sourceFileInputRef.current) sourceFileInputRef.current.value = ''
  }

  const handleRemoveSourceFile = (id: string, fileName: string) => {
    if (!confirm(`Supprimer le fichier source « ${fileName} » ?`)) return
    setSourceFiles((prev) => prev.filter((f) => f.id !== id))
    setSuccessMsg(`Fichier « ${fileName} » supprimé.`)
  }

  const handleClearSourceFiles = () => {
    if (!sourceFiles.length) return
    if (!confirm(`Supprimer les ${sourceFiles.length} fichier${sourceFiles.length > 1 ? 's' : ''} source ?`)) return
    resetSourceState()
    setSuccessMsg('Tous les fichiers sources ont été supprimés.')
  }

  const handleSaveRules = async () => {
    if (!selected) return
    setActionLoading('save-rules')
    setError('')
    try {
      const headers = await getAuthHeaders()
      const colonnes: CanevasColumnWithRule[] = selected.colonnes.map((col) => ({
        ...col,
        rule: columnRules[col.index],
      }))
      const res = await fetch('/api/admission/canevas', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          id: selected.id,
          colonnes,
          parametres,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Enregistrement impossible')
      setSuccessMsg('Règles et paramètres enregistrés.')
      setRulesDirty(false)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const updateRule = (colIndex: number, patch: Partial<CanevasColumnRule>) => {
    setColumnRules((prev) => ({
      ...prev,
      [colIndex]: { ...prev[colIndex], ...patch } as CanevasColumnRule,
    }))
    setRulesDirty(true)
  }

  const pickSourceColumn = (colIndex: number, label: string | null) => {
    const col = referenceSourceColumns.find((c) => c.label === label)
    updateRule(colIndex, {
      sourceColumnIndex: col?.index ?? null,
      sourceColumnLabel: label,
    })
  }

  const setFieldCategory = (colIndex: number, category: CanevasSourceCategory) => {
    const mode = defaultModeForCategory(category)
    const col = selected?.colonnes.find((c) => c.index === colIndex)
    const base = col ? suggestRuleForColumn(col.label) : { mode }
    updateRule(colIndex, { ...base, mode })
  }

  const handleApplyRubrique = () => {
    const rub = rubriques.find((r) => r.id === selectedRubriqueId)
    if (!rub || !selected) return
    const applied = applyRubriqueToCanevas(selected.colonnes, rub)
    setColumnRules(applied.rules)
    setParametres(applied.parametres)
    setRulesDirty(true)
    setSuccessMsg(`Rubrique « ${rub.nom} » appliquée.`)
  }

  const handleSaveRubrique = async () => {
    if (!selected) return
    const defaultName = selected.nom ? `Rubrique — ${selected.nom}` : 'Ma rubrique'
    const nom = prompt('Nom de la rubrique à enregistrer :', defaultName)?.trim()
    if (!nom) return
    setActionLoading('save-rubrique')
    setError('')
    try {
      const payload = buildRubriqueFromState(
        selected.colonnes,
        columnRules,
        parametres,
        nom
      )
      const headers = await getAuthHeaders()
      const res = await fetch('/api/admission/canevas/rubriques', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Enregistrement impossible')
      setSuccessMsg(`Rubrique « ${nom} » enregistrée.`)
      await loadRubriques()
      if (json.rubrique?.id) setSelectedRubriqueId(json.rubrique.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const handleParametresChange = (patch: Partial<CanevasParametres>) => {
    setParametres((prev) => ({ ...prev, ...patch }))
    setRulesDirty(true)
  }

  const generatedPreview =
    selected && sourceFiles.length
      ? generateCanevasRowsFromSources(sourceFiles, {
          columns: selected.colonnes,
          rules: columnRules,
          parametres,
        })
      : []

  const handleGenerateExcel = () => {
    if (!selected || !sourceFiles.length) return
    const rows = generateCanevasRowsFromSources(sourceFiles, {
      columns: selected.colonnes,
      rules: columnRules,
      parametres,
    })
    const safeName = selected.nom.replace(/[^\w\s-]/g, '').trim() || 'export'
    const date = new Date().toISOString().slice(0, 10)
    downloadCanevasWithRules(selected.colonnes, rows, `${safeName}_${date}.xlsx`, selected.feuille_nom || 'Export')
    setSuccessMsg(`Excel généré (${rows.length} ligne${rows.length > 1 ? 's' : ''} depuis ${sourceFiles.length} fichier${sourceFiles.length > 1 ? 's' : ''}).`)
  }

  const previewRows = generatedPreview.slice(0, 8)
  const fieldStats = selected
    ? countConfiguredFields(selected.colonnes, columnRules, parametres, sourceFiles)
    : { ok: 0, total: 0 }
  const useAgg = needsAggregation(columnRules)

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Supprimer le canevas « ${nom} » ?`)) return
    setActionLoading(`delete-${id}`)
    setError('')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/admission/canevas?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Suppression impossible')
      setSuccessMsg('Canevas supprimé.')
      if (selectedId === id) setSelectedId(null)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Liste des canevas */}
        <div className="bg-white rounded-xl border p-4 h-fit lg:sticky lg:top-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Mes canevas</h3>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto border rounded-lg divide-y divide-gray-100">
            {canevasList.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                  selectedId === c.id
                    ? 'bg-violet-100 text-violet-800 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="block truncate">{c.nom}</span>
                <span className="text-xs text-gray-500">
                  {c.colonnes?.length ?? 0} colonne{(c.colonnes?.length ?? 0) > 1 ? 's' : ''}
                </span>
              </button>
            ))}
            {!canevasList.length && !loading && (
              <p className="px-3 py-4 text-xs text-gray-500">Aucun canevas — importez un modèle Excel.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Import */}
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-violet-600" />
              <h3 className="font-semibold text-gray-900">Importer un canevas</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Importez n&apos;importe quel modèle Excel : l&apos;outil analyse l&apos;onglet, repère
              automatiquement la ligne d&apos;en-têtes (même avec un titre en haut) et propose les
              champs à remplir avec les règles COP déjà définies.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom du canevas *</label>
                <input
                  type="text"
                  value={newNom}
                  onChange={(e) => setNewNom(e.target.value)}
                  placeholder="Ex. Export administration 2026"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description (optionnel)</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Usage, destinataire…"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => void handlePickFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-800 rounded-lg text-sm hover:bg-violet-50"
              >
                <Upload className="w-4 h-4" />
                Choisir le fichier Excel
              </button>
              {previewFileName && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  {previewFileName}
                  {previewSheet && (
                    <span className="text-gray-400">· onglet {previewSheet}</span>
                  )}
                </span>
              )}
              <button
                type="button"
                disabled={!newNom.trim() || !previewColumns.length || actionLoading === 'import'}
                onClick={() => void handleImport()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 ml-auto"
              >
                {actionLoading === 'import' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Enregistrer le canevas
              </button>
            </div>

            {previewColumns.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-medium text-gray-500">
                    Aperçu — {previewColumns.length} champ{previewColumns.length > 1 ? 's' : ''} détecté
                    {previewColumns.length > 1 ? 's' : ''}
                    {previewDetectionMethod === 'table_header' && previewHeaderRowIndex != null && (
                      <span className="text-gray-400">
                        {' '}
                        · ligne d&apos;en-têtes {previewHeaderRowIndex + 1}
                      </span>
                    )}
                    {previewDetectionMethod === 'form_labels' && (
                      <span className="text-gray-400"> · libellés repérés dans le fichier</span>
                    )}
                  </p>
                  {previewSheetNames.length > 1 && (
                    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                      Onglet
                      <select
                        value={previewSheet}
                        onChange={(e) => handlePreviewSheetChange(e.target.value)}
                        className="px-2 py-1 border rounded-md text-xs"
                      >
                        {previewSheetNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {previewDetectionMethod === 'table_header' && previewHeaderRowIndex != null && (
                    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                      Ligne en-têtes
                      <select
                        value={previewHeaderRowIndex}
                        onChange={(e) => handlePreviewHeaderRowChange(Number(e.target.value))}
                        className="px-2 py-1 border rounded-md text-xs"
                      >
                        {Array.from({ length: 20 }, (_, i) => (
                          <option key={i} value={i}>
                            Ligne {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                {previewTitleHint && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
                    Titre ignoré : {previewTitleHint}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {previewColumns.map((col) => {
                    const rule = suggestRuleForColumn(col.label)
                    return (
                      <span
                        key={`preview-${col.index}-${col.label}`}
                        className="inline-flex flex-col gap-0.5 px-2 py-1.5 bg-gray-100 border rounded-md text-xs text-gray-800 max-w-xs"
                        title={getFillModeLabel(rule.mode)}
                      >
                        <span>
                          <span className="text-gray-400 font-mono">{col.index + 1}.</span> {col.label}
                        </span>
                        <span className="text-[10px] text-violet-700">{getFillModeLabel(rule.mode)}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Détail colonnes */}
          {selected ? (
            <div className="bg-white rounded-xl border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Columns3 className="w-5 h-5 text-violet-600" />
                    <h3 className="font-semibold text-gray-900">{selected.nom}</h3>
                  </div>
                  {selected.description && (
                    <p className="text-sm text-gray-600 mt-1">{selected.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {selected.fichier_source && <>Fichier : {selected.fichier_source} · </>}
                    Onglet : {selected.feuille_nom} · {selected.colonnes.length} colonnes
                  </p>
                </div>
                <button
                  type="button"
                  disabled={actionLoading === `delete-${selected.id}`}
                  onClick={() => void handleDelete(selected.id, selected.nom)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  {actionLoading === `delete-${selected.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Supprimer
                </button>
              </div>

              {/* Fichiers sources */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-gray-900">Fichiers sources</h4>
                  {sourceFiles.length > 0 && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {sourceFiles.length} fichier{sourceFiles.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Ajoutez un ou plusieurs fichiers Excel (un par promotion). Colonnes attendues :{' '}
                  <strong>MOIS</strong>, <strong>ANNEE</strong>, <strong>FILIERE</strong>, etc.
                </p>
                <div className="flex flex-wrap gap-3 items-center mb-3">
                  <input
                    ref={sourceFileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    multiple
                    className="hidden"
                    onChange={(e) => void handlePickSourceFiles(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => sourceFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-300 bg-white text-emerald-800 rounded-lg text-sm font-medium hover:bg-emerald-50"
                  >
                    <Upload className="w-4 h-4" />
                    Ajouter fichier(s) source
                  </button>
                  {sourceFiles.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleClearSourceFiles}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-300 bg-white rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Tout supprimer
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateExcel}
                        disabled={fieldStats.ok === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 ml-auto"
                      >
                        <Download className="w-4 h-4" />
                        Générer Excel rempli
                      </button>
                    </>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden bg-white">
                  <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-600">
                    <span>Fichier source</span>
                    <span className="pr-1">Supprimer</span>
                  </div>
                  {sourceFiles.length === 0 ? (
                    <p className="px-3 py-6 text-sm text-gray-500 text-center">
                      Aucun fichier source — cliquez sur « Ajouter fichier(s) source »
                    </p>
                  ) : (
                    <div className="divide-y">
                      {sourceFiles.map((sf) => (
                        <div
                          key={sf.id}
                          className="grid grid-cols-[1fr_auto] gap-3 items-center px-3 py-3"
                        >
                          <div className="flex items-center gap-2 text-sm min-w-0">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-medium truncate">{sf.fileName}</span>
                            <span className="text-gray-500 text-xs shrink-0">
                              {sf.rows.length} ligne{sf.rows.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSourceFile(sf.id, sf.fileName)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {sourceFiles.length > 0 && (
                    <p className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                      Total : {totalSourceRows} lignes
                    </p>
                  )}
                </div>
              </div>

              <CanevasFieldsPanel
                colonnes={selected.colonnes}
                columnRules={columnRules}
                parametres={parametres}
                sourceFiles={sourceFiles}
                referenceSourceColumns={referenceSourceColumns}
                rubriques={rubriques}
                selectedRubriqueId={selectedRubriqueId}
                onSelectRubrique={setSelectedRubriqueId}
                onApplyRubrique={handleApplyRubrique}
                onSaveRubrique={() => void handleSaveRubrique()}
                onUpdateRule={updateRule}
                onSetCategory={setFieldCategory}
                onPickSourceColumn={pickSourceColumn}
                onParametresChange={handleParametresChange}
                useAgg={useAgg}
              />

              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  disabled={!rulesDirty || actionLoading === 'save-rules'}
                  onClick={() => void handleSaveRules()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  {actionLoading === 'save-rules' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Enregistrer sur ce canevas
                </button>
              </div>

                {previewRows.length > 0 && (
                  <div className="overflow-x-auto border rounded-lg">
                    <p className="text-xs font-medium text-gray-500 px-3 py-2 bg-gray-50 border-b">
                      Aperçu généré ({useAgg ? 'par filière' : 'ligne à ligne'}, 8 premières lignes)
                    </p>
                    <table className="w-full text-xs min-w-[600px]">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {[...selected.colonnes]
                            .sort((a, b) => a.index - b.index)
                            .map((col) => (
                              <th key={col.index} className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">
                                {col.label}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, ri) => (
                          <tr key={ri} className="border-b last:border-0">
                            {row.map((val, ci) => (
                              <td key={ci} className="p-2 text-gray-800 whitespace-nowrap max-w-[180px] truncate">
                                {val == null ? '' : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          ) : (
            !loading && (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-500 text-sm">
                Sélectionnez un canevas dans la liste ou importez un nouveau modèle Excel.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
