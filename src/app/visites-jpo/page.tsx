'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  CRENEAU_RESERVE_MESSAGE,
  VISITES_JPO_CRENEAUX,
  inscriptionsOuvertes,
  isWeekendDate,
} from '@/lib/visitesJpo'

const INTRO_TITLE = 'Les portes de la CMC s’ouvrent pour vous'
const INTRO_BODY = `Venez découvrir les métiers, les formations et l’esprit de la Cité des Métiers et des Compétences Souss-Massa.

Pour préparer votre accueil, réservez votre visite avant le 1er mai 2027 à 23h45. Deux créneaux seulement : 09h00 ou 13h00 — un créneau, une délégation.

L’équipe du Centre d’Orientation Professionnelle (COP) reste à vos côtés :`

export default function VisitesJpoPage() {
  const [form, setForm] = useState({
    nom_prenom: '',
    telephone: '',
    email: '',
    fonction: '',
    etablissement: '',
    date_visite: '',
    creneau: '',
    nombre_participants: '1',
    nombre_accompagnateurs: '0',
  })
  const [occupe, setOccupe] = useState<{ date_visite: string; creneau: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const ouvert = inscriptionsOuvertes()

  useEffect(() => {
    if (!form.date_visite) {
      setOccupe([])
      return
    }
    fetch(`/api/visites-jpo/creneaux/?date=${encodeURIComponent(form.date_visite)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setOccupe(Array.isArray(data.occupe) ? data.occupe : []))
      .catch(() => setOccupe([]))
  }, [form.date_visite])

  const creneauPris = useMemo(() => {
    const set = new Set(occupe.map((o) => o.creneau))
    return set
  }, [occupe])

  const slotChoisiPris = Boolean(form.creneau && creneauPris.has(form.creneau))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!ouvert) {
      setError('Les inscriptions sont closes.')
      return
    }
    if (isWeekendDate(form.date_visite)) {
      setError('Les visites sont possibles du lundi au vendredi.')
      return
    }
    if (slotChoisiPris) {
      setError(CRENEAU_RESERVE_MESSAGE)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/visites-jpo/reservation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          nombre_participants: Number(form.nombre_participants),
          nombre_accompagnateurs: Number(form.nombre_accompagnateurs),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l’envoi')
      }
      setSuccess(data.message)
      setForm({
        nom_prenom: '',
        telephone: '',
        email: '',
        fonction: '',
        etablissement: '',
        date_visite: '',
        creneau: '',
        nombre_participants: '1',
        nombre_accompagnateurs: '0',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  const field =
    'mt-1 w-full rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-[#0f3d6c] focus:outline-none focus:ring-2 focus:ring-[#0f3d6c]/20'

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg-entreprise.jpg')" }}
        aria-hidden="true"
      />
      <div className="pointer-events-none fixed inset-0 bg-[#0b2744]/35" aria-hidden="true" />

      <div className="relative">
      <div className="px-4 py-12 text-center text-white">
        <p className="mb-2 text-sm font-semibold tracking-[0.2em] uppercase text-amber-200">Journées portes ouvertes</p>
        <h1 className="text-3xl sm:text-5xl font-bold drop-shadow-lg">Visites CMC Souss-Massa</h1>
        <p className="mt-3 text-blue-100">Centre d’Orientation Professionnelle · COP</p>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-12">
        <div className="rounded-2xl border border-white/50 bg-white/55 backdrop-blur-xl p-6 shadow-xl mb-6 text-slate-800 leading-relaxed">
          <h2 className="text-xl font-bold text-[#0f3d6c] mb-3">{INTRO_TITLE}</h2>
          <p className="whitespace-pre-line">{INTRO_BODY}</p>
          <div className="mt-4 space-y-1 text-slate-800">
            <p>📞 Téléphone : 0676-822183 / 0603-641328</p>
            <p>📧 Email : abdelhamid.inajjaren@ofppt.ma / sara.hanzaze@ofppt.ma</p>
          </div>
          <p className="mt-4 font-medium text-[#0f3d6c]">Au plaisir de vous accueillir — à très bientôt.</p>
        </div>

        {!ouvert && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            Les inscriptions sont closes depuis le 1er mai 2027 à 23h45.
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/50 bg-white/50 backdrop-blur-xl p-6 shadow-xl space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Nom & Prénom</span>
            <input className={field} required value={form.nom_prenom} onChange={(e) => setForm({ ...form, nom_prenom: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">N° de téléphone</span>
            <input className={field} required value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">E-mail</span>
            <input type="email" className={field} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Fonction</span>
            <input className={field} required value={form.fonction} onChange={(e) => setForm({ ...form, fonction: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Établissement</span>
            <input className={field} required value={form.etablissement} onChange={(e) => setForm({ ...form, etablissement: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">À quelle date souhaitez-vous venir ?</span>
            <input
              type="date"
              className={field}
              required
              max="2027-05-01"
              value={form.date_visite}
              onChange={(e) => setForm({ ...form, date_visite: e.target.value, creneau: '' })}
            />
          </label>
          <fieldset>
            <legend className="text-sm font-semibold text-slate-800">Créneau horaire</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {VISITES_JPO_CRENEAUX.map((slot) => {
                const pris = creneauPris.has(slot.id)
                return (
                  <label
                    key={slot.id}
                    className={`rounded-xl border px-3 py-3 text-sm ${
                      pris
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                        : form.creneau === slot.id
                          ? 'border-[#0f3d6c] bg-blue-50 text-[#0f3d6c] font-semibold'
                          : 'border-slate-200 bg-white cursor-pointer'
                    }`}
                  >
                    <input
                      type="radio"
                      name="creneau"
                      className="sr-only"
                      disabled={pris}
                      checked={form.creneau === slot.id}
                      onChange={() => setForm({ ...form, creneau: slot.id })}
                    />
                    {slot.label}
                    {pris && <span className="block text-xs mt-1">Réservé</span>}
                  </label>
                )
              })}
            </div>
          </fieldset>
          {slotChoisiPris && (
            <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
              {CRENEAU_RESERVE_MESSAGE}
            </p>
          )}
          {form.date_visite && VISITES_JPO_CRENEAUX.every((s) => creneauPris.has(s.id)) && (
            <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
              {CRENEAU_RESERVE_MESSAGE}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Nombre des participants</span>
              <input type="number" min={1} className={field} required value={form.nombre_participants} onChange={(e) => setForm({ ...form, nombre_participants: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Nombre des accompagnateurs</span>
              <input type="number" min={0} className={field} required value={form.nombre_accompagnateurs} onChange={(e) => setForm({ ...form, nombre_accompagnateurs: e.target.value })} />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !ouvert || slotChoisiPris}
            className="w-full rounded-xl bg-[#0f3d6c] py-3 font-semibold text-white hover:bg-[#0c3258] disabled:opacity-50"
          >
            {submitting ? 'Envoi…' : 'Envoyer la demande'}
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}
