'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Video,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  IdCard,
  GraduationCap,
} from 'lucide-react'
import {
  VIDEO_FILIERES,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_DURATION_SEC,
  type VideoFiliereId,
} from '@/lib/videoPreselectionConstants'

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
    try {
      const fd = new FormData()
      fd.append('nom', nom.trim())
      fd.append('prenom', prenom.trim())
      fd.append('cine', cine.trim())
      fd.append('filiere', filiere)
      fd.append('video', videoFile)

      const res = await fetch('/api/videos/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Erreur lors du dépôt.')
      }
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f3d6c] to-[#1a5a96] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vidéo enregistrée</h1>
          <p className="text-gray-600">
            Merci {prenom} {nom}. Votre vidéo de présentation a bien été reçue. Elle sera
            évaluée par nos formateurs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f3d6c] to-[#1a5a96] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center text-white mb-8">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h1 className="text-2xl font-bold">Vidéo de présentation</h1>
          <p className="text-blue-100 mt-2 text-sm">
            Pré-sélection — 2 minutes maximum — 1 dépôt par CINE
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-6 space-y-5"
        >
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4" /> Nom
            </label>
            <input
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4" /> Prénom
            </label>
            <input
              required
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <IdCard className="w-4 h-4" /> CINE
            </label>
            <input
              required
              value={cine}
              onChange={(e) => setCine(e.target.value.toUpperCase())}
              placeholder="Ex : AB123456"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 uppercase"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <GraduationCap className="w-4 h-4" /> Filière
            </label>
            <select
              required
              value={filiere}
              onChange={(e) => setFiliere(e.target.value as VideoFiliereId)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">— Choisir —</option>
              {VIDEO_FILIERES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Vidéo (MP4, max 2 min, 50 Mo)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => void onPickVideo(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0f3d6c] transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              {videoFile ? (
                <span className="text-sm text-[#0f3d6c] font-medium">{videoFile.name}</span>
              ) : (
                <span className="text-sm text-gray-500">Cliquez pour choisir une vidéo</span>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#0f3d6c] text-white py-3 rounded-lg font-medium hover:bg-[#0d3359] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours…
              </>
            ) : (
              'Envoyer ma vidéo'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
