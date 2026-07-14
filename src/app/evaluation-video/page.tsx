'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Video,
  LogIn,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
} from 'lucide-react'
import { filiereLabel } from '@/lib/videoPreselectionConstants'

interface FormateurInfo {
  id: string
  nom: string
  filiere: string
}

interface VideoItem {
  id: string
  nom: string
  prenom: string
  cine: string
  filiere: string
  created_at: string
}

export default function EvaluationVideoPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [formateur, setFormateur] = useState<FormateurInfo | null>(null)
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [videos, setVideos] = useState<VideoItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [evalLoading, setEvalLoading] = useState(false)
  const [evalSuccess, setEvalSuccess] = useState('')

  const checkSession = useCallback(async () => {
    const res = await fetch('/api/videos/formateur/session')
    if (res.ok) {
      const json = await res.json()
      setAuthenticated(true)
      setFormateur(json.formateur)
      return true
    }
    setAuthenticated(false)
    return false
  }, [])

  const loadVideos = useCallback(async () => {
    const res = await fetch('/api/videos/formateur/videos')
    if (!res.ok) return
    const json = await res.json()
    setVideos(json.videos ?? [])
  }, [])

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  useEffect(() => {
    if (authenticated) void loadVideos()
  }, [authenticated, loadVideos])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch('/api/videos/formateur/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Connexion impossible')
      setAuthenticated(true)
      setFormateur(json.formateur)
      setPassword('')
      await loadVideos()
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/videos/formateur/session', { method: 'DELETE' })
    setAuthenticated(false)
    setFormateur(null)
    setVideos([])
    setSelectedId(null)
    setStreamUrl(null)
  }

  const openVideo = async (id: string) => {
    setSelectedId(id)
    setStreamUrl(null)
    setNote('')
    setCommentaire('')
    setEvalSuccess('')
    const res = await fetch(`/api/videos/stream/${id}`)
    const json = await res.json()
    if (res.ok) setStreamUrl(json.url)
    else setLoginError(json.error || 'Lecture impossible')
  }

  const submitEvaluation = async () => {
    if (!selectedId) return
    setEvalLoading(true)
    setEvalSuccess('')
    setLoginError('')
    try {
      const res = await fetch('/api/videos/formateur/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedId,
          note: Number(note),
          commentaire,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setEvalSuccess(json.message || 'Évaluation enregistrée.')
      setSelectedId(null)
      setStreamUrl(null)
      await loadVideos()
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setEvalLoading(false)
    }
  }

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f3d6c]" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f3d6c] to-[#1a5a96] flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-4"
        >
          <div className="text-center mb-2">
            <Video className="w-10 h-10 text-[#0f3d6c] mx-auto mb-2" />
            <h1 className="text-xl font-bold text-gray-900">Évaluation vidéo</h1>
            <p className="text-sm text-gray-500">Accès formateur</p>
          </div>
          <input
            required
            placeholder="Identifiant"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            autoComplete="username"
          />
          <input
            required
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            autoComplete="current-password"
          />
          {loginError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-[#0f3d6c] text-white py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Se connecter
          </button>
        </form>
      </div>
    )
  }

  const current = videos.find((v) => v.id === selectedId)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">Évaluation vidéo</h1>
          <p className="text-sm text-gray-500">
            {formateur?.nom} — {filiereLabel(formateur?.filiere ?? '')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-600 flex items-center gap-1 hover:text-gray-900"
        >
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <h2 className="font-medium text-gray-800 mb-2">
            À évaluer ({videos.length})
          </h2>
          {videos.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune vidéo affectée pour le moment.</p>
          ) : (
            videos.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => void openVideo(v.id)}
                className={`w-full text-left p-3 rounded-lg border ${
                  selectedId === v.id
                    ? 'border-[#0f3d6c] bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <p className="font-medium text-gray-900">
                  {v.prenom} {v.nom}
                </p>
                <p className="text-xs text-gray-500">{v.cine}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border p-4">
          {!selectedId ? (
            <p className="text-gray-500 text-center py-16">Sélectionnez une vidéo à gauche.</p>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {current?.prenom} {current?.nom} — {current?.cine}
              </h3>
              {streamUrl ? (
                <video src={streamUrl} controls className="w-full rounded-lg bg-black max-h-[360px]" />
              ) : (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium flex items-center gap-1 mb-1">
                  <Star className="w-4 h-4" /> Note /20
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Commentaire (obligatoire)</label>
                <textarea
                  required
                  rows={4}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}
              {evalSuccess && (
                <p className="text-sm text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {evalSuccess}
                </p>
              )}
              <button
                type="button"
                disabled={evalLoading || !commentaire.trim()}
                onClick={() => void submitEvaluation()}
                className="bg-[#0f3d6c] text-white px-6 py-2.5 rounded-lg disabled:opacity-50"
              >
                {evalLoading ? 'Enregistrement…' : 'Enregistrer l\'évaluation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
