'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  VIDEO_FILIERES,
  VIDEO_STATUTS,
  filiereLabel,
  type VideoFiliereId,
} from '@/lib/videoPreselectionConstants'

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
  formateur_id: string | null
  formateurs_video: { nom: string } | null
  created_at: string
}

type AdminTab = 'videos' | 'affectation' | 'formateurs'

export default function VideoPreselectionModule() {
  const [tab, setTab] = useState<AdminTab>('videos')
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [formateurs, setFormateurs] = useState<FormateurRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filiereFilter, setFiliereFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [assignFormateurId, setAssignFormateurId] = useState('')

  const [newNom, setNewNom] = useState('')
  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFiliere, setNewFiliere] = useState<VideoFiliereId | ''>('')

  const getAuthHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Session expirée')
    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/videos/admin', { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur chargement')
      setVideos(json.videos ?? [])
      setFormateurs(json.formateurs ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    void load()
  }, [load])

  const pendingVideos = useMemo(() => {
    return videos.filter(
      (v) =>
        v.statut === 'en_attente_affectation' &&
        (!filiereFilter || v.filiere === filiereFilter)
    )
  }, [videos, filiereFilter])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const assignSelected = async () => {
    if (!assignFormateurId || selectedIds.size === 0) return
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
      setSelectedIds(new Set())
      await load()
      alert(`${json.assigned} vidéo(s) affectée(s).`)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const createFormateur = async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/videos/admin', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'create_formateur',
          nom: newNom,
          login: newLogin,
          password: newPassword,
          filiere: newFiliere,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setNewNom('')
      setNewLogin('')
      setNewPassword('')
      setNewFiliere('')
      await load()
      alert(`Formateur créé. Login : ${json.formateur.login}`)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const exportExcel = async () => {
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
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const purgeEvaluated = async () => {
    if (!confirm('Supprimer les fichiers vidéo déjà évalués du stockage ? Les notes restent en base.'))
      return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/videos/admin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'purge_evaluated' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      alert(json.message || 'Terminé.')
      await load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/video-presentation`
      : '/video-presentation'

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
          <div className="flex flex-wrap gap-2">
            <a
              href="/video-presentation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <LinkIcon className="w-4 h-4" /> Lien public candidat
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
        <p className="text-xs text-gray-500 mt-3 break-all">
          URL candidats : {publicUrl}
        </p>
      </div>

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
                : 'border-transparent text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : tab === 'videos' ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-4 flex flex-wrap gap-2 justify-between border-b">
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm px-3 py-1.5 border rounded-lg flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <div className="flex gap-2">
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
                onClick={() => void exportExcel()}
                className="text-sm px-3 py-1.5 bg-violet-600 text-white rounded-lg flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Export Excel
              </button>
              <button
                type="button"
                onClick={() => void purgeEvaluated()}
                className="text-sm px-3 py-1.5 border border-red-200 text-red-700 rounded-lg flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Purger fichiers évalués
              </button>
            </div>
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
                    <td className="p-3">{v.note != null ? `${v.note}/30` : '—'}</td>
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
                onChange={(e) => setFiliereFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
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
                className="border rounded-lg px-3 py-2 text-sm min-w-[200px]"
              >
                <option value="">— Formateur —</option>
                {formateurs
                  .filter((f) => f.actif && (!filiereFilter || f.filiere === filiereFilter))
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom} ({filiereLabel(f.filiere)})
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!assignFormateurId || selectedIds.size === 0}
              onClick={() => void assignSelected()}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              Affecter ({selectedIds.size})
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {pendingVideos.length} vidéo(s) en attente d&apos;affectation
          </p>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {pendingVideos.map((v) => (
              <label
                key={v.id}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
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
            ))}
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
            <button
              type="button"
              onClick={() => void createFormateur()}
              className="w-full bg-violet-600 text-white py-2 rounded-lg text-sm"
            >
              Créer l&apos;accès
            </button>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <Users className="w-4 h-4" /> Formateurs ({formateurs.length})
            </h3>
            <ul className="space-y-2 text-sm max-h-[320px] overflow-auto">
              {formateurs.map((f) => (
                <li key={f.id} className="flex justify-between items-center border rounded-lg p-3">
                  <div>
                    <p className="font-medium">{f.nom}</p>
                    <p className="text-gray-500 text-xs">
                      {f.login} — {filiereLabel(f.filiere)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      f.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                    }`}
                  >
                    {f.actif ? 'Actif' : 'Inactif'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
