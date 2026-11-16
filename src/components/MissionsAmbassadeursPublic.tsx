'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Loader2, User } from 'lucide-react'
import {
  formatCreneau,
  formatDateMission,
  missionEstPassee,
  type MissionAmbassadeur,
} from '@/lib/missionsAmbassadeurs'

const champ =
  'w-full px-4 py-3 backdrop-blur-md bg-white/20 border border-white/40 rounded-xl focus:ring-2 focus:ring-[#00E5B0] focus:border-[#00E5B0] text-white placeholder-[#EDEDED]'
const label = 'block text-sm font-semibold text-white mb-2 drop-shadow-lg'

export function MissionsAmbassadeursPublic() {
  const [missions, setMissions] = useState<MissionAmbassadeur[]>([])
  const [loading, setLoading] = useState(true)
  const [erreurListe, setErreurListe] = useState<string | null>(null)
  const [missionId, setMissionId] = useState<string | null>(null)
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [sending, setSending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ambassadeurs/missions/', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setMissions(data.missions || [])
      })
      .catch(() => setErreurListe('Impossible de charger les missions.'))
      .finally(() => setLoading(false))
  }, [])

  const confirmer = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur(null)
    setOk(null)
    if (!missionId) {
      setErreur('Choisissez une mission.')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/ambassadeurs/missions/disponibilite/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission_id: missionId, nom, prenom, telephone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Enregistrement impossible')
      setOk(data.message || 'Disponibilité enregistrée.')
      setNom('')
      setPrenom('')
      setTelephone('')
      setMissionId(null)
    } catch (err) {
      setErreur((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  if (ok) {
    return (
      <div className="backdrop-blur-md bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-white text-lg drop-shadow-md">{ok}</p>
        <button
          type="button"
          onClick={() => setOk(null)}
          className="mt-6 px-6 py-3 bg-white text-[#0f3d6c] rounded-xl font-semibold"
        >
          Confirmer une autre mission
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {loading && (
        <p className="text-white flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement des missions…
        </p>
      )}
      {erreurListe && (
        <div className="p-4 bg-red-900/50 border border-red-400/50 rounded-lg text-red-100">{erreurListe}</div>
      )}
      {!loading && !erreurListe && missions.length === 0 && (
        <p className="text-white/90 text-center py-8">Aucune mission disponible pour le moment.</p>
      )}

      {!loading && missions.length > 0 && !missionId && (
        <p className="text-white/80 text-center text-sm">Cliquez sur une mission pour confirmer votre disponibilité.</p>
      )}

      {missions.map((m) => (
        <div
          key={m.id}
          className={`backdrop-blur-lg rounded-2xl border shadow-xl ${
            missionId === m.id ? 'bg-white/25 border-white' : 'bg-white/15 border-white/30'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              if (missionEstPassee(m.date_mission, m.heure_debut)) {
                setErreur('La date et l’heure de cette mission sont passées.')
                setMissionId(null)
                return
              }
              setMissionId((prev) => (prev === m.id ? null : m.id))
              setErreur(null)
            }}
            className="w-full text-left p-5 hover:bg-white/10 rounded-2xl transition"
          >
            <p className="text-white font-semibold text-lg drop-shadow-md">{m.intitule}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/90">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {formatDateMission(m.date_mission)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formatCreneau(m.heure_debut, m.heure_fin)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {m.lieu}
              </span>
              {m.conseiller_responsable && (
                <span className="inline-flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> {m.conseiller_responsable}
                </span>
              )}
            </div>
          </button>

          {missionId === m.id && (
            <form onSubmit={confirmer} className="px-5 pb-5 space-y-4 border-t border-white/20 pt-4">
              <h2 className="text-lg font-semibold text-white text-center drop-shadow-xl">
                Confirmer ma disponibilité
              </h2>
              <p className="text-sm text-white/80 text-center">
                Nom et prénom doivent correspondre à la liste des stagiaires ambassadeurs.
              </p>
              {erreur && (
                <div className="p-3 bg-red-900/50 border border-red-400/50 rounded-lg flex items-start gap-2 text-red-100 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {erreur}
                </div>
              )}
              <div>
                <label className={label}>Nom *</label>
                <input value={nom} onChange={(e) => setNom(e.target.value)} className={champ} required />
              </div>
              <div>
                <label className={label}>Prénom *</label>
                <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className={champ} required />
              </div>
              <div>
                <label className={label}>Téléphone *</label>
                <input
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className={champ}
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full px-6 py-3 bg-white text-[#0f3d6c] rounded-xl font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                Valider ma disponibilité
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  )
}
