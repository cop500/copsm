'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Video,
  Users,
  UserPlus,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  RefreshCw,
  KeyRound,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  VIDEO_FILIERES,
  VIDEO_STATUTS,
  filiereLabel,
  type VideoFiliereId,
} from '@/lib/videoPreselectionConstants'
import type { GrilleEvaluationData } from '@/lib/videoEvaluationGrid'
import { computeVideoAdminStats, type VideoGrillePrintData } from '@/lib/videoAdminStats'
import VideoAdminDashboard from '@/components/video/VideoAdminDashboard'
import VideoGrilleDetailModal from '@/components/video/VideoGrilleDetailModal'

interface FormateurRow {
  id: string
  nom: string
  login: string
  filiere: string
  actif: boolean
}

interface VideoRow {
  id: string
  nom: string
  prenom: string
  cine: string
  filiere: string
  statut: string
  note: number | null
  commentaire: string | null
  grille_notes: GrilleEvaluationData | null
  evalue_le: string | null
  formateur_id: string | null
  formateurs_video: { nom: string } | null
  created_at: string
}

type AdminTab = 'videos' | 'affectation' | 'formateurs'

export default function VideoPreselectionModule() {
  const tokenRef = useRef<string | null>(null)
  const [tab, setTab] = useState<AdminTab>('videos')
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [formateurs, setFormateurs] = useState<FormateurRow[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [filiereFilter, setFiliereFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [assignFormateurId, setAssignFormateurId] = useState('')

  const [newNom, setNewNom] = useState('')
  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFiliere, setNewFiliere] = useState<VideoFiliereId | ''>('')
  const [grilleVideo, setGrilleVideo] = useState<VideoGrillePrintData | null>(null)

  const stats = useMemo(
    () => computeVideoAdminStats(videos, formateurs),
    [videos, formateurs]
  )

  const getAuthHeaders = useCallback(async () => {
    if (!tokenRef.current) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Session expirée — reconnectez-vous.')
      tokenRef.current = session.access_token
    }
    return {
      Authorization: `Bearer ${tokenRef.current}`,
      'Content-Type': 'application/json',
    }
  }, [])

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false
      if (!silent) setInitialLoading(true)
      else setRefreshing(true)
      setError('')
      try {
        const headers = await getAuthHeaders()
        const res = await fetch('/api/videos/admin', { headers })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Erreur chargement')
        setVideos(json.videos ?? [])
        setFormateurs(json.formateurs ?? [])
      } catch (e: unknown) {
        tokenRef.current = null
        setError(e instanceof Error ? e.message : 'Erreur')
      } finally {
        setInitialLoading(false)
        setRefreshing(false)
      }
    },
    [getAuthHeaders]
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(() => setSuccessMsg(''), 4000)
    return () => clearTimeout(t)
  }, [successMsg])

  const pendingVideos = useMemo(() => {
    return videos.filter(
      (v) =>
        v.statut === 'en_attente_affectation' &&
        (!filiereFilter || v.filiere === filiereFilter)
    )
  }, [videos, filiereFilter])

  const assignableFormateurs = useMemo(() => {
    return formateurs.filter(
      (f) => f.actif && (!filiereFilter || f.filiere === filiereFilter)
    )
  }, [formateurs, filiereFilter])

  const formateurVideoCounts = useMemo(() => {
    const map = new Map<string, { affectees: number; evaluees: number }>()
    for (const f of formateurs) {
      map.set(f.id, { affectees: 0, evaluees: 0 })
    }
    for (const v of videos) {
      if (!v.formateur_id) continue
      const entry = map.get(v.formateur_id)
      if (!entry) continue
      if (v.statut === 'affectee') entry.affectees++
      if (v.statut === 'evaluee') entry.evaluees++
    }
    return map
  }, [videos, formateurs])

  const canCreateFormateur =
    newNom.trim().length > 0 &&
    newLogin.trim().length > 0 &&
    newPassword.length >= 6 &&
    !!newFiliere

  const canAssign = assignFormateurId.length > 0 && selectedIds.size > 0

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingVideos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingVideos.map((v) => v.id)))
    }
  }

  const assignSelected = async () => {
    if (!canAssign) return
    setActionLoading('assign')
    setError('')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/videos/admin', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'assign_videos',
          videoIds: Array.from(selectedIds),
          formateurId: assignFormateurId,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      const formateur = formateurs.find((f) => f.id === assignFormateurId)
      const ids = new Set(selectedIds)
      setVideos((prev) =>
        prev.map((v) =>
          ids.has(v.id)
            ? {
                ...v,
                statut: 'affectee',
                formateur_id: assignFormateurId,
                formateurs_video: formateur ? { nom: formateur.nom } : null,
              }
            : v
        )
      )
      setSelectedIds(new Set())
      setSuccessMsg(`${json.assigned} vidéo(s) affectée(s).`)
      void load({ silent: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const createFormateur = async () => {
    if (!canCreateFormateur) {
      setError('Remplissez tous les champs (mot de passe min. 6 caractères).')
      return
    }
    setActionLoading('create')
    setError('')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/videos/admin', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'create_formateur',
          nom: newNom.trim(),
          login: newLogin.trim(),
          password: newPassword,
          filiere: newFiliere,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      if (json.formateur) {
        setFormateurs((prev) => [...prev, json.formateur as FormateurRow])
      }
      setNewNom('')
      setNewLogin('')
      setNewPassword('')
      setNewFiliere('')
      setSuccessMsg(`Formateur créé — login : ${json.formateur?.login ?? newLogin}`)
      void load({ silent: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const exportExcel = async () => {
    setActionLoading('export')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/videos/admin?export=excel', { headers })
      if (!res.ok) throw new Error('Export impossible')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `videos_preselection_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const resetFormateurPassword = async (id: string, nom: string) => {
    const password = prompt(`Nouveau mot de passe pour ${nom} (min. 6 caractères) :`)
    if (!password) return
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    setActionLoading(`pwd-${id}`)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/videos/admin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'reset_formateur_password', id, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setSuccessMsg(json.message || 'Mot de passe mis à jour.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteFormateur = async (id: string, nom: string) => {
    if (
      !confirm(
        `Supprimer le formateur « ${nom} » ?\n\nImpossible s'il a des vidéos encore en cours d'évaluation.`
      )
    ) {
      return
    }
    setActionLoading(`del-${id}`)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/videos/admin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'delete_formateur', id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setFormateurs((prev) => prev.filter((f) => f.id !== id))
      setSuccessMsg(json.message || 'Formateur supprimé.')
      void load({ silent: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const openGrille = (v: VideoRow) => {
    setGrilleVideo({
      id: v.id,
      nom: v.nom,
      prenom: v.prenom,
      cine: v.cine,
      filiere: v.filiere,
      filiereLabel: filiereLabel(v.filiere),
      note: v.note,
      commentaire: v.commentaire,
      grille_notes: v.grille_notes,
      evalue_le: v.evalue_le,
      formateurNom: v.formateurs_video?.nom ?? null,
    })
  }

  const purgeEvaluated = async () => {
    if (!confirm('Supprimer les fichiers vidéo déjà évalués du stockage ? Les notes restent en base.'))
      return
    setActionLoading('purge')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/videos/admin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'purge_evaluated' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setSuccessMsg(json.message || 'Purge terminée.')
      void load({ silent: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/video-presentation`
      : '/video-presentation'

  if (initialLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Video className="w-8 h-8 text-violet-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Présélection vidéo</h2>
              <p className="text-sm text-gray-600 mt-1">
                Phase test Supabase — migration Drive OFPPT prévue ensuite.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {refreshing && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Sync…
              </span>
            )}
            <button
              type="button"
              onClick={() => void load({ silent: true })}
              disabled={refreshing}
              className="text-sm px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <a
              href="/video-presentation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <LinkIcon className="w-4 h-4" /> Lien candidat
            </a>
            <a
              href="/evaluation-video"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <LinkIcon className="w-4 h-4" /> Portail formateur
            </a>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 break-all">URL candidats : {publicUrl}</p>
      </div>

      <VideoAdminDashboard stats={stats} />

      {successMsg && (
        <div className="text-green-800 bg-green-50 border border-green-100 rounded-lg p-3 text-sm flex gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button type="button" onClick={() => setError('')} className="ml-auto text-xs underline">
            Fermer
          </button>
        </div>
      )}

      {grilleVideo && (
        <VideoGrilleDetailModal video={grilleVideo} onClose={() => setGrilleVideo(null)} />
      )}

      <div className="flex gap-2 border-b">
        {(
          [
            ['videos', 'Vidéos & notes'],
            ['affectation', 'Affectation'],
            ['formateurs', 'Formateurs'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === id
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'videos' ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-4 flex flex-wrap gap-2 justify-end border-b">
            <a
              href="/docs/grille-evaluation-videos.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 border rounded-lg flex items-center gap-1 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> Grille PDF
            </a>
            <button
              type="button"
              disabled={actionLoading === 'export'}
              onClick={() => void exportExcel()}
              className="text-sm px-3 py-1.5 bg-violet-600 text-white rounded-lg flex items-center gap-1 disabled:opacity-50"
            >
              {actionLoading === 'export' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export Excel
            </button>
            <button
              type="button"
              disabled={actionLoading === 'purge'}
              onClick={() => void purgeEvaluated()}
              className="text-sm px-3 py-1.5 border border-red-200 text-red-700 rounded-lg flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> Purger fichiers évalués
            </button>
          </div>
          <div className="overflow-auto max-h-[520px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-3">Candidat</th>
                  <th className="text-left p-3">CINE</th>
                  <th className="text-left p-3">Filière</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-left p-3">Note</th>
                  <th className="text-left p-3">Détail</th>
                  <th className="text-left p-3">Formateur</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      {v.prenom} {v.nom}
                    </td>
                    <td className="p-3">{v.cine}</td>
                    <td className="p-3">{filiereLabel(v.filiere)}</td>
                    <td className="p-3">
                      {VIDEO_STATUTS[v.statut as keyof typeof VIDEO_STATUTS] ?? v.statut}
                    </td>
                    <td className="p-3">
                      {v.note != null ? (
                        <div>
                          <span className="font-medium">{v.note}/30</span>
                          {v.grille_notes && (
                            <p className="text-xs text-gray-500">
                              C {v.grille_notes.note_contenu}/20 · F {v.grille_notes.note_forme}/10
                            </p>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3">
                      {v.statut === 'evaluee' && v.grille_notes ? (
                        <button
                          type="button"
                          onClick={() => openGrille(v)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Grille
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3">{v.formateurs_video?.nom ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'affectation' ? (
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Filtrer filière</label>
              <select
                value={filiereFilter}
                onChange={(e) => {
                  setFiliereFilter(e.target.value)
                  setSelectedIds(new Set())
                  setAssignFormateurId('')
                }}
                className="border rounded-lg px-3 py-2 text-sm min-w-[180px]"
              >
                <option value="">Toutes</option>
                {VIDEO_FILIERES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Affecter à</label>
              <select
                value={assignFormateurId}
                onChange={(e) => setAssignFormateurId(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm min-w-[220px]"
              >
                <option value="">— Choisir un formateur —</option>
                {assignableFormateurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom} ({filiereLabel(f.filiere)})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!canAssign || actionLoading === 'assign'}
              onClick={() => void assignSelected()}
              className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
            >
              {actionLoading === 'assign' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Affecter ({selectedIds.size})
            </button>
          </div>

          {!canAssign && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {!assignFormateurId && selectedIds.size === 0
                ? 'Cochez une ou plusieurs vidéos, puis choisissez un formateur.'
                : !assignFormateurId
                  ? 'Choisissez un formateur dans la liste.'
                  : 'Cochez au moins une vidéo à affecter.'}
            </p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {pendingVideos.length} vidéo(s) en attente
            </p>
            {pendingVideos.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-violet-600 hover:underline"
              >
                {selectedIds.size === pendingVideos.length ? 'Tout décocher' : 'Tout sélectionner'}
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[400px] overflow-auto">
            {pendingVideos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Aucune vidéo en attente d&apos;affectation.
              </p>
            ) : (
              pendingVideos.map((v) => (
                <label
                  key={v.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedIds.has(v.id)
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-violet-600"
                    checked={selectedIds.has(v.id)}
                    onChange={() => toggleSelect(v.id)}
                  />
                  <div>
                    <p className="font-medium">
                      {v.prenom} {v.nom} — {v.cine}
                    </p>
                    <p className="text-xs text-gray-500">{filiereLabel(v.filiere)}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Nouvel accès formateur
            </h3>
            <input
              placeholder="Nom complet"
              value={newNom}
              onChange={(e) => setNewNom(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Identifiant de connexion"
              value={newLogin}
              onChange={(e) => setNewLogin(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Mot de passe (6+ car.)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={newFiliere}
              onChange={(e) => setNewFiliere(e.target.value as VideoFiliereId)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— Filière —</option>
              {VIDEO_FILIERES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            {!canCreateFormateur && (
              <p className="text-xs text-gray-500">
                Remplissez nom, identifiant, mot de passe (6+) et filière.
              </p>
            )}
            <button
              type="button"
              disabled={!canCreateFormateur || actionLoading === 'create'}
              onClick={() => void createFormateur()}
              className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {actionLoading === 'create' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Créer l&apos;accès
            </button>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <Users className="w-4 h-4" /> Formateurs ({formateurs.length})
            </h3>
            <ul className="space-y-2 text-sm max-h-[420px] overflow-auto">
              {formateurs.length === 0 ? (
                <p className="text-gray-400 text-center py-6">Aucun formateur.</p>
              ) : (
                formateurs.map((f) => {
                  const counts = formateurVideoCounts.get(f.id) ?? {
                    affectees: 0,
                    evaluees: 0,
                  }
                  return (
                  <li key={f.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium">{f.nom}</p>
                        <p className="text-gray-500 text-xs">
                          {f.login} — {filiereLabel(f.filiere)}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-100">
                            <Video className="w-3 h-3" />
                            {counts.affectees} affectée{counts.affectees !== 1 ? 's' : ''}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-50 text-green-800 border border-green-100">
                            <CheckCircle2 className="w-3 h-3" />
                            {counts.evaluees} évaluée{counts.evaluees !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          f.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                        }`}
                      >
                        {f.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={actionLoading === `pwd-${f.id}`}
                        onClick={() => void resetFormateurPassword(f.id, f.nom)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Mot de passe
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === `del-${f.id}`}
                        onClick={() => void deleteFormateur(f.id, f.nom)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </button>
                    </div>
                  </li>
                  )
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
