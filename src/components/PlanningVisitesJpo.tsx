'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Loader2,
  Mail,
  Phone,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  creneauLabel,
  formatDateVisiteFr,
  peutValiderVisiteJpo,
  type VisiteJpoReservation,
} from '@/lib/visitesJpo'

function formatConfirmeLe(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: number
  hint: string
  className: string
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${className}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80">{hint}</div>
    </div>
  )
}

export function PlanningVisitesJpo() {
  const { profile, user } = useAuth()
  const authEmail = (user as { email?: string } | null)?.email
  const isAdmin = profile?.role === 'business_developer'
  const canValidate = peutValiderVisiteJpo({
    role: profile?.role,
    email: profile?.email || authEmail,
    nom: profile?.nom,
    prenom: profile?.prenom,
  })
  const [reservations, setReservations] = useState<VisiteJpoReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const publicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/visites-jpo` : '/visites-jpo'

  const load = useCallback(async () => {
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Session expirée')
      const res = await fetch('/api/visites-jpo/', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chargement impossible')
      setReservations(data.reservations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const remove = async (r: VisiteJpoReservation) => {
    const ok = window.confirm(
      `Supprimer définitivement le RDV de ${r.etablissement} (${formatDateVisiteFr(r.date_visite)}) ?`
    )
    if (!ok) return
    setActingId(r.id)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Session expirée')
      const res = await fetch(`/api/visites-jpo/${r.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Suppression impossible')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setActingId(null)
    }
  }

  const act = async (id: string, action: 'confirmer' | 'refuser') => {
    setActingId(id)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Session expirée')
      const res = await fetch(`/api/visites-jpo/${id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action impossible')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setActingId(null)
    }
  }

  const pending = reservations.filter((r) => r.statut === 'en_attente')
  const confirmed = reservations.filter((r) => r.statut === 'confirmee')
  const refused = reservations.filter((r) => r.statut === 'refusee')
  const participantsConfirmes = confirmed.reduce((sum, r) => sum + (r.nombre_participants || 0), 0)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-[#0f3d6c] to-teal-700 px-5 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Visites journées portes ouvertes</h3>
            <p className="text-sm text-white/80">Suivi des demandes lycées — validation COP</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(publicUrl)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium hover:bg-white/25"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Lien copié' : 'Lien du portail'}
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="En attente"
            value={pending.length}
            hint="À confirmer"
            className="border-amber-200 bg-amber-50 text-amber-900"
          />
          <StatCard
            label="Confirmés"
            value={confirmed.length}
            hint="RDV acceptés"
            className="border-teal-200 bg-teal-50 text-teal-900"
          />
          <StatCard
            label="Refusés"
            value={refused.length}
            hint="Non retenus"
            className="border-slate-200 bg-slate-50 text-slate-700"
          />
          <StatCard
            label="Participants"
            value={participantsConfirmes}
            hint="Sur RDV confirmés"
            className="border-blue-200 bg-blue-50 text-blue-900"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500">Chargement des demandes…</p>
        ) : (
          <>
            <section>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
                <Clock3 className="h-4 w-4" />
                En attente de confirmation
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs">{pending.length}</span>
              </h4>
              {pending.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune demande en attente.</p>
              ) : (
                <div className="space-y-3">
                  {pending.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4"
                    >
                      <div className="min-w-[220px] flex-1 space-y-1.5 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900">{r.etablissement}</span>
                          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                            En attente
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-700">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDateVisiteFr(r.date_visite)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {creneauLabel(r.creneau)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {r.nombre_participants} part. / {r.nombre_accompagnateurs} acc.
                          </span>
                        </div>
                        <div className="text-gray-600">
                          {r.nom_prenom} · {r.fonction}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {r.telephone}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {r.email}
                          </span>
                        </div>
                      </div>
                      {(canValidate || isAdmin) && (
                        <div className="flex flex-wrap gap-2">
                          {canValidate && (
                            <>
                              <button
                                type="button"
                                disabled={actingId === r.id}
                                onClick={() => void act(r.id, 'confirmer')}
                                className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                              >
                                {actingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Confirmer
                              </button>
                              <button
                                type="button"
                                disabled={actingId === r.id}
                                onClick={() => void act(r.id, 'refuser')}
                                className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <X className="w-4 h-4" />
                                Refuser
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              disabled={actingId === r.id}
                              onClick={() => void remove(r)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {actingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              Supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-teal-800">
                <UserCheck className="h-4 w-4" />
                RDV confirmés
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs">{confirmed.length}</span>
              </h4>
              {confirmed.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun rendez-vous confirmé pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {confirmed.map((r) => (
                    <div key={r.id} className="rounded-xl border border-teal-200 bg-teal-50/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-[220px] flex-1 space-y-1.5 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900">{r.etablissement}</span>
                            <span className="rounded-full bg-teal-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-teal-900">
                              Confirmé
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-700">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDateVisiteFr(r.date_visite)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              {creneauLabel(r.creneau)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {r.nombre_participants} participants
                            </span>
                          </div>
                          <div className="text-gray-600">
                            {r.nom_prenom} · {r.fonction}
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            disabled={actingId === r.id}
                            onClick={() => void remove(r)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {actingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Supprimer
                          </button>
                        )}
                      </div>
                      <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm text-teal-900 ring-1 ring-teal-100">
                        <UserCheck className="h-4 w-4 text-teal-700" />
                        <span>
                          Accepté par <strong>{r.confirme_par_nom || 'Conseiller COP'}</strong>
                          {r.confirme_le ? ` le ${formatConfirmeLe(r.confirme_le)}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {refused.length > 0 && (
              <section>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  Refusés
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{refused.length}</span>
                </h4>
                <div className="space-y-2">
                  {refused.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div>
                        <span className="font-medium text-slate-800">{r.etablissement}</span>
                        {' — '}
                        {formatDateVisiteFr(r.date_visite)} · {creneauLabel(r.creneau)}
                        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                          Refusé
                        </span>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={actingId === r.id}
                          onClick={() => void remove(r)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {actingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Supprimer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
