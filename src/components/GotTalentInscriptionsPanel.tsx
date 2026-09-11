'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatActiviteLabel, GotTalentActivite } from '@/lib/gotTalentConfig'
import * as XLSX from 'xlsx'
import {
  AlertCircle,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'

export interface GotTalentInscription {
  id: string
  nom: string
  prenom: string
  pole: string
  filliere: string
  groupe: string
  telephone: string
  email: string
  activites: GotTalentActivite[]
  consentement: boolean
  lieu_fait: string | null
  date_inscription: string
}

interface GotTalentInscriptionsPanelProps {
  poles: { id: string; nom: string; actif?: boolean }[]
  filieres: { id: string; nom: string; pole_id: string; actif?: boolean }[]
  isAdmin: boolean
}

export function GotTalentInscriptionsPanel({
  poles,
  filieres,
  isAdmin,
}: GotTalentInscriptionsPanelProps) {
  const [inscriptions, setInscriptions] = useState<GotTalentInscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [poleFilter, setPoleFilter] = useState('')
  const [filiereFilter, setFiliereFilter] = useState('')
  const [copied, setCopied] = useState(false)

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/got-talent`
      : 'https://copsm.space/got-talent'
  const ecranUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/got-talent/ecran`
      : 'https://copsm.space/got-talent/ecran'

  const loadInscriptions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('inscriptions_got_talent')
        .select('*')
        .order('date_inscription', { ascending: false })

      if (fetchError) throw fetchError
      setInscriptions((data ?? []) as GotTalentInscription[])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInscriptions()
  }, [loadInscriptions])

  const filieresFiltered = useMemo(() => {
    if (!poleFilter) return filieres.filter((f) => f.actif !== false)
    const pole = poles.find((p) => p.nom === poleFilter)
    return pole ? filieres.filter((f) => f.pole_id === pole.id && f.actif !== false) : []
  }, [poleFilter, poles, filieres])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return inscriptions.filter((row) => {
      if (poleFilter && row.pole !== poleFilter) return false
      if (filiereFilter && row.filliere !== filiereFilter) return false
      if (!q) return true
      const hay = [
        row.nom,
        row.prenom,
        row.email,
        row.telephone,
        row.groupe,
        row.pole,
        row.filliere,
        ...(row.activites ?? []).map(formatActiviteLabel),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [inscriptions, searchTerm, poleFilter, filiereFilter])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copiez le lien public :', publicUrl)
    }
  }

  const handleExportExcel = () => {
    if (filtered.length === 0) return
    const rows = filtered.map((row, index) => ({
      N: index + 1,
      Nom: row.nom,
      Prénom: row.prenom,
      Pôle: row.pole,
      Filière: row.filliere,
      Groupe: row.groupe,
      Téléphone: row.telephone,
      Email: row.email,
      'Activité 1': row.activites[0] ? formatActiviteLabel(row.activites[0]) : '',
      'Activité 2': row.activites[1] ? formatActiviteLabel(row.activites[1]) : '',
      'Fait à': row.lieu_fait ?? '',
      Date: new Date(row.date_inscription).toLocaleString('fr-FR'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Got Talent')
    XLSX.writeFile(wb, `Inscriptions_Got_Talent_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleDelete = async (id: string) => {
    if (!isAdmin) return
    if (!window.confirm('Supprimer cette inscription ?')) return
    const { error: deleteError } = await supabase
      .from('inscriptions_got_talent')
      .delete()
      .eq('id', id)
    if (deleteError) {
      alert(deleteError.message)
      return
    }
    await loadInscriptions()
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
        <p className="text-gray-500">Chargement des inscriptions Got Talent…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 font-medium mb-1">Impossible de charger les inscriptions</p>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <p className="text-xs text-gray-600">
          Exécutez la migration{' '}
          <code className="bg-white px-1 rounded">create_inscriptions_got_talent.sql</code> dans
          Supabase si la table n&apos;existe pas encore.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-[1px] shadow-lg">
        <div className="rounded-2xl bg-white p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-xl font-bold text-gray-900">Inscriptions OFPPT Got Talent</h3>
              </div>
              <p className="text-sm text-gray-600">
                Formulaire public — 1 inscription max par email ou téléphone, 2 activités max.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-700 max-w-full">
                <span className="truncate">{publicUrl}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2 text-sm"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copié !' : 'Copier le lien'}
              </button>
              <a
                href="/got-talent"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir
              </a>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(ecranUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  } catch {
                    window.prompt('Lien écran kiosque :', ecranUrl)
                  }
                }}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"
              >
                <Copy className="w-4 h-4" />
                Lien écran
              </button>
              <a
                href="/got-talent/ecran"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 flex items-center gap-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Écran
              </a>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={filtered.length === 0}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{inscriptions.length}</p>
            <p className="text-xs text-gray-500">Inscriptions totales</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 sm:col-span-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher nom, email, téléphone, activité…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <select
              value={poleFilter}
              onChange={(e) => {
                setPoleFilter(e.target.value)
                setFiliereFilter('')
              }}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Tous les pôles</option>
              {poles
                .filter((p) => p.actif !== false)
                .map((p) => (
                  <option key={p.id} value={p.nom}>
                    {p.nom}
                  </option>
                ))}
            </select>
            <select
              value={filiereFilter}
              onChange={(e) => setFiliereFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              disabled={!poleFilter}
            >
              <option value="">Toutes filières</option>
              {filieresFiltered.map((f) => (
                <option key={f.id} value={f.nom}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            Aucune inscription pour le moment
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">Stagiaire</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Pôle / Filière</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Groupe</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Contact</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Activités</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Date</th>
                  {isAdmin && <th className="p-3 w-10" />}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-amber-50/40">
                    <td className="p-3">
                      <span className="font-medium text-gray-900">
                        {row.prenom} {row.nom}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">
                      <div>{row.pole}</div>
                      <div className="text-xs text-gray-500">{row.filliere}</div>
                    </td>
                    <td className="p-3 text-gray-700">{row.groupe}</td>
                    <td className="p-3 text-gray-700">
                      <div className="text-xs">{row.email}</div>
                      <div className="text-xs text-gray-500">{row.telephone}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {(row.activites ?? []).map((a, i) => (
                          <span
                            key={i}
                            className="inline-block text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 w-fit"
                          >
                            {formatActiviteLabel(a)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(row.date_inscription).toLocaleString('fr-FR')}
                    </td>
                    {isAdmin && (
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
