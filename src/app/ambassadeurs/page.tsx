'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, MapPin, Users, User, Building2, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import './formulaire.css'
import Image from 'next/image'
import { TYPES_ACTION_AMBASSADEUR } from '@/lib/ambassadeursActions'

type Ambassadeur = {
  id: string
  nom: string
  prenom: string
  pole: string
  filiere: string
}

export default function FormulaireAmbassadeurs() {
  const today = new Date().toISOString().slice(0, 10)
  const [liste, setListe] = useState<Ambassadeur[]>([])
  const [loadingListe, setLoadingListe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<'individuelle' | 'collective' | ''>('')
  const [rechercheNom, setRechercheNom] = useState('')
  const [stagiaire, setStagiaire] = useState<Ambassadeur | null>(null)
  const [coequipiers, setCoequipiers] = useState<string[]>([])
  const [rechercheGroupe, setRechercheGroupe] = useState('')
  const [actionsCochees, setActionsCochees] = useState<string[]>([])
  const [details, setDetails] = useState<Record<string, string>>({})
  const [dateAction, setDateAction] = useState(today)
  const [lieu, setLieu] = useState('')

  useEffect(() => {
    fetch('/api/ambassadeurs/liste/', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setListe(data.ambassadeurs || []))
      .catch(() => setError('Impossible de charger la liste des ambassadeurs.'))
      .finally(() => setLoadingListe(false))
  }, [])

  const suggestionsNom = useMemo(() => {
    const q = rechercheNom.trim().toLowerCase()
    if (q.length < 1) return []
    return liste
      .filter(
        (a) =>
          a.nom.toLowerCase().includes(q) ||
          a.prenom.toLowerCase().includes(q) ||
          `${a.prenom} ${a.nom}`.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [liste, rechercheNom])

  const participantsGroupe = useMemo(
    () => liste.filter((a) => coequipiers.includes(a.id)),
    [liste, coequipiers]
  )

  const suggestionsGroupe = useMemo(() => {
    const q = rechercheGroupe.trim().toLowerCase()
    if (q.length < 1) return []
    return liste
      .filter(
        (a) =>
          a.id !== stagiaire?.id &&
          !coequipiers.includes(a.id) &&
          (a.nom.toLowerCase().includes(q) ||
            a.prenom.toLowerCase().includes(q) ||
            `${a.prenom} ${a.nom}`.toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [liste, rechercheGroupe, stagiaire, coequipiers])

  const reset = () => {
    setType('')
    setRechercheNom('')
    setStagiaire(null)
    setCoequipiers([])
    setRechercheGroupe('')
    setActionsCochees([])
    setDetails({})
    setDateAction(today)
    setLieu('')
    setError(null)
  }

  const toggleAction = (id: string) => {
    setActionsCochees((prev) => {
      if (prev.includes(id)) {
        setDetails((d) => {
          const next = { ...d }
          delete next[id]
          return next
        })
        return prev.filter((x) => x !== id)
      }
      return [...prev, id]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!type) {
      setError('Choisissez action individuelle ou collective.')
      return
    }
    if (!stagiaire) {
      setError('Saisissez votre nom, puis confirmez le profil affiché.')
      return
    }
    if (type === 'collective' && coequipiers.length === 0) {
      setError('Cochez les autres ambassadeurs du groupe.')
      return
    }
    if (actionsCochees.length === 0) {
      setError('Cochez au moins une action.')
      return
    }
    const manque = TYPES_ACTION_AMBASSADEUR.find(
      (a) => actionsCochees.includes(a.id) && !(details[a.id] || '').trim()
    )
    if (manque) {
      setError(`Précisez : ${manque.detailLabel}.`)
      return
    }
    if (!dateAction) {
      setError('Indiquez la date.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ambassadeurs/actions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          stagiaire_id: stagiaire.id,
          coequipiers_ids: type === 'collective' ? coequipiers : [],
          actions: actionsCochees,
          details,
          date_action: dateAction,
          lieu_realisation: lieu,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Enregistrement impossible')
      setSuccess(true)
      reset()
    } catch (err: any) {
      setError(err.message || 'Enregistrement impossible')
    } finally {
      setLoading(false)
    }
  }

  const champ =
    'w-full px-4 py-3 backdrop-blur-md bg-white/20 border border-white/40 rounded-xl focus:ring-2 focus:ring-[#00E5B0] focus:border-[#00E5B0] transition-all duration-300 text-base text-white placeholder-[#EDEDED]'
  const label = 'block text-sm font-semibold text-white mb-3 drop-shadow-lg'
  const bloc =
    'backdrop-blur-lg bg-white/15 md:bg-white/15 bg-white/25 rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6 border border-white/30 shadow-xl'

  if (success) {
    return (
      <div className="formulaire-container">
        <Image
          src="/formulaire7.jpg"
          alt="Arrière-plan du formulaire"
          fill
          className="formulaire-bg-image"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-white/20"></div>
        <div className="formulaire-content flex items-center justify-center min-h-screen p-4">
          <div className="backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-white border-opacity-30">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Action enregistrée !</h2>
            <p className="text-white mb-6 drop-shadow-md">
              Elle apparaîtra sur la carte du ou des ambassadeurs concernés.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] bg-opacity-90 backdrop-blur-sm text-white rounded-xl hover:from-[#2563EB] hover:to-[#6D28D9] transition-all duration-300 font-semibold border border-white/40 shadow-xl"
            >
              Enregistrer une nouvelle action
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="formulaire-container">
      <Image
        src="/formulaire7.jpg"
        alt="Arrière-plan du formulaire"
        fill
        className="formulaire-bg-image"
        priority
        quality={90}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-white/20"></div>
      <div className="formulaire-content py-8 px-4">
        <div className="max-w-lg mx-auto px-4 md:px-0">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-xl">
              Formulaire de Suivi des Actions
            </h1>
            <p className="text-xl text-[#EDEDED] drop-shadow-lg">Stagiaires Ambassadeurs</p>
          </div>

          <div className="backdrop-blur-md bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20">
            {error && (
              <div className="mb-6 p-4 bg-red-900 bg-opacity-50 backdrop-blur-sm border border-red-400 border-opacity-50 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-300" />
                <p className="text-red-200 drop-shadow-md">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className={bloc}>
                <h2 className="text-2xl font-semibold text-white text-center drop-shadow-xl">
                  1. Type d’action
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setType('individuelle')
                      setCoequipiers([])
                    }}
                    className={`px-4 py-4 rounded-xl font-semibold border ${
                      type === 'individuelle'
                        ? 'bg-white text-blue-800 border-white'
                        : 'bg-white/10 text-white border-white/40'
                    }`}
                  >
                    Individuelle
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('collective')}
                    className={`px-4 py-4 rounded-xl font-semibold border ${
                      type === 'collective'
                        ? 'bg-white text-blue-800 border-white'
                        : 'bg-white/10 text-white border-white/40'
                    }`}
                  >
                    Collective (groupe)
                  </button>
                </div>
              </div>

              <div className={bloc}>
                <h2 className="text-2xl font-semibold text-white text-center flex items-center justify-center gap-3 drop-shadow-xl">
                  <User className="w-6 h-6 text-[#00E5B0]" />
                  2. Ambassadeur
                </h2>
                <div>
                  <label className={label}>Nom *</label>
                  <input
                    type="search"
                    value={rechercheNom}
                    onChange={(e) => {
                      setRechercheNom(e.target.value)
                      setStagiaire(null)
                    }}
                    className={champ}
                    placeholder="Tapez votre nom…"
                    autoComplete="off"
                  />
                  {loadingListe && (
                    <p className="mt-2 text-sm text-white/80 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Chargement de la liste…
                    </p>
                  )}
                  {!stagiaire && suggestionsNom.length > 0 && (
                    <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-white/30 bg-black/20">
                      {suggestionsNom.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            className="w-full text-left px-4 py-2 text-white hover:bg-white/20"
                            onClick={() => {
                              setStagiaire(a)
                              setRechercheNom(a.nom)
                            }}
                          >
                            {a.nom} {a.prenom}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {stagiaire && (
                  <div className="rounded-xl border border-[#00E5B0]/50 bg-black/20 p-4 space-y-2 text-white">
                    <p className="text-sm text-[#00E5B0] font-semibold">Confirmation du profil</p>
                    <p><span className="text-white/70">Prénom :</span> {stagiaire.prenom}</p>
                    <p><span className="text-white/70">Nom :</span> {stagiaire.nom}</p>
                    <p><span className="text-white/70">Pôle :</span> {stagiaire.pole || '—'}</p>
                    <p><span className="text-white/70">Filière :</span> {stagiaire.filiere || '—'}</p>
                  </div>
                )}

                {type === 'collective' && stagiaire && (
                  <div>
                    <label className={label}>Ajouter les participants du groupe *</label>
                    <p className="text-sm text-white/80 mb-2">
                      Tapez le nom de chaque ambassadeur, puis cliquez pour l’ajouter. L’action
                      apparaîtra aussi sur sa carte.
                    </p>
                    <input
                      type="search"
                      value={rechercheGroupe}
                      onChange={(e) => setRechercheGroupe(e.target.value)}
                      className={champ}
                      placeholder="Rechercher un participant…"
                      autoComplete="off"
                    />
                    {suggestionsGroupe.length > 0 && (
                      <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-white/30 bg-black/20">
                        {suggestionsGroupe.map((a) => (
                          <li key={a.id}>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-white hover:bg-white/20"
                              onClick={() => {
                                setCoequipiers((prev) =>
                                  prev.includes(a.id) ? prev : [...prev, a.id]
                                )
                                setRechercheGroupe('')
                              }}
                            >
                              {a.prenom} {a.nom}
                              {a.filiere ? ` — ${a.filiere}` : ''}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {participantsGroupe.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {participantsGroupe.map((a) => (
                          <span
                            key={a.id}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-blue-800 text-sm font-medium"
                          >
                            {a.prenom} {a.nom}
                            <button
                              type="button"
                              className="p-0.5"
                              onClick={() =>
                                setCoequipiers((prev) => prev.filter((id) => id !== a.id))
                              }
                              title="Retirer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-white/70 mt-2">
                      Groupe : vous + {participantsGroupe.length} participant(s)
                    </p>
                  </div>
                )}
              </div>

              <div className={bloc}>
                <h2 className="text-2xl font-semibold text-white text-center flex items-center justify-center gap-3 drop-shadow-xl">
                  <Building2 className="w-6 h-6 text-[#00E5B0]" />
                  3. Actions réalisées
                </h2>
                <p className="text-sm text-white/80 text-center">Cochez une ou plusieurs actions.</p>
                <div className="space-y-3">
                  {TYPES_ACTION_AMBASSADEUR.map((a) => {
                    const cochee = actionsCochees.includes(a.id)
                    return (
                      <div
                        key={a.id}
                        className="text-white bg-white/10 rounded-xl p-3 border border-white/20 space-y-2"
                      >
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={cochee}
                            onChange={() => toggleAction(a.id)}
                            className="mt-1 rounded"
                          />
                          <span>{a.label}</span>
                        </label>
                        {cochee && (
                          <div className="pl-7">
                            <label className="block text-xs font-semibold text-white/90 mb-1">
                              {a.detailLabel} *
                            </label>
                            <input
                              value={details[a.id] || ''}
                              onChange={(e) =>
                                setDetails((prev) => ({ ...prev, [a.id]: e.target.value }))
                              }
                              className={champ}
                              placeholder={a.placeholder}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div>
                  <label className={label}>Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#EDEDED]" />
                    <input
                      type="date"
                      required
                      value={dateAction}
                      onChange={(e) => setDateAction(e.target.value)}
                      className={`${champ} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Lieu (facultatif)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#EDEDED]" />
                    <input
                      value={lieu}
                      onChange={(e) => setLieu(e.target.value)}
                      className={`${champ} pl-10`}
                      placeholder="COP CMC Souss-Massa"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] bg-opacity-90 backdrop-blur-sm text-white rounded-xl hover:from-[#2563EB] hover:to-[#6D28D9] transition-all duration-300 font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 border border-white/40 shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enregistrement en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Enregistrer l'action
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
