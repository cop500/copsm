'use client'

import { useRef, useState } from 'react'
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  IdCard,
  GraduationCap,
  FileVideo,
  ArrowRight,
  Video,
} from 'lucide-react'
import {
  VIDEO_FILIERES,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_DURATION_SEC,
  type VideoFiliereId,
} from '@/lib/videoPreselectionConstants'
import {
  formatEta,
  formatUploadSpeed,
  uploadVideoToSignedUrl,
} from '@/lib/videoUploadClient'
import VideoPortalLayout from '@/components/video/VideoPortalLayout'
import CandidateGuide from '@/components/video/CandidateGuide'

type UploadPhase = 'idle' | 'preparing' | 'uploading' | 'finalizing'

async function parseApiJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text()
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    if (text.toLowerCase().includes('internal')) {
      throw new Error('Erreur serveur. Réessayez avec une vidéo plus légère (< 50 Mo).')
    }
    throw new Error(text.slice(0, 120) || 'Réponse serveur invalide.')
  }
}

function checkVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Fichier vidéo invalide ou non lisible.'))
    }
    video.src = URL.createObjectURL(file)
  })
}

function phaseLabel(phase: UploadPhase): string {
  switch (phase) {
    case 'preparing':
      return 'Préparation de l\'envoi…'
    case 'uploading':
      return 'Envoi de la vidéo…'
    case 'finalizing':
      return 'Finalisation…'
    default:
      return ''
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const inputClass =
  'w-full border border-slate-200/80 bg-white rounded-2xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f3d6c]/25 focus:border-[#0f3d6c]/40 disabled:bg-slate-50 transition-shadow'

export default function VideoPresentationPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [cine, setCine] = useState('')
  const [filiere, setFiliere] = useState<VideoFiliereId | ''>('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
  const [uploadPercent, setUploadPercent] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState(0)
  const [uploadEta, setUploadEta] = useState('')

  const onPickVideo = async (file: File | undefined) => {
    if (!file) return
    setError('')
    if (file.size > VIDEO_MAX_BYTES) {
      setError('Vidéo trop volumineuse (max 50 Mo en phase test).')
      return
    }
    try {
      const duration = await checkVideoDuration(file)
      if (duration > VIDEO_MAX_DURATION_SEC + 1) {
        setError(`Vidéo trop longue (${Math.round(duration)}s). Maximum : 2 minutes.`)
        return
      }
      setVideoFile(file)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Vidéo invalide.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!videoFile) {
      setError('Veuillez sélectionner une vidéo.')
      return
    }
    if (!filiere) {
      setError('Veuillez choisir une filière.')
      return
    }

    setSubmitting(true)
    setUploadPhase('preparing')
    setUploadPercent(2)
    setUploadSpeed(0)
    setUploadEta('')

    try {
      const mimeType = videoFile.type || 'video/mp4'

      const initRes = await fetch('/api/videos/upload-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          prenom: prenom.trim(),
          cine: cine.trim(),
          filiere,
          fileSize: videoFile.size,
          mimeType,
        }),
      })

      const initJson = await parseApiJson(initRes)
      if (!initRes.ok) {
        throw new Error(String(initJson.error || 'Erreur lors de la préparation.'))
      }

      setUploadPhase('uploading')
      setUploadPercent(5)

      await uploadVideoToSignedUrl(
        initJson.signedUrl as string,
        videoFile,
        mimeType,
        ({ percent, loaded, total, speedBps }) => {
          const mapped = 5 + Math.round(percent * 0.87)
          setUploadPercent(mapped)
          setUploadSpeed(speedBps)
          const remaining = total - loaded
          setUploadEta(formatEta(speedBps > 0 ? remaining / speedBps : 0))
        }
      )

      setUploadPhase('finalizing')
      setUploadPercent(95)

      const completeRes = await fetch('/api/videos/upload-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          prenom: prenom.trim(),
          cine: cine.trim(),
          filiere,
          storagePath: initJson.storagePath,
          completeToken: initJson.completeToken,
        }),
      })

      const completeJson = await parseApiJson(completeRes)
      if (!completeRes.ok) {
        throw new Error(String(completeJson.error || 'Erreur lors de l\'enregistrement.'))
      }

      setUploadPercent(100)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.')
    } finally {
      setSubmitting(false)
      setUploadPhase('idle')
    }
  }

  if (success) {
    return (
      <VideoPortalLayout
        variant="candidat"
        title="Vidéo enregistrée"
        subtitle="Votre candidature a bien été transmise."
      >
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl ring-4 ring-white/90">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/25 border border-white/60 px-8 pt-12 pb-8 text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Merci {prenom} {nom}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Votre vidéo de présentation a bien été reçue. Elle sera évaluée par nos formateurs
                selon la grille officielle OFPPT.
              </p>
            </div>
          </div>
        </div>
      </VideoPortalLayout>
    )
  }

  return (
    <VideoPortalLayout
      variant="candidat"
      badge="Dépôt candidat"
      title="Vidéo présentative"
      subtitle="Pré-sélection OFPPT — Présentez-vous en 2 minutes"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <CandidateGuide />
        </div>

        <div className="lg:col-span-3 relative">
          <div className="absolute -top-5 left-8 z-20 hidden sm:block">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a6bb5] to-[#0f3d6c] flex items-center justify-center shadow-xl shadow-blue-900/40 ring-4 ring-white/90">
              <Video className="w-5 h-5 text-white" />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/25 border border-white/60 p-6 sm:p-8 space-y-5"
          >
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-blue-50/80 to-transparent rounded-t-3xl pointer-events-none" />

            <div className="relative flex items-center gap-3 pb-1 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#0f3d6c]/10 flex items-center justify-center">
                <FileVideo className="w-5 h-5 text-[#0f3d6c]" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Formulaire de dépôt</h2>
                <p className="text-xs text-slate-500">Tous les champs sont obligatoires</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                  <User className="w-4 h-4 text-[#0f3d6c]/60" /> Nom
                </label>
                <input
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                  <User className="w-4 h-4 text-[#0f3d6c]/60" /> Prénom
                </label>
                <input
                  required
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <IdCard className="w-4 h-4 text-[#0f3d6c]/60" /> CINE
              </label>
              <input
                required
                value={cine}
                onChange={(e) => setCine(e.target.value.toUpperCase())}
                placeholder="Ex : AB123456"
                disabled={submitting}
                className={`${inputClass} uppercase`}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <GraduationCap className="w-4 h-4 text-[#0f3d6c]/60" /> Filière
              </label>
              <select
                required
                value={filiere}
                onChange={(e) => setFiliere(e.target.value as VideoFiliereId)}
                disabled={submitting}
                className={inputClass}
              >
                <option value="">— Choisir une filière —</option>
                {VIDEO_FILIERES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Vidéo (MP4, max 2 min, 50 Mo)
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                disabled={submitting}
                onChange={(e) => void onPickVideo(e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={submitting}
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#0f3d6c]/50 hover:bg-blue-50/40 transition-all disabled:opacity-60 group"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-[#0f3d6c] transition-colors" />
                {videoFile ? (
                  <div>
                    <span className="text-sm text-[#0f3d6c] font-medium block">{videoFile.name}</span>
                    <span className="text-xs text-slate-500">{formatFileSize(videoFile.size)}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">Cliquez pour choisir une vidéo</span>
                )}
              </button>
            </div>

            {submitting && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-[#0f3d6c]">
                  <span className="flex items-center gap-2 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {phaseLabel(uploadPhase)}
                  </span>
                  <span className="font-semibold">{uploadPercent}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-blue-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0f3d6c] to-[#1a5a96] transition-all duration-300 ease-out"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
                {uploadPhase === 'uploading' && (
                  <p className="text-xs text-blue-800">
                    {formatUploadSpeed(uploadSpeed)}
                    {uploadEta !== '—' ? ` · environ ${uploadEta} restantes` : ''}
                    {' · '}Ne fermez pas cette page.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-100 rounded-2xl p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#0f3d6c] to-[#1a5a96] text-white py-3.5 rounded-2xl font-semibold hover:from-[#0d3359] hover:to-[#164a7d] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#0f3d6c]/30 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours…
                </>
              ) : (
                <>
                  Envoyer ma vidéo
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </VideoPortalLayout>
  )
}
