'use client'

import { useState } from 'react'
import { HardDrive, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Apercu = {
  demandesTerminees: number
  cvALiberer: number
  fichiersUniques: number
}

export function LibererStockageCvTerminees() {
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
      const res = await fetch('/api/admin/liberer-cv-terminees/', {
        headers: { Authorization: `Bearer ${await token()}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setApercu({
        demandesTerminees: data.demandesTerminees,
        cvALiberer: data.cvALiberer,
        fichiersUniques: data.fichiersUniques,
      })
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const executer = async () => {
    if (confirm !== 'LIBERER') {
      setErreur('Tapez LIBERER pour confirmer.')
      return
    }
    if (
      !window.confirm(
        'Supprimer uniquement les PDF des demandes TERMINÉES ? Les fiches (noms, statuts, tri) restent. Les CV en attente / en cours ne sont pas touchés.'
      )
    ) {
      return
    }
    setLoading(true)
    setErreur(null)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/liberer-cv-terminees/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await token()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: 'LIBERER' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setMessage(
        `${data.fichiersSupprimes} fichier(s) PDF retirés. ${data.fichesConservees} fiche(s) candidature conservées. Demandes terminées : ${data.demandesTerminees}.`
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
    <div className="mt-10 max-w-xl rounded-xl border border-amber-200 bg-amber-50/60 p-6">
      <div className="flex items-start gap-3">
        <HardDrive className="w-6 h-6 text-amber-800 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Libérer le stockage CV</h3>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            Enlève les <strong>PDF</strong> des candidatures liées aux demandes au statut{' '}
            <strong>terminée</strong>. Les fiches restent consultables. Les demandes{' '}
            <strong>en attente</strong> et <strong>en cours</strong> gardent leurs CV.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void chargerApercu()}
        disabled={loading}
        className="mt-4 px-4 py-2 text-sm font-medium rounded-lg border border-amber-300 bg-white text-amber-900 hover:bg-amber-50 disabled:opacity-50"
      >
        {loading ? 'Calcul…' : 'Voir combien de fichiers seraient libérés'}
      </button>

      {apercu && (
        <div className="mt-4 text-sm text-gray-800 space-y-1">
          <p>Demandes terminées : <strong>{apercu.demandesTerminees}</strong></p>
          <p>Candidatures avec PDF : <strong>{apercu.cvALiberer}</strong></p>
          <p>Fichiers uniques dans Storage : <strong>{apercu.fichiersUniques}</strong></p>
          <label className="block mt-3 text-xs font-semibold text-gray-600">
            Tapez LIBERER pour confirmer
          </label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={() => void executer()}
            disabled={loading || confirm !== 'LIBERER'}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 text-white text-sm font-semibold hover:bg-red-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Libérer les PDF des demandes terminées
          </button>
        </div>
      )}

      {message && <p className="mt-3 text-sm text-green-800">{message}</p>}
      {erreur && <p className="mt-3 text-sm text-red-700">{erreur}</p>}
    </div>
  )
}
