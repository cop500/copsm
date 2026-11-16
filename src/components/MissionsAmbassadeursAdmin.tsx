'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, Clock, MapPin, Plus, Trash2, Users, Loader2, AlertCircle, User, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  formatCreneau,
  formatDateMission,
  type MissionAmbassadeur,
} from '@/lib/missionsAmbassadeurs'

const champ =
  'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0f3d6c] focus:border-[#0f3d6c]'

export function MissionsAmbassadeursAdmin() {
  const [missions, setMissions] = useState<MissionAmbassadeur[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [ouverte, setOuverte] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [conseillers, setConseillers] = useState<{ id: string; nom: string; prenom: string }[]>([])
  const [form, setForm] = useState({
    intitule: '',
    date_mission: '',
    lieu: '',
    heure_debut: '09:00',
    heure_fin: '12:00',
    conseiller_responsable: '',
  })

  const token = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ''
  }

  const charger = useCallback(async () => {
    setErreur(null)
    setLoading(true)
    try {
      const res = await fetch('/api/ambassadeurs/missions/?admin=1', {
        headers: { Authorization: `Bearer ${await token()}` },
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chargement impossible')
      setMissions(data.missions || [])
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  useEffect(() => {
    void supabase
      .from('profiles')
      .select('id, nom, prenom, role')
      .in('role', ['conseiller_cop', 'conseillere_carriere', 'business_developer', 'manager_cop'])
      .order('nom')
      .then(({ data }) => setConseillers(data || []))
  }, [])

  const creer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErreur(null)
    try {
      const res = await fetch('/api/ambassadeurs/missions/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await token()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Enregistrement impossible')
      setForm({
        intitule: '',
        date_mission: '',
        lieu: '',
        heure_debut: '09:00',
        heure_fin: '12:00',
        conseiller_responsable: '',
      })
      setShowForm(false)
      await charger()
    } catch (err) {
      setErreur((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const supprimer = async (id: string) => {
    if (!window.confirm('Supprimer cette mission et les disponibilités associées ?')) return
    const res = await fetch(`/api/ambassadeurs/missions/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${await token()}` },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setErreur(data.error || 'Suppression impossible')
      return
    }
    await charger()
  }

  const exporterExcel = async (cible?: MissionAmbassadeur) => {
    const liste = cible ? [cible] : missions
    const lignes: Record<string, string>[] = []
    for (const m of liste) {
      for (const d of m.disponibilites || []) {
        lignes.push({
          Mission: m.intitule,
          Date: formatDateMission(m.date_mission),
          Créneau: formatCreneau(m.heure_debut, m.heure_fin),
          Lieu: m.lieu,
          'Conseiller responsable': m.conseiller_responsable || '',
          Prénom: d.prenom,
          Nom: d.nom,
          Téléphone: d.telephone,
        })
      }
    }
    if (lignes.length === 0) {
      setErreur('Aucun disponible à exporter.')
      return
    }
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(lignes)
    ws['!cols'] = [
      { wch: 32 },
      { wch: 22 },
      { wch: 16 },
      { wch: 22 },
      { wch: 24 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Disponibles')
    const suffixe = cible
      ? cible.intitule.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40)
      : 'toutes_missions'
    XLSX.writeFile(wb, `Disponibles_ambassadeurs_${suffixe}.xlsx`)
  }

  const basculer = async (mission: MissionAmbassadeur) => {
    const res = await fetch(`/api/ambassadeurs/missions/${mission.id}/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${await token()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ actif: !mission.actif }),
    })
    if (res.ok) await charger()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[#0f3d6c]">Missions</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void exporterExcel()}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Télécharger les disponibles
            </button>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[#0f3d6c] text-white hover:bg-[#0c3258] inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Masquer' : 'Nouvelle mission'}
            </button>
          </div>
        </div>
      </div>

      {showForm && (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-base font-semibold text-[#0f3d6c] mb-4">Nouvelle mission</h3>
        <form onSubmit={creer} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Intitulé de la mission *</label>
            <input
              value={form.intitule}
              onChange={(e) => setForm({ ...form, intitule: e.target.value })}
              className={champ}
              placeholder="Ex. Accueil forum des métiers"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
            <input
              type="date"
              value={form.date_mission}
              onChange={(e) => setForm({ ...form, date_mission: e.target.value })}
              className={champ}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Lieu *</label>
            <input
              value={form.lieu}
              onChange={(e) => setForm({ ...form, lieu: e.target.value })}
              className={champ}
              placeholder="CMC, hall d’accueil…"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Début *</label>
            <input
              type="time"
              value={form.heure_debut}
              onChange={(e) => setForm({ ...form, heure_debut: e.target.value })}
              className={champ}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fin *</label>
            <input
              type="time"
              value={form.heure_fin}
              onChange={(e) => setForm({ ...form, heure_fin: e.target.value })}
              className={champ}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Conseiller responsable *</label>
            <select
              value={form.conseiller_responsable}
              onChange={(e) => setForm({ ...form, conseiller_responsable: e.target.value })}
              className={champ}
              required
            >
              <option value="">Choisir un conseiller…</option>
              {conseillers.map((c) => {
                const label = `${c.prenom || ''} ${c.nom || ''}`.trim()
                return (
                  <option key={c.id} value={label}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[#0f3d6c] text-white hover:bg-[#0c3258] inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Publier
            </button>
          </div>
        </form>
      </div>
      )}

      {erreur && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {erreur}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-base font-semibold text-[#0f3d6c] mb-4">
          Liste ({missions.length})
        </h3>
        {loading ? (
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </p>
        ) : missions.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune mission pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {missions.map((m) => (
              <div key={m.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#0f3d6c]">{m.intitule}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateMission(m.date_mission)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatCreneau(m.heure_debut, m.heure_fin)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {m.lieu}
                      </span>
                      {m.conseiller_responsable && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {m.conseiller_responsable}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {m.nb_disponibles || 0} disponible{(m.nb_disponibles || 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void basculer(m)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${
                        m.actif
                          ? 'border-emerald-200 text-emerald-800 bg-emerald-50'
                          : 'border-slate-200 text-slate-500 bg-slate-50'
                      }`}
                    >
                      {m.actif ? 'Publiée' : 'Masquée'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOuverte(ouverte === m.id ? null : m.id)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 text-slate-700"
                    >
                      {ouverte === m.id ? 'Fermer' : 'Voir les noms'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void exporterExcel(m)}
                      disabled={(m.nb_disponibles || 0) === 0}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 inline-flex items-center gap-1 disabled:opacity-40"
                      title="Excel de cette mission"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => void supprimer(m.id)}
                      className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {ouverte === m.id && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    {(m.disponibilites || []).length === 0 ? (
                      <p className="text-sm text-slate-500">Personne n’a encore confirmé.</p>
                    ) : (
                      <ul className="text-sm divide-y divide-slate-100">
                        {(m.disponibilites || []).map((d) => (
                          <li key={d.id} className="py-1.5 flex justify-between gap-3">
                            <span className="font-medium text-slate-800">
                              {d.prenom} {d.nom}
                            </span>
                            <span className="tabular-nums text-slate-600">{d.telephone}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
