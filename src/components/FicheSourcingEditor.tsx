'use client'

import React, { useEffect, useState } from 'react'
import { Printer, Save, Send, CheckCircle, RotateCcw, X } from 'lucide-react'
import type { DossierDemande } from '@/lib/dossierTraitementExcel'
import {
  ETAPES_CV,
  ETAPES_PREP,
  ETAPES_SUIVI,
  PIECES_CV_KEYS,
  PIECES_JOB_KEYS,
  STATUT_ACTION_KEYS,
  ficheStatutLabel,
  prepareFicheEditor,
  saveFicheSourcing,
  type FicheDonnees,
  type FicheEtape,
  type FicheSourcing,
  type FicheSourcingType,
} from '@/lib/fichesSourcing'
import { openFicheSourcingValideePrint } from '@/lib/ficheSourcingPrint'

type Props = {
  demande: DossierDemande
  conseillerNom?: string | null
  isAdmin: boolean
  onClose: () => void
  onChanged?: () => void
}

function Inp({
  value,
  onChange,
  disabled,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  className?: string
}) {
  return (
    <input
      type="text"
      value={value || ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border-0 border-b border-dotted border-slate-400 bg-amber-50 px-1 py-0.5 text-[12px] disabled:bg-transparent disabled:border-transparent ${className}`}
    />
  )
}

export function FicheSourcingEditor({ demande, conseillerNom, isAdmin, onClose, onChanged }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [existing, setExisting] = useState<FicheSourcing | null>(null)
  const [typeFiche, setTypeFiche] = useState<FicheSourcingType>('cv')
  const [donnees, setDonnees] = useState<FicheDonnees | null>(null)
  const [commentaireAdmin, setCommentaireAdmin] = useState('')

  const statut = existing?.statut || 'brouillon'
  const locked = isAdmin ? false : statut === 'validee' || statut === 'soumise'
  const canFill = !locked
  const canSubmit = canFill && (statut === 'brouillon' || statut === 'a_revoir' || !existing)
  const canValidate = isAdmin && statut === 'soumise'
  const canPrint = Boolean(existing) && (isAdmin || statut === 'validee')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    void prepareFicheEditor(demande, conseillerNom).then((res) => {
      if (cancelled) return
      if (res.error) setError(res.error)
      setExisting(res.existing)
      setTypeFiche(res.typeFiche)
      setDonnees(res.donnees)
      setCommentaireAdmin(res.existing?.commentaire_admin || '')
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [demande, conseillerNom])

  const patch = (partial: Partial<FicheDonnees>) => {
    setDonnees((prev) => (prev ? { ...prev, ...partial } : prev))
  }

  const patchEtape = (group: 'etapes_cv' | 'etapes_prep' | 'etapes_suivi', key: string, field: keyof FicheEtape, value: string) => {
    setDonnees((prev) => {
      if (!prev) return prev
      const map = { ...(prev[group] || {}) }
      map[key] = { ...(map[key] || { date: '', info: '' }), [field]: value }
      return { ...prev, [group]: map }
    })
  }

  const persist = async (opts: {
    statut: FicheSourcing['statut']
    markSubmitted?: boolean
    markValidated?: boolean
    markReturned?: boolean
    commentaire?: string | null
  }) => {
    if (!donnees) return
    setSaving(true)
    setError('')
    setMessage('')
    const res = await saveFicheSourcing({
      demandeId: demande.id,
      existingId: existing?.id,
      typeFiche,
      statut: opts.statut,
      donnees,
      commentaireAdmin: opts.commentaire,
      markSubmitted: opts.markSubmitted,
      markValidated: opts.markValidated,
      markReturned: opts.markReturned,
    })
    setSaving(false)
    if (res.error || !res.data) {
      setError(res.error || 'Enregistrement impossible')
      return
    }
    setExisting(res.data)
    onChanged?.()
    if (opts.markValidated) setMessage('Fiche validée. Elle peut maintenant être imprimée pour le dossier.')
    else if (opts.markSubmitted) setMessage('Fiche envoyée à l’administrateur pour validation.')
    else if (opts.markReturned) setMessage('Fiche renvoyée à la conseillère.')
    else setMessage('Brouillon enregistré.')
  }

  if (loading || !donnees) {
    return (
      <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl px-8 py-6 text-sm text-gray-600">Chargement de la fiche…</div>
      </div>
    )
  }

  const d = donnees

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white w-full max-w-5xl my-6 rounded-xl shadow-2xl border border-slate-200">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 bg-[#0f3d6c] text-white px-4 py-3 rounded-t-xl">
          <div className="font-semibold">Fiche sourcing — {demande.entreprise_nom}</div>
          <span className="text-xs bg-white/15 rounded-full px-2 py-1">{ficheStatutLabel(statut)}</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {canFill && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void persist({
                    statut:
                      statut === 'validee'
                        ? 'validee'
                        : statut === 'soumise'
                          ? 'soumise'
                          : existing?.statut === 'a_revoir'
                            ? 'a_revoir'
                            : 'brouillon',
                  })
                }
                className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm font-semibold"
              >
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            )}
            {canSubmit && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void persist({ statut: 'soumise', markSubmitted: true })}
                className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg text-sm font-semibold"
              >
                <Send className="w-4 h-4" /> Envoyer à l’admin
              </button>
            )}
            {canValidate && (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void persist({ statut: 'validee', markValidated: true, commentaire: commentaireAdmin || null })}
                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold"
                >
                  <CheckCircle className="w-4 h-4" /> Valider
                </button>
                <button
                  type="button"
                  disabled={saving || !commentaireAdmin.trim()}
                  onClick={() => void persist({ statut: 'a_revoir', markReturned: true, commentaire: commentaireAdmin })}
                  className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" /> Renvoyer
                </button>
              </>
            )}
            {canPrint && existing && (
              <button
                type="button"
                onClick={() => openFicheSourcingValideePrint(existing, typeFiche, { allowDraft: isAdmin })}
                className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg text-sm font-semibold"
              >
                <Printer className="w-4 h-4" /> Imprimer
              </button>
            )}
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-white/15 rounded-lg" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3 text-[13px]">
          {error && <div className="rounded-lg bg-red-50 text-red-800 border border-red-200 px-3 py-2 text-sm">{error}</div>}
          {message && <div className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2 text-sm">{message}</div>}
          {existing?.commentaire_admin && statut === 'a_revoir' && (
            <div className="rounded-lg bg-amber-50 text-amber-900 border border-amber-200 px-3 py-2 text-sm">
              <strong>Retour admin :</strong> {existing.commentaire_admin}
            </div>
          )}
          {locked && statut === 'soumise' && (
            <p className="text-sm text-slate-600">En attente de validation administrateur. Vous pourrez imprimer cette fiche (votre dossier) une fois validée.</p>
          )}
          {statut === 'validee' && (
            <p className="text-sm text-emerald-800">
              {isAdmin
                ? 'Fiche validée — vous pouvez encore la modifier, puis imprimer.'
                : 'Fiche validée — vous pouvez l’imprimer pour le dossier papier.'}
            </p>
          )}

          <div className="flex flex-wrap gap-4 items-center">
            <strong>Type réellement réalisé :</strong>
            <label className="inline-flex items-center gap-1">
              <input type="radio" disabled={locked} checked={typeFiche === 'cv'} onChange={() => setTypeFiche('cv')} />
              Demande de CV
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="radio" disabled={locked} checked={typeFiche === 'job_day'} onChange={() => setTypeFiche('job_day')} />
              Job Day
            </label>
            <span className="text-xs text-slate-500">
              (si l’entreprise a saisi Job Day mais l’action est un envoi de CV, cochez Demande de CV)
            </span>
          </div>

          {isAdmin && statut === 'soumise' && (
            <label className="block text-sm">
              Commentaire admin (obligatoire pour renvoyer)
              <textarea
                value={commentaireAdmin}
                onChange={(e) => setCommentaireAdmin(e.target.value)}
                className="mt-1 w-full border rounded-lg p-2 text-sm min-h-[56px]"
              />
            </label>
          )}

          <section>
            <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">1. Identification</h2>
            <table className="w-full border-collapse text-[12px]">
              <tbody>
                <tr>
                  <th className="border p-1 bg-slate-100 text-left">Référence</th>
                  <td className="border p-1"><Inp disabled={locked} value={d.reference} onChange={(v) => patch({ reference: v })} /></td>
                  <th className="border p-1 bg-slate-100 text-left">Ouverture</th>
                  <td className="border p-1"><Inp disabled={locked} value={d.date_ouverture} onChange={(v) => patch({ date_ouverture: v })} /></td>
                </tr>
                <tr>
                  <th className="border p-1 bg-slate-100 text-left">Conseiller(ère)</th>
                  <td className="border p-1"><Inp disabled={locked} value={d.conseiller} onChange={(v) => patch({ conseiller: v })} /></td>
                  <th className="border p-1 bg-slate-100 text-left">{typeFiche === 'job_day' ? 'Date Job Day' : 'Date limite'}</th>
                  <td className="border p-1"><Inp disabled={locked} value={d.date_action} onChange={(v) => patch({ date_action: v })} /></td>
                </tr>
                <tr>
                  <th className="border p-1 bg-slate-100 text-left">Entreprise</th>
                  <td className="border p-1" colSpan={3}><Inp disabled={locked} value={d.entreprise} onChange={(v) => patch({ entreprise: v })} /></td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">2. Besoins (pôle et filière)</h2>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border p-1">N°</th>
                  <th className="border p-1">Poste</th>
                  <th className="border p-1">Pôle</th>
                  <th className="border p-1">Filière</th>
                  <th className="border p-1">Niveau / contrat</th>
                  <th className="border p-1">Nb. postes</th>
                </tr>
              </thead>
              <tbody>
                {d.profils.map((p, i) => (
                  <tr key={i}>
                    <td className="border p-1 text-center">{i + 1}</td>
                    {(['poste', 'pole', 'filiere', 'niveau', 'nb_postes'] as const).map((k) => (
                      <td key={k} className="border p-1">
                        <Inp
                          disabled={locked}
                          value={p[k]}
                          onChange={(v) => {
                            const profils = [...d.profils]
                            profils[i] = { ...profils[i], [k]: v }
                            patch({ profils })
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-4 mt-1 text-sm font-semibold">
              <span>Profils recherchés : <Inp className="w-20 inline-block" disabled={locked} value={d.total_profils} onChange={(v) => patch({ total_profils: v })} /></span>
              <span>Postes à pourvoir : <Inp className="w-20 inline-block" disabled={locked} value={d.total_postes} onChange={(v) => patch({ total_postes: v })} /></span>
            </div>
          </section>

          {typeFiche === 'cv' ? (
            <>
              <section>
                <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">3. Déroulement</h2>
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border p-1 w-[36%]">Étape</th>
                      <th className="border p-1 w-[16%]">Date</th>
                      <th className="border p-1">Informations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ETAPES_CV.map((k) => (
                      <tr key={k.key}>
                        <td className="border p-1">{k.label}</td>
                        <td className="border p-1">
                          <Inp disabled={locked} value={d.etapes_cv?.[k.key]?.date || ''} onChange={(v) => patchEtape('etapes_cv', k.key, 'date', v)} />
                        </td>
                        <td className="border p-1">
                          <Inp disabled={locked} value={d.etapes_cv?.[k.key]?.info || ''} onChange={(v) => patchEtape('etapes_cv', k.key, 'info', v)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section>
                <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">4. Bilan</h2>
                <table className="w-full border-collapse text-[12px]">
                  <tbody>
                    {(
                      [
                        ['cv_recus', 'CV reçus'],
                        ['cv_preselectionnes', 'CV présélectionnés'],
                        ['cv_transmis', 'CV transmis'],
                        ['candidats_retenus', 'Candidats retenus'],
                        ['entretiens', 'Entretiens réalisés'],
                        ['recrutements', 'Recrutements réalisés'],
                      ] as const
                    ).map(([key, label]) => (
                      <tr key={key}>
                        <td className="border p-1">{label}</td>
                        <td className="border p-1 w-28">
                          <Inp disabled={locked} value={d.bilan[key]} onChange={(v) => patch({ bilan: { ...d.bilan, [key]: v } })} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section>
                <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">5. Statut</h2>
                <div className="grid grid-cols-2 gap-1 border p-2 text-[12px]">
                  {STATUT_ACTION_KEYS.map((k) => (
                    <label key={k.key} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={Boolean(d.statut_action?.[k.key])}
                        onChange={(e) => patch({ statut_action: { ...d.statut_action, [k.key]: e.target.checked } })}
                      />
                      {k.label}
                    </label>
                  ))}
                </div>
                <table className="w-full border-collapse text-[12px] mt-1">
                  <tbody>
                    <tr>
                      <th className="border p-1 bg-slate-100 text-left">Dernière MAJ</th>
                      <td className="border p-1"><Inp disabled={locked} value={d.date_maj} onChange={(v) => patch({ date_maj: v })} /></td>
                    </tr>
                    <tr>
                      <th className="border p-1 bg-slate-100 text-left">Prochaine action</th>
                      <td className="border p-1"><Inp disabled={locked} value={d.prochaine_action} onChange={(v) => patch({ prochaine_action: v })} /></td>
                    </tr>
                  </tbody>
                </table>
              </section>
              <section>
                <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">6. Pièces</h2>
                <div className="grid grid-cols-2 gap-1 border p-2 text-[12px]">
                  {PIECES_CV_KEYS.map((k) => (
                    <label key={k.key} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={Boolean(d.pieces_cv?.[k.key])}
                        onChange={(e) => patch({ pieces_cv: { ...d.pieces_cv, [k.key]: e.target.checked } })}
                      />
                      {k.label}
                    </label>
                  ))}
                </div>
                <Inp disabled={locked} value={d.pieces_autre} onChange={(v) => patch({ pieces_autre: v })} />
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">3. Préparation</h2>
                <table className="w-full border-collapse text-[12px]">
                  <tbody>
                    {ETAPES_PREP.map((k) => (
                      <tr key={k.key}>
                        <td className="border p-1 w-[36%]">{k.label}</td>
                        <td className="border p-1 w-[16%]">
                          <Inp disabled={locked} value={d.etapes_prep?.[k.key]?.date || ''} onChange={(v) => patchEtape('etapes_prep', k.key, 'date', v)} />
                        </td>
                        <td className="border p-1">
                          <Inp disabled={locked} value={d.etapes_prep?.[k.key]?.info || ''} onChange={(v) => patchEtape('etapes_prep', k.key, 'info', v)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section>
                <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">4. Réalisation</h2>
                <table className="w-full border-collapse text-[12px]">
                  <tbody>
                    {(
                      [
                        ['contactes', 'Candidats contactés'],
                        ['convoques', 'Candidats convoqués'],
                        ['confirmes', 'Candidats confirmés'],
                        ['presents', 'Candidats présents'],
                        ['absents', 'Candidats absents'],
                        ['taux_presence', 'Taux de présence (%)'],
                      ] as const
                    ).map(([key, label]) => (
                      <tr key={key}>
                        <td className="border p-1">{label}</td>
                        <td className="border p-1 w-28">
                          <Inp disabled={locked} value={d.realisation[key]} onChange={(v) => patch({ realisation: { ...d.realisation, [key]: v } })} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section>
                <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">5. Résultats</h2>
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border p-1">Poste</th>
                      <th className="border p-1">Reçus</th>
                      <th className="border p-1">Retenus</th>
                      <th className="border p-1">En attente</th>
                      <th className="border p-1">Recrutés</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.postes_job.map((p, i) => (
                      <tr key={i}>
                        {(['poste', 'recus', 'retenus', 'attente', 'recrutes'] as const).map((k) => (
                          <td key={k} className="border p-1">
                            <Inp
                              disabled={locked}
                              value={p[k]}
                              onChange={(v) => {
                                const postes_job = [...d.postes_job]
                                postes_job[i] = { ...postes_job[i], [k]: v }
                                patch({ postes_job })
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex gap-4 mt-1 text-sm font-semibold">
                  <span>Total retenus : <Inp className="w-20 inline-block" disabled={locked} value={d.total_retenus} onChange={(v) => patch({ total_retenus: v })} /></span>
                  <span>Total recrutements : <Inp className="w-20 inline-block" disabled={locked} value={d.total_recrutements} onChange={(v) => patch({ total_recrutements: v })} /></span>
                </div>
              </section>
              <section>
                <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">6. Suivi post Job Day</h2>
                <table className="w-full border-collapse text-[12px]">
                  <tbody>
                    {ETAPES_SUIVI.map((k) => (
                      <tr key={k.key}>
                        <td className="border p-1 w-[36%]">{k.label}</td>
                        <td className="border p-1 w-[16%]">
                          <Inp disabled={locked} value={d.etapes_suivi?.[k.key]?.date || ''} onChange={(v) => patchEtape('etapes_suivi', k.key, 'date', v)} />
                        </td>
                        <td className="border p-1">
                          <Inp disabled={locked} value={d.etapes_suivi?.[k.key]?.info || ''} onChange={(v) => patchEtape('etapes_suivi', k.key, 'info', v)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section>
                <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">7. Pièces</h2>
                <div className="grid grid-cols-2 gap-1 border p-2 text-[12px]">
                  {PIECES_JOB_KEYS.map((k) => (
                    <label key={k.key} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={Boolean(d.pieces_job?.[k.key])}
                        onChange={(e) => patch({ pieces_job: { ...d.pieces_job, [k.key]: e.target.checked } })}
                      />
                      {k.label}
                    </label>
                  ))}
                </div>
              </section>
            </>
          )}

          <section>
            <h2 className="bg-[#0f3d6c] text-white text-sm px-2 py-1">Observations</h2>
            <textarea
              disabled={locked}
              value={d.observations}
              onChange={(e) => patch({ observations: e.target.value })}
              className="w-full min-h-[72px] border p-2 text-sm disabled:bg-slate-50"
            />
          </section>
        </div>
      </div>
    </div>
  )
}
