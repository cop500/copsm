'use client'

import React, { useMemo, useState } from 'react'
import { Copy, Loader2, X } from 'lucide-react'

type Profil = {
  poste_intitule?: string
  nb_profils?: number
}

type Props = {
  demande: {
    id: string
    entreprise_nom: string
    reference?: string
    profils?: Profil[] | unknown
  }
  onClose: () => void
  onConfirm: (nombreParProfil: number[]) => Promise<void>
}

function readProfils(profils: unknown): Profil[] {
  if (!profils) return []
  if (typeof profils === 'string') {
    try {
      const parsed = JSON.parse(profils)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(profils) ? profils : []
}

export function DupliquerDemandeModal({ demande, onClose, onConfirm }: Props) {
  const profils = useMemo(() => readProfils(demande.profils), [demande.profils])
  const [nombres, setNombres] = useState<number[]>(() =>
    profils.map((p) => Number(p.nb_profils) > 0 ? Number(p.nb_profils) : 1)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nombres.some((n) => !Number.isFinite(n) || n < 1)) {
      setError('Le nombre demandé doit être au moins 1 pour chaque profil.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onConfirm(nombres)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la duplication')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Dupliquer la demande</h3>
            <p className="text-sm text-gray-600">
              {demande.entreprise_nom}
              {demande.reference ? ` · ${demande.reference}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={saving}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <p className="text-sm text-gray-600">
            Une nouvelle demande sera créée (nouvelle référence, statut « En attente ») et une notification email sera envoyée. Ajustez le nombre demandé si besoin.
          </p>
          {profils.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Aucun profil sur cette demande. La copie reprendra les informations entreprise uniquement.
            </p>
          ) : (
            <div className="space-y-3">
              {profils.map((profil, index) => (
                <label key={index} className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-800">
                    {profil.poste_intitule || `Profil ${index + 1}`}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={nombres[index] ?? 1}
                    onChange={(e) => {
                      const next = [...nombres]
                      next[index] = parseInt(e.target.value, 10) || 0
                      setNombres(next)
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f3d6c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c3258] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Dupliquer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
