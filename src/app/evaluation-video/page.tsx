'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  PlayCircle,
  User,
} from 'lucide-react'
import { filiereLabel } from '@/lib/videoPreselectionConstants'
import {
  emptyGrilleObservations,
  emptyGrilleScores,
} from '@/lib/videoEvaluationGrid'
import FormateurLoginScreen from '@/components/video/FormateurLoginScreen'
import VideoPortalLayout from '@/components/video/VideoPortalLayout'
import EvaluationGridForm from '@/components/video/EvaluationGridForm'

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
  const [scores, setScores] = useState(emptyGrilleScores)
  const [observations, setObservations] = useState(emptyGrilleObservations)
  const [commentaire, setCommentaire] = useState('')
  const [evalLoading, setEvalLoading] = useState(false)
  const [evalSuccess, setEvalSuccess] = useState('')
  const [pageError, setPageError] = useState('')

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
    setScores(emptyGrilleScores())
    setObservations(emptyGrilleObservations())
    setCommentaire('')
    setEvalSuccess('')
    setPageError('')
    const res = await fetch(`/api/videos/stream/${id}`)
    const json = await res.json()
    if (res.ok) setStreamUrl(json.url)
    else setPageError(json.error || 'Lecture impossible')
  }

  const submitEvaluation = async () => {
    if (!selectedId) return
    setEvalLoading(true)
    setEvalSuccess('')
    setPageError('')
    try {
      const res = await fetch('/api/videos/formateur/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedId,
          commentaire,
          grille: { scores, observations },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setEvalSuccess(json.message || 'Évaluation enregistrée.')
      setSelectedId(null)
      setStreamUrl(null)
      await loadVideos()
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setEvalLoading(false)
    }
  }

  if (authenticated === null) {
    return (
      <VideoPortalLayout showHero={false}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-10 h-10 animate-spin text-white/80" />
        </div>
      </VideoPortalLayout>
    )
  }

  if (!authenticated) {
    return (
      <FormateurLoginScreen
        login={login}
        password={password}
        loginError={loginError}
        loginLoading={loginLoading}
        onLoginChange={setLogin}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    )
  }

  const current = videos.find((v) => v.id === selectedId)

  return (
    <VideoPortalLayout
      variant="formateur"
      wide
      badge="Portail formateur"
      title="Évaluation des vidéos présentatives"
      subtitle={`${formateur?.nom} — ${filiereLabel(formateur?.filiere ?? '')}`}
      footer={
        <p className="inline-flex items-center gap-2 text-xs text-blue-100/70">
          Grille officielle — contenu /20 + forme /10 = total /30
        </p>
      }
    >
      <div className="flex justify-end mb-5">
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-white flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-lg transition-all"
        >
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 xl:gap-6">
        <aside className={`${selectedId ? 'xl:col-span-3' : 'xl:col-span-4'}`}>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl shadow-black/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#0f3d6c]" />
                À évaluer ({videos.length})
              </h2>
            </div>
            <div className={`p-3 space-y-2 overflow-auto ${selectedId ? 'max-h-[280px] xl:max-h-[calc(100vh-12rem)]' : 'max-h-[520px]'}`}>
              {videos.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 text-center">
                  Aucune vidéo affectée pour le moment.
                </p>
              ) : (
                videos.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => void openVideo(v.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedId === v.id
                        ? 'border-[#0f3d6c] bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium text-slate-900">
                      {v.prenom} {v.nom}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{v.cine}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className={`${selectedId ? 'xl:col-span-9' : 'xl:col-span-8'}`}>
          {!selectedId ? (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl shadow-black/20 p-12 text-center">
              <PlayCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Sélectionnez une vidéo dans la liste pour commencer l&apos;évaluation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
              {/* Vidéo fixe à gauche pendant la notation */}
              <div className="lg:col-span-2 lg:sticky lg:top-4 z-10">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl shadow-black/20 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#0f3d6c]/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-[#0f3d6c]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {current?.prenom} {current?.nom}
                      </h3>
                      <p className="text-xs text-slate-500">{current?.cine}</p>
                    </div>
                  </div>
                  {streamUrl ? (
                    <video
                      src={streamUrl}
                      controls
                      className="w-full rounded-xl bg-black aspect-video shadow-inner"
                    />
                  ) : (
                    <div className="flex justify-center items-center aspect-video bg-slate-100 rounded-xl">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    La vidéo reste visible pendant que vous remplissez la grille →
                  </p>
                </div>
              </div>

              {/* Grille défilante à droite */}
              <div className="lg:col-span-3 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl shadow-black/20 p-5 max-h-none lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
                <EvaluationGridForm
                  scores={scores}
                  observations={observations}
                  disabled={evalLoading}
                  onScoreChange={(id, value) =>
                    setScores((prev) => ({ ...prev, [id]: value }))
                  }
                  onObservationChange={(id, value) =>
                    setObservations((prev) => ({ ...prev, [id]: value }))
                  }
                />

                <div className="mt-5">
                  <label className="text-sm font-medium text-slate-800 mb-2 block">
                    Appréciation globale (obligatoire)
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    disabled={evalLoading}
                    placeholder="Synthèse de votre évaluation, points forts et axes d'amélioration…"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f3d6c]/20 focus:border-[#0f3d6c] disabled:bg-slate-50"
                  />
                </div>

                {pageError && (
                  <p className="text-sm text-red-600 mt-3 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {pageError}
                  </p>
                )}
                {evalSuccess && (
                  <p className="text-sm text-green-700 mt-3 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {evalSuccess}
                  </p>
                )}

                <button
                  type="button"
                  disabled={evalLoading || !commentaire.trim()}
                  onClick={() => void submitEvaluation()}
                  className="mt-4 w-full bg-[#0f3d6c] text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-[#0d3359] sticky bottom-0"
                >
                  {evalLoading ? 'Enregistrement…' : 'Enregistrer l\'évaluation'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </VideoPortalLayout>
  )
}
