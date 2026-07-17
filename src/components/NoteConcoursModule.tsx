'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Upload,
  Download,
  Users,
  UserPlus,
  Loader2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Trash2,
  Link as LinkIcon,
  CheckCircle2,
  Search,
  FileSpreadsheet,
  PenLine,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { calcNote20From70, type AgentSaisieRow, type CandidatNotesRow } from '@/lib/notesConcoursConstants'
import { parseNotesConcoursWorkbook } from '@/lib/notesConcoursExcel'
import NoteAdminDashboard from '@/components/notes/NoteAdminDashboard'

async function readJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text()
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error(
      'Réponse serveur invalide lors de l\'import. Le fichier est peut-être trop volumineux — réduisez-le ou réessayez.'
    )
  }
}

type AdminTab = 'candidats' | 'agents' | 'import'

const PAGE_SIZE = 50

interface NoteConcoursModuleProps {
  isActive?: boolean
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

export default function NoteConcoursModule({ isActive = true }: NoteConcoursModuleProps) {
  const tokenRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasLoadedRef = useRef(false)
  const [tab, setTab] = useState<AdminTab>('candidats')
  const [candidats, setCandidats] = useState<CandidatNotesRow[]>([])
  const [agents, setAgents] = useState<AgentSaisieRow[]>([])
  const [filieres, setFilieres] = useState<string[]>([])
  const [stats, setStats] = useState({ total: 0, traites: 0, restants: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
  const [initialLoading, setInitialLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<'tous' | 'traites' | 'restants'>('tous')
  const [filterFiliere, setFilterFiliere] = useState('')
  const [filterAgent, setFilterAgent] = useState('')
  const [page, setPage] = useState(1)
  const [editNoteId, setEditNoteId] = useState<string | null>(null)
  const [editNote70, setEditNote70] = useState('')

  const [newNom, setNewNom] = useState('')
  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const fetchAbortRef = useRef<AbortController | null>(null)

  const getAuthHeaders = useCallback(async (json = true) => {
    const cached = tokenRef.current || readSupabaseAccessToken()
    if (cached) {
      tokenRef.current = cached
      const h: Record<string, string> = { Authorization: `Bearer ${cached}` }
      if (json) h['Content-Type'] = 'application/json'
      return h
    }

    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Session lente — réessayez ou reconnectez-vous.')), 8000)
    )
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])
    if (!session?.access_token) throw new Error('Session expirée — reconnectez-vous.')
    tokenRef.current = session.access_token
    const h: Record<string, string> = { Authorization: `Bearer ${session.access_token}` }
    if (json) h['Content-Type'] = 'application/json'
    return h
  }, [])

  const load = useCallback(
    async (opts?: { silent?: boolean; pageOverride?: number }) => {
      if (!isActive) return

      fetchAbortRef.current?.abort()
      const controller = new AbortController()
      fetchAbortRef.current = controller

      const silent = opts?.silent ?? false
      const currentPage = opts?.pageOverride ?? page

      if (!hasLoadedRef.current && !silent) setInitialLoading(true)
      else if (!silent) setTableLoading(true)
      else setRefreshing(true)
      setError('')

      try {
        const headers = await getAuthHeaders()
        if (controller.signal.aborted) return

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_SIZE),
          filter: filterStatut,
        })
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
        if (filterFiliere) params.set('filiere', filterFiliere)
        if (filterAgent) params.set('agent_id', filterAgent)

        const res = await fetch(`/api/notes/admin?${params}`, {
          headers,
          signal: controller.signal,
        })
        const json = await readJsonResponse(res)
        if (controller.signal.aborted) return
        if (!res.ok) throw new Error(String(json.error || 'Erreur chargement'))

        setCandidats((json.candidats as CandidatNotesRow[]) ?? [])
        setAgents((json.agents as AgentSaisieRow[]) ?? [])
        setFilieres((json.filieres as string[]) ?? [])
        setStats((json.stats as typeof stats) ?? { total: 0, traites: 0, restants: 0 })
        setPagination(
          (json.pagination as typeof pagination) ?? {
            page: 1,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 1,
          }
        )
        hasLoadedRef.current = true
      } catch (e: unknown) {
        if (controller.signal.aborted) return
        tokenRef.current = null
        setError(e instanceof Error ? e.message : 'Erreur')
      } finally {
        if (!controller.signal.aborted) {
          setInitialLoading(false)
          setTableLoading(false)
          setRefreshing(false)
        }
      }
    },
    [getAuthHeaders, page, filterStatut, filterFiliere, filterAgent, debouncedSearch, isActive]
  )

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!isActive) return
    void load({ silent: hasLoadedRef.current })
    return () => fetchAbortRef.current?.abort()
    // load recalculé volontairement quand page/filtre/recherche changent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, page, debouncedSearch, filterStatut, filterFiliere, filterAgent])

  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(() => setSuccessMsg(''), 4000)
    return () => clearTimeout(t)
  }, [successMsg])

  const postAction = async (body: Record<string, unknown>) => {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/notes/admin', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const json = await readJsonResponse(res)
    if (!res.ok) throw new Error(String(json.error || 'Erreur'))
    return json
  }

  const handleImport = async (file: File) => {
    setActionLoading('import')
    setError('')
    try {
      const buffer = await file.arrayBuffer()
      const { rows, errors: parseErrors } = parseNotesConcoursWorkbook(buffer)
      if (parseErrors.length && !rows.length) {
        throw new Error(parseErrors.join(' '))
      }

      const json = await postAction({ action: 'import_rows', rows })
      setSuccessMsg(String(json.message ?? 'Import réussi.'))
      const importErrors = json.errors as string[] | undefined
      if (importErrors?.length) setError(importErrors.slice(0, 3).join(' · '))
      setPage(1)
      setFilterFiliere('')
      setFilterAgent('')
      hasLoadedRef.current = false
      await load({ silent: false })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur import')
    } finally {
      setActionLoading(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExport = async () => {
    setActionLoading('export')
    try {
      const headers = await getAuthHeaders(false)
      const exportParams = new URLSearchParams({ export: 'excel' })
      if (filterFiliere) exportParams.set('filiere', filterFiliere)
      if (filterAgent) exportParams.set('agent_id', filterAgent)
      const res = await fetch(`/api/notes/admin?${exportParams}`, { headers })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Export échoué')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `notes_concours_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      setSuccessMsg('Export téléchargé.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur export')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateAgent = async () => {
    setActionLoading('create-agent')
    setError('')
    try {
      await postAction({
        action: 'create_agent',
        nom: newNom,
        login: newLogin,
        password: newPassword,
      })
      setNewNom('')
      setNewLogin('')
      setNewPassword('')
      setSuccessMsg('Agent créé.')
      await load({ silent: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleAgent = async (id: string, actif: boolean) => {
    setActionLoading(`toggle-${id}`)
    try {
      await postAction({ action: 'toggle_agent', id, actif: !actif })
      await load({ silent: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetPassword = async (id: string) => {
    const password = window.prompt('Nouveau mot de passe (min. 6 caractères) :')
    if (!password) return
    setActionLoading(`pwd-${id}`)
    try {
      await postAction({ action: 'reset_agent_password', id, password })
      setSuccessMsg('Mot de passe mis à jour.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAgent = async (id: string) => {
    if (!window.confirm('Supprimer cet agent ?')) return
    setActionLoading(`del-${id}`)
    try {
      await postAction({ action: 'delete_agent', id })
      setSuccessMsg('Agent supprimé.')
      await load({ silent: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveNote = async (id: string) => {
    setActionLoading(`note-${id}`)
    try {
      await postAction({
        action: 'update_note',
        id,
        note_70: editNote70 === '' ? null : Number(editNote70),
      })
      setEditNoteId(null)
      setEditNote70('')
      setSuccessMsg('Note enregistrée.')
      await load({ silent: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePurgeImport = async () => {
    if (stats.total === 0) {
      setError('Aucune donnée à supprimer.')
      return
    }
    if (
      !window.confirm(
        `Supprimer définitivement les ${stats.total} candidats importés (notes incluses) ?\n\nCette action est irréversible.`
      )
    ) {
      return
    }
    const confirmText = window.prompt('Tapez SUPPRIMER pour confirmer la suppression :')
    if (confirmText !== 'SUPPRIMER') return

    setActionLoading('purge')
    setError('')
    try {
      const json = await postAction({ action: 'purge_import' })
      setSuccessMsg(json.message ?? 'Données supprimées.')
      setPage(1)
      hasLoadedRef.current = false
      await load({ silent: false })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteCandidat = async (id: string, nom: string, prenom: string) => {
    if (!window.confirm(`Supprimer ${prenom} ${nom} de la liste ?`)) return
    setActionLoading(`del-candidat-${id}`)
    try {
      await postAction({ action: 'delete_candidat', id })
      setSuccessMsg('Candidat supprimé.')
      await load({ silent: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const agentsActifs = agents.filter((a) => a.actif).length
  const previewNote20 =
    editNote70 !== '' && !Number.isNaN(Number(editNote70))
      ? calcNote20From70(Number(editNote70))
      : null

  return (
    <div className="space-y-6">
      {(initialLoading || refreshing) && !error && (
        <div className="flex items-center gap-2 text-sm text-violet-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement des données…
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PenLine className="w-6 h-6 text-violet-600" />
            Module NOTE
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Import Excel, saisie par agents, export des résultats
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/saisie-notes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100"
          >
            <LinkIcon className="w-4 h-4" />
            Portail agents
          </a>
          <button
            type="button"
            onClick={() => void load({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={actionLoading === 'export' || candidats.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {actionLoading === 'export' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exporter Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <NoteAdminDashboard
        total={stats.total}
        traites={stats.traites}
        restants={stats.restants}
        agentsActifs={agentsActifs}
      />

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(
            [
              ['candidats', 'Candidats', FileSpreadsheet],
              ['import', 'Import', Upload],
              ['agents', 'Agents', Users],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center gap-2 ${
                tab === id
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'import' && (
        <div className="space-y-6 max-w-xl">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Importer un fichier Excel</h3>
            <p className="text-sm text-gray-600 mb-4">
              Colonnes attendues : DR, EFP, Niveau Formation, Nom, Prénom,
              id_InscriptionConcoursNational, CEF, Filière, etc.
              L&apos;import <strong>remplace entièrement</strong> la liste en base
              (les notes déjà saisies sont conservées pour les CEF identiques).
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleImport(f)
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={actionLoading === 'import'}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {actionLoading === 'import' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Choisir un fichier Excel
            </button>
          </div>

          <div className="bg-red-50 rounded-xl border border-red-200 p-6">
            <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Supprimer les données importées
            </h3>
            <p className="text-sm text-red-800 mb-4">
              Efface tous les candidats et notes en base ({stats.total} enregistrement
              {stats.total !== 1 ? 's' : ''}). Les comptes agents de saisie sont conservés.
            </p>
            <button
              type="button"
              onClick={() => void handlePurgeImport()}
              disabled={actionLoading === 'purge' || stats.total === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading === 'purge' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Supprimer tout le fichier importé
            </button>
          </div>
        </div>
      )}

      {tab === 'agents' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-violet-600" />
              Créer un agent de saisie
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                placeholder="Nom complet"
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                placeholder="Identifiant (login)"
                value={newLogin}
                onChange={(e) => setNewLogin(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="password"
                placeholder="Mot de passe (6+ car.)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
              <button
                type="button"
                onClick={() => void handleCreateAgent()}
                disabled={actionLoading === 'create-agent'}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {actionLoading === 'create-agent' ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">Nom</th>
                  <th className="text-left p-3">Login</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="p-3">{a.nom}</td>
                    <td className="p-3 font-mono text-xs">{a.login}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          a.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {a.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => void handleToggleAgent(a.id, a.actif)}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                      >
                        {a.actif ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleResetPassword(a.id)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                        title="Changer mot de passe"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteAgent(a.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!agents.length && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      Aucun agent — créez un compte pour permettre la saisie.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'candidats' && (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          <div className="bg-white rounded-xl border p-4 h-fit lg:sticky lg:top-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">Filtrer par filière</p>
            <p className="text-xs text-gray-500 mb-3">
              Sélectionnez une filière — seules les données associées s&apos;affichent.
            </p>
            <div className="max-h-56 overflow-y-auto border rounded-lg divide-y divide-gray-100">
              <button
                type="button"
                onClick={() => {
                  setFilterFiliere('')
                  setPage(1)
                }}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                  !filterFiliere
                    ? 'bg-violet-100 text-violet-800 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                Toutes les filières
              </button>
              {filieres.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFilterFiliere(f)
                    setPage(1)
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    filterFiliere === f
                      ? 'bg-violet-100 text-violet-800 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
              {!filieres.length && (
                <p className="px-3 py-4 text-xs text-gray-500">Aucune filière — importez un fichier.</p>
              )}
            </div>

            <p className="text-sm font-semibold text-gray-900 mb-1 mt-5">Filtrer par agent</p>
            <p className="text-xs text-gray-500 mb-3">
              Sélectionnez un agent — seules les saisies associées s&apos;affichent.
            </p>
            <div className="max-h-56 overflow-y-auto border rounded-lg divide-y divide-gray-100">
              <button
                type="button"
                onClick={() => {
                  setFilterAgent('')
                  setPage(1)
                }}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                  !filterAgent
                    ? 'bg-violet-100 text-violet-800 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                Tous les agents
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterAgent('none')
                  setPage(1)
                }}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                  filterAgent === 'none'
                    ? 'bg-violet-100 text-violet-800 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                Sans agent
              </button>
              {agents.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setFilterAgent(a.id)
                    setPage(1)
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    filterAgent === a.id
                      ? 'bg-violet-100 text-violet-800 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {a.nom}
                  {!a.actif && <span className="text-xs text-gray-400 ml-1">(inactif)</span>}
                </button>
              ))}
              {!agents.length && (
                <p className="px-3 py-4 text-xs text-gray-500">Aucun agent — créez un compte.</p>
              )}
            </div>
          </div>

          <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher CEF, nom, prénom…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-9 pr-3 py-2 border rounded-lg"
              />
            </div>
            <select
              value={filterStatut}
              onChange={(e) => {
                setFilterStatut(e.target.value as typeof filterStatut)
                setPage(1)
              }}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="tous">Tous</option>
              <option value="traites">Notes saisies</option>
              <option value="restants">Restants</option>
            </select>
          </div>

          {filterFiliere && (
            <p className="text-sm text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
              Filière active : <strong>{filterFiliere}</strong>
            </p>
          )}

          {filterAgent && (
            <p className="text-sm text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
              Agent actif :{' '}
              <strong>
                {filterAgent === 'none'
                  ? 'Sans agent'
                  : agents.find((a) => a.id === filterAgent)?.nom ?? 'Agent'}
              </strong>
            </p>
          )}

          <div className="bg-white rounded-xl border overflow-x-auto relative">
            {(tableLoading || refreshing) && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
              </div>
            )}
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">CEF</th>
                  <th className="text-left p-3">Nom</th>
                  <th className="text-left p-3">Prénom</th>
                  <th className="text-left p-3">Filière</th>
                  <th className="text-left p-3">Note /70</th>
                  <th className="text-left p-3">Note /20</th>
                  <th className="text-left p-3">Agent</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidats.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="p-3 font-mono text-xs">{c.cef}</td>
                    <td className="p-3">{c.nom}</td>
                    <td className="p-3">{c.prenom}</td>
                    <td className="p-3">{c.filiere ?? '—'}</td>
                    <td className="p-3">
                      {editNoteId === c.id ? (
                        <input
                          type="number"
                          min={0}
                          max={70}
                          step={0.01}
                          value={editNote70}
                          onChange={(e) => setEditNote70(e.target.value)}
                          className="w-20 px-2 py-1 border rounded"
                        />
                      ) : (
                        c.note_70 ?? '—'
                      )}
                    </td>
                    <td className="p-3">
                      {editNoteId === c.id && previewNote20 != null
                        ? previewNote20
                        : c.note_20 ?? '—'}
                    </td>
                    <td className="p-3 text-xs text-gray-600">
                      {c.agents_saisie_notes?.nom ?? '—'}
                    </td>
                    <td className="p-3 text-right">
                      {editNoteId === c.id ? (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => void handleSaveNote(c.id)}
                            className="px-2 py-1 text-xs bg-violet-600 text-white rounded"
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditNoteId(null)
                              setEditNote70('')
                            }}
                            className="px-2 py-1 text-xs border rounded"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditNoteId(c.id)
                              setEditNote70(c.note_70 != null ? String(c.note_70) : '')
                            }}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                          >
                            Modifier note
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteCandidat(c.id, c.nom, c.prenom)}
                            disabled={actionLoading === `del-candidat-${c.id}`}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!candidats.length && !tableLoading && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      {stats.total === 0
                        ? 'Aucun candidat — importez un fichier Excel.'
                        : 'Aucun résultat pour cette recherche.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-gray-600">
                Page {pagination.page} / {pagination.totalPages} — {pagination.total} candidat(s)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || tableLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages || tableLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  )
}
