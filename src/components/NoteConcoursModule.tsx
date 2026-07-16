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
import NoteAdminDashboard from '@/components/notes/NoteAdminDashboard'

type AdminTab = 'candidats' | 'agents' | 'import'

const PAGE_SIZE = 50

export default function NoteConcoursModule() {
  const tokenRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasLoadedRef = useRef(false)
  const [tab, setTab] = useState<AdminTab>('candidats')
  const [candidats, setCandidats] = useState<CandidatNotesRow[]>([])
  const [agents, setAgents] = useState<AgentSaisieRow[]>([])
  const [stats, setStats] = useState({ total: 0, traites: 0, restants: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
  const [initialLoading, setInitialLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<'tous' | 'traites' | 'restants'>('tous')
  const [page, setPage] = useState(1)
  const [editNoteId, setEditNoteId] = useState<string | null>(null)
  const [editNote70, setEditNote70] = useState('')

  const [newNom, setNewNom] = useState('')
  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const getAuthHeaders = useCallback(async (json = true) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!tokenRef.current) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) tokenRef.current = session.access_token
      }
      if (tokenRef.current) {
        const h: Record<string, string> = { Authorization: `Bearer ${tokenRef.current}` }
        if (json) h['Content-Type'] = 'application/json'
        return h
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 250))
    }
    throw new Error('Session expirée — reconnectez-vous.')
  }, [])

  const load = useCallback(
    async (opts?: { silent?: boolean; pageOverride?: number }) => {
      const silent = opts?.silent ?? false
      const currentPage = opts?.pageOverride ?? page
      if (!hasLoadedRef.current) setInitialLoading(true)
      else if (!silent) setTableLoading(true)
      else setRefreshing(true)
      setError('')
      try {
        const headers = await getAuthHeaders()
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_SIZE),
          filter: filterStatut,
        })
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
        const res = await fetch(`/api/notes/admin?${params}`, { headers })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Erreur chargement')
        setCandidats(json.candidats ?? [])
        setAgents(json.agents ?? [])
        setStats(json.stats ?? { total: 0, traites: 0, restants: 0 })
        setPagination(json.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
      } catch (e: unknown) {
        tokenRef.current = null
        setError(e instanceof Error ? e.message : 'Erreur')
      } finally {
        hasLoadedRef.current = true
        setInitialLoading(false)
        setTableLoading(false)
        setRefreshing(false)
      }
    },
    [getAuthHeaders, page, filterStatut, debouncedSearch]
  )

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterStatut])

  useEffect(() => {
    void load({ silent: hasLoadedRef.current, pageOverride: page })
  }, [page, debouncedSearch, filterStatut, load])

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
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erreur')
    return json
  }

  const handleImport = async (file: File) => {
    setActionLoading('import')
    setError('')
    try {
      const headers = await getAuthHeaders(false)
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/notes/admin/import', {
        method: 'POST',
        headers,
        body: form,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Import échoué')
      setSuccessMsg(json.message ?? 'Import réussi.')
      if (json.errors?.length) setError(json.errors.slice(0, 3).join(' · '))
      await load({ silent: true })
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
      const res = await fetch('/api/notes/admin?export=excel', { headers })
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

  const agentsActifs = agents.filter((a) => a.actif).length
  const previewNote20 =
    editNote70 !== '' && !Number.isNaN(Number(editNote70))
      ? calcNote20From70(Number(editNote70))
      : null

  if (initialLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-100 rounded-lg w-2/3" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PenLine className="w-6 h-6 text-violet-600" />
            Module NOTE — Concours national
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
        <div className="bg-white rounded-xl border p-6 max-w-xl">
          <h3 className="font-semibold text-gray-900 mb-2">Importer un fichier Excel</h3>
          <p className="text-sm text-gray-600 mb-4">
            Colonnes attendues : DR, EFP, Niveau Formation, Nom, Prénom,
            id_InscriptionConcoursNational, CEF, etc. Les notes déjà saisies par les agents
            sont conservées lors d&apos;un réimport.
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
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher CEF, nom, prénom…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg"
              />
            </div>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value as typeof filterStatut)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="tous">Tous</option>
              <option value="traites">Notes saisies</option>
              <option value="restants">Restants</option>
            </select>
          </div>

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
      )}
    </div>
  )
}
