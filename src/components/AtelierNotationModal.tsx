'use client'

import React, { useState } from 'react'
import { CheckCircle, Loader2, Star, X } from 'lucide-react'
import {
  CRITERES_ATELIER,
  NOTES_VIDES,
  type CritereAtelierKey,
  type NotesAtelier,
} from '@/lib/atelierEvaluation'

type Props = {
  atelierId: string
  atelierTitre: string
  onClose: () => void
}

function Stars({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5"
          aria-label={`${n} sur 5`}
        >
          <Star
            className={`w-6 h-6 ${
              n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export function AtelierNotationModal({ atelierId, atelierTitre, onClose }: Props) {
  const [etape, setEtape] = useState<'identite' | 'notes' | 'ok'>('identite')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState<NotesAtelier>({ ...NOTES_VIDES })
  const [commentaire, setCommentaire] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setNote = (key: CritereAtelierKey, n: number) => {
    setNotes((prev) => ({ ...prev, [key]: n }))
  }

  const post = async (action: 'verifier' | 'noter') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ateliers/evaluation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          atelier_id: atelierId,
          nom,
          email,
          notes: action === 'noter' ? notes : undefined,
          commentaire: action === 'noter' ? commentaire : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.')
        return false
      }
      return true
    } catch {
      setError('Connexion impossible. Réessayez.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const verifier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await post('verifier')) setEtape('notes')
  }

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (CRITERES_ATELIER.some(({ key }) => notes[key] < 1)) {
      setError('Merci de noter chaque critère de 1 à 5.')
      return
    }
    if (await post('noter')) setEtape('ok')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Noter l’atelier</h2>
            <p className="text-sm text-gray-600 mt-1">{atelierTitre}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {etape === 'ok' ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Merci pour votre avis</p>
              <p className="text-sm text-gray-600 mt-2">
                Votre notation aide le COP à mesurer l’impact des ateliers.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Fermer
              </button>
            </div>
          ) : etape === 'identite' ? (
            <form onSubmit={verifier} className="space-y-4">
              <p className="text-sm text-gray-600">
                Saisissez le nom et l’e-mail utilisés à l’inscription. La notation est ouverte
                uniquement si votre présence a été validée par l’animateur.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom et prénom</label>
                <input
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continuer
              </button>
            </form>
          ) : (
            <form onSubmit={envoyer} className="space-y-4">
              <p className="text-sm text-gray-600">Notez chaque critère de 1 (faible) à 5 (excellent).</p>
              {CRITERES_ATELIER.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-800">{label}</span>
                  <Stars value={notes[key]} onChange={(n) => setNote(key, n)} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire (facultatif)
                </label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEtape('identite')
                    setError(null)
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Envoyer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
