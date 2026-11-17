'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  Users,
  Building2,
  Mail,
  PlusCircle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import {
  useIndicateursDashboard,
  type IndicateurDashboard,
} from '@/hooks/useIndicateursDashboard'
import { useRole } from '@/hooks/useRole'

const iconMap = {
  TrendingUp: TrendingUp,
  Users: Users,
  Building2: Building2,
  Mail: Mail,
}

export default function IndicateursDashboardCards() {
  const { indicateurs, loading, error, updateIndicateur, reload } = useIndicateursDashboard()
  const { isAdmin, isDirecteur } = useRole()
  const canEdit = isAdmin && !isDirecteur
  const [editOpen, setEditOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editData, setEditData] = useState<IndicateurDashboard[]>([])
  const [addData, setAddData] = useState({
    titre: '',
    valeur: '',
    trend: '',
    couleur: 'blue',
    icone: 'TrendingUp',
  })

  const handleEdit = () => {
    setEditData(indicateurs.map((i) => ({ ...i })))
    setEditOpen(true)
  }

  const handleChange = (idx: number, field: string, value: string) => {
    setEditData((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  const handleSave = async () => {
    for (const ind of editData) {
      await updateIndicateur(ind.id, {
        titre: ind.titre,
        valeur: ind.valeur,
        trend: ind.trend,
        couleur: ind.couleur,
        icone: ind.icone,
      })
    }
    setEditOpen(false)
    reload()
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const { supabase } = await import('@/lib/supabase')
    await supabase.from('indicateurs_dashboard').insert([{ ...addData, ordre: indicateurs.length }])
    setAddOpen(false)
    setAddData({ titre: '', valeur: '', trend: '', couleur: 'blue', icone: 'TrendingUp' })
    reload()
  }

  if (loading) return <p className="text-sm text-slate-500">Chargement des indicateurs…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-[#0f3d6c]" />
          <div>
            <h2 className="text-sm font-semibold text-[#0f3d6c]">Indicateurs clés</h2>
            <p className="text-xs text-slate-500">Repères du COP, d’un coup d’œil</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Ajouter
            </button>
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-lg bg-[#0f3d6c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0c3258]"
            >
              Modifier
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {indicateurs.map((ind) => {
          const Icon = iconMap[(ind.icone as keyof typeof iconMap) || 'TrendingUp'] || TrendingUp
          const trendLower = (ind.trend || '').toLowerCase()
          const isRising =
            trendLower.includes('hausse') || trendLower.includes('↑') || trendLower.includes('augmentation')
          const isFalling =
            trendLower.includes('baisse') || trendLower.includes('↓') || trendLower.includes('diminution')
          const pct = ind.valeur?.includes('%')
            ? Math.min(100, parseInt(ind.valeur.replace(/[^\d]/g, ''), 10) || 0)
            : null

          return (
            <article
              key={ind.id}
              className="rounded-2xl border border-[#0f3d6c]/10 bg-[#f8f6f1] p-4"
              title={ind.titre}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 leading-snug">
                  {ind.titre}
                </p>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0f3d6c] text-white">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="font-serif text-3xl tabular-nums tracking-tight text-[#0f3d6c]">{ind.valeur}</p>
              {ind.trend && (
                <p
                  className={`mt-2 inline-flex items-center gap-1 text-xs ${
                    isRising ? 'text-emerald-700' : isFalling ? 'text-red-700' : 'text-slate-500'
                  }`}
                >
                  {isRising && <ArrowUp className="h-3 w-3" />}
                  {isFalling && <ArrowDown className="h-3 w-3" />}
                  {ind.trend}
                </p>
              )}
              {pct !== null && (
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#0f3d6c]/10">
                  <div className="h-full rounded-full bg-[#0f3d6c]" style={{ width: `${pct}%` }} />
                </div>
              )}
            </article>
          )
        })}
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white p-6">
            <h3 className="mb-4 text-base font-semibold text-[#0f3d6c]">Modifier les indicateurs</h3>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="pb-2">Titre</th>
                    <th className="pb-2">Valeur</th>
                    <th className="pb-2">Tendance</th>
                  </tr>
                </thead>
                <tbody>
                  {editData.map((ind, idx) => (
                    <tr key={ind.id || idx}>
                      <td className="py-1 pr-2">
                        <input
                          value={ind.titre}
                          onChange={(e) => handleChange(idx, 'titre', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          value={ind.valeur}
                          onChange={(e) => handleChange(idx, 'valeur', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
                        />
                      </td>
                      <td className="py-1">
                        <input
                          value={ind.trend || ''}
                          onChange={(e) => handleChange(idx, 'trend', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                className="rounded-lg bg-[#0f3d6c] px-4 py-2 text-sm text-white"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleAdd}
            className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6"
          >
            <h3 className="text-base font-semibold text-[#0f3d6c]">Ajouter un indicateur</h3>
            <input
              required
              placeholder="Titre"
              value={addData.titre}
              onChange={(e) => setAddData({ ...addData, titre: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Valeur"
              value={addData.valeur}
              onChange={(e) => setAddData({ ...addData, valeur: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Tendance"
              value={addData.trend}
              onChange={(e) => setAddData({ ...addData, trend: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Annuler
              </button>
              <button type="submit" className="rounded-lg bg-[#0f3d6c] px-4 py-2 text-sm text-white">
                Ajouter
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
