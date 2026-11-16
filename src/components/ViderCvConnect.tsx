'use client'

import { useState } from 'react'
import { FileX, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Apercu = { soumissions: number; fichiers: number }

export function ViderCvConnect() {
  const [apercu, setApercu] = useState<Apercu | null>(null)
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const token = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ''
  }

  const chargerApercu = async () => {
    setErreur(null)
    setMessage(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/vider-cv-connect/', {
        headers: { Authorization: `Bearer ${await token()}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setApercu({ soumissions: data.soumissions, fichiers: data.fichiers })
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const executer = async () => {
    if (confirm !== 'VIDER_CV_CONNECT') {
      setErreur('Tapez VIDER_CV_CONNECT pour confirmer.')
      return
    }
    if (
      !window.confirm(
        'Supprimer tous les PDF du bucket CV Connect et toutes les fiches associées ? Cette action est irréversible.'
      )
    ) {
      return
    }
    setLoading(true)
    setErreur(null)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/vider-cv-connect/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await token()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: 'VIDER_CV_CONNECT' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setMessage(
        `${data.fichiersSupprimes} fichier(s) retirés. ${data.soumissions} fiche(s) CV Connect supprimées.`
      )
      setApercu(null)
      setConfirm('')
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 max-w-xl rounded-xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex items-start gap-3">
        <FileX className="w-6 h-6 text-slate-700 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Vider CV Connect</h3>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            Le dépôt public est fermé. Cette action retire les <strong>PDF</strong> du bucket{' '}
            <strong>cv-connect</strong> et les fiches associées, pour libérer le stockage.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void chargerApercu()}
        disabled={loading}
        className="mt-4 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-50"
      >
        {loading ? 'Calcul…' : 'Voir ce qui reste à supprimer'}
      </button>

      {apercu && (
        <div className="mt-4 text-sm text-gray-800 space-y-1">
          <p>Fiches en base : <strong>{apercu.soumissions}</strong></p>
          <p>Fichiers Storage : <strong>{apercu.fichiers}</strong></p>
          <label className="block mt-3 text-xs font-semibold text-gray-600">
            Tapez VIDER_CV_CONNECT pour confirmer
          </label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={() => void executer()}
            disabled={loading || confirm !== 'VIDER_CV_CONNECT'}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 text-white text-sm font-semibold hover:bg-red-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Vider CV Connect
          </button>
        </div>
      )}

      {message && <p className="mt-3 text-sm text-green-800">{message}</p>}
      {erreur && <p className="mt-3 text-sm text-red-700">{erreur}</p>}
    </div>
  )
}
