'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  User,
  PenLine,
  LayoutGrid,
} from 'lucide-react'
import AgentLoginScreen from '@/components/notes/AgentLoginScreen'
import NotesConcoursGrilleForm from '@/components/notes/NotesConcoursGrilleForm'
import VideoPortalLayout from '@/components/video/VideoPortalLayout'
import { calcNote20From70, CANDIDAT_READONLY_FIELDS, isCandidatTraite } from '@/lib/notesConcoursConstants'
import { resolveGrilleCodeFromFiliere } from '@/lib/notesConcoursGrilleMapping'
import {
  getGrilleDefinition,
  initEmptyGrilleScores,
  validateGrilleScores,
  type NotesConcoursGrilleDefinition,
  type NotesConcoursGrilleObservations,
  type NotesConcoursGrilleScores,
} from '@/lib/notesConcoursGrilles'

type SaisieMode = 'direct' | 'grille'

const SAISIE_MODE_KEY = 'cop_notes_saisie_mode'

interface AgentInfo {
  id: string
  nom: string
}

interface CandidatInfo {
  id: string
  dr: string | null
  efp: string | null
  niveau_formation: string | null
  nom: string
  prenom: string
  id_inscription_concours_national: string
  cef: string
  niveau_scolaire: string | null
  moyenne: string | null
  branche: string | null
  categorie: string | null
  filiere: string | null
  numero_choix: string | null
  classement: string | null
  statut: string | null
  tel_1: string | null
  tel_2: string | null
  valide: string | null
  absent: string | null
  note_70: number | null
  note_20: number | null
}

interface GrilleMeta {
  code: string
  title?: string
  secteur?: string
  available: boolean
}

interface SavedSummary {
  prenom: string
  nom: string
  cef: string
  note70: number
  note20: number
  mode: SaisieMode
}

/** Champs affichés dans le panneau latéral (grille) — l'essentiel pour l'entretien */
const CANDIDAT_PANEL_FIELDS: { key: keyof CandidatInfo; label: string }[] = [
  { key: 'filiere', label: 'Filière' },
  { key: 'dr', label: 'DR' },
  { key: 'efp', label: 'EFP' },
  { key: 'branche', label: 'Branche' },
  { key: 'categorie', label: 'Catégorie' },
  { key: 'moyenne', label: 'Moyenne' },
  { key: 'niveau_scolaire', label: 'Niveau scolaire' },
  { key: 'classement', label: 'Classement' },
  { key: 'statut', label: 'Statut' },
  { key: 'tel_1', label: 'Téléphone' },
]

export default function SaisieNotesPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [agent, setAgent] = useState<AgentInfo | null>(null)
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [saisieMode, setSaisieMode] = useState<SaisieMode>('direct')
  const [cefSearch, setCefSearch] = useState('')
  const [candidat, setCandidat] = useState<CandidatInfo | null>(null)
  const [grilleMeta, setGrilleMeta] = useState<GrilleMeta | null>(null)
  const [note70, setNote70] = useState('')
  const [grilleScores, setGrilleScores] = useState<NotesConcoursGrilleScores>({})
  const [grilleObservations, setGrilleObservations] = useState<NotesConcoursGrilleObservations>({})
  const [searchLoading, setSearchLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [pageError, setPageError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [savedSummary, setSavedSummary] = useState<SavedSummary | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(SAISIE_MODE_KEY)
    if (saved === 'direct' || saved === 'grille') setSaisieMode(saved)
  }, [])

  const setMode = (mode: SaisieMode) => {
    setSaisieMode(mode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SAISIE_MODE_KEY, mode)
    }
  }

  const grilleDefinition: NotesConcoursGrilleDefinition | null = useMemo(() => {
    if (!candidat?.filiere) return null
    const code = resolveGrilleCodeFromFiliere(candidat.filiere)
    return code ? getGrilleDefinition(code) : null
  }, [candidat?.filiere])

  const checkSession = useCallback(async () => {
    const res = await fetch('/api/notes/agent/session')
    if (res.ok) {
      const json = await res.json()
      setAuthenticated(true)
      setAgent(json.agent)
      return true
    }
    setAuthenticated(false)
    return false
  }, [])

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  const resetCandidatForm = () => {
    setCandidat(null)
    setGrilleMeta(null)
    setNote70('')
    setGrilleScores({})
    setGrilleObservations({})
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch('/api/notes/agent/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Connexion impossible')
      setAuthenticated(true)
      setAgent(json.agent)
      setPassword('')
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/notes/agent/session', { method: 'DELETE' })
    setAuthenticated(false)
    setAgent(null)
    resetCandidatForm()
    setCefSearch('')
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const cef = cefSearch.trim()
    if (!cef) return
    setSearchLoading(true)
    setPageError('')
    setSuccessMsg('')
    setSavedSummary(null)
    try {
      const res = await fetch(`/api/notes/agent/candidats?cef=${encodeURIComponent(cef)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Recherche impossible')
      setCandidat(json.candidat)
      setGrilleMeta(json.grille ?? null)
      setNote70(json.candidat.note_70 != null ? String(json.candidat.note_70) : '')

      const code = resolveGrilleCodeFromFiliere(json.candidat.filiere)
      const def = code ? getGrilleDefinition(code) : null
      if (def) {
        setGrilleScores(initEmptyGrilleScores(def))
        setGrilleObservations({})
      }
    } catch (err: unknown) {
      resetCandidatForm()
      setPageError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSearchLoading(false)
    }
  }

  const previewNote20Direct =
    note70 !== '' && !Number.isNaN(Number(note70)) ? calcNote20From70(Number(note70)) : null

  const grilleTotal = useMemo(() => {
    if (!grilleDefinition) return null
    return Object.entries(grilleScores).reduce((s, [, v]) => s + (Number(v) || 0), 0)
  }, [grilleDefinition, grilleScores])

  const previewNote20Grille =
    grilleTotal != null && grilleTotal > 0 ? calcNote20From70(grilleTotal) : null

  const noteDejaSaisie = candidat != null && isCandidatTraite(candidat.note_70)

  const grilleModeBlocked =
    saisieMode === 'grille' &&
    candidat != null &&
    (!resolveGrilleCodeFromFiliere(candidat.filiere) || !grilleDefinition)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!candidat || noteDejaSaisie) return

    if (saisieMode === 'grille') {
      if (!grilleDefinition) {
        setPageError('Grille indisponible pour cette filière.')
        return
      }
      const validation = validateGrilleScores(grilleDefinition, grilleScores)
      if (!validation.valid) {
        setPageError(validation.errors[0] ?? 'Complétez tous les critères (1 à 5).')
        return
      }
    }

    setSaveLoading(true)
    setPageError('')
    setSuccessMsg('')
    try {
      const body =
        saisieMode === 'grille' && grilleDefinition
          ? {
              id: candidat.id,
              mode_saisie: 'grille' as const,
              grille_code: grilleDefinition.code,
              grille_scores: grilleScores,
              grille_observations: grilleObservations,
            }
          : {
              id: candidat.id,
              mode_saisie: 'direct' as const,
              note_70: Number(note70),
            }

      const res = await fetch('/api/notes/agent/candidats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Enregistrement impossible')

      const finalNote70 =
        saisieMode === 'grille' && grilleTotal != null ? grilleTotal : Number(note70)
      const finalNote20 = calcNote20From70(finalNote70)

      setSavedSummary({
        prenom: candidat.prenom,
        nom: candidat.nom,
        cef: candidat.cef,
        note70: finalNote70,
        note20: finalNote20,
        mode: saisieMode,
      })
      setSuccessMsg(json.message ?? 'Notes enregistrées.')
      resetCandidatForm()
      setCefSearch('')
      setTimeout(() => searchInputRef.current?.focus(), 100)
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaveLoading(false)
    }
  }

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#041a33]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <AgentLoginScreen
        login={login}
        password={password}
        loginError={loginError}
        loginLoading={loginLoading}
        onLoginChange={setLogin}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    )
  }

  return (
    <VideoPortalLayout
      variant="formateur"
      badge="Agent de saisie"
      title="Saisie des notes"
      subtitle={`Connecté : ${agent?.nom ?? ''}`}
      wide
      showHero={!(candidat && saisieMode === 'grille')}
      footer={
        <p className="text-xs text-blue-100/70">
          Recherche par CEF — saisie directe /70 ou par grille selon la filière
        </p>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-white/25 bg-white/10 p-1">
          <button
            type="button"
            onClick={() => setMode('direct')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              saisieMode === 'direct' ? 'bg-white text-[#0f4c81]' : 'text-white hover:bg-white/10'
            }`}
          >
            <PenLine className="w-4 h-4" />
            Saisie /70
          </button>
          <button
            type="button"
            onClick={() => setMode('grille')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              saisieMode === 'grille' ? 'bg-white text-[#0f4c81]' : 'text-white hover:bg-white/10'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Saisie par grille
          </button>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-white/10 text-white rounded-xl hover:bg-white/20 border border-white/20"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>

      {pageError && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-red-500/20 border border-red-400/40 rounded-xl text-red-100 text-sm max-w-3xl mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {pageError}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-100 text-sm max-w-3xl mx-auto">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <div
        className={`bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl overflow-hidden mx-auto z-20 ${
          saisieMode === 'grille' && candidat ? 'max-w-[96rem] w-full' : 'max-w-4xl'
        }`}
      >
        <div className="bg-gradient-to-r from-[#0a3560] to-[#0f4c81] px-6 py-4 text-white flex items-center gap-3">
          <Search className="w-5 h-5" />
          <h2 className="font-semibold">Rechercher un candidat (CEF)</h2>
        </div>
        <form onSubmit={handleSearch} className="p-6 border-b flex flex-wrap gap-3 bg-white">
          <input
            ref={searchInputRef}
            type="text"
            value={cefSearch}
            onChange={(e) => setCefSearch(e.target.value)}
            placeholder="Saisir le CEF du candidat suivant…"
            className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
            required
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="px-6 py-2.5 bg-[#0f4c81] text-white font-medium rounded-xl hover:opacity-95 disabled:opacity-60 flex items-center gap-2"
          >
            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Rechercher
          </button>
        </form>

        {searchLoading && (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-gray-500 border-t border-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f4c81]" />
            <p className="text-sm">Chargement du candidat…</p>
          </div>
        )}

        {!candidat && !searchLoading && (
          <div className="p-8 border-t border-gray-100">
            {savedSummary ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="font-semibold text-emerald-900">
                  {savedSummary.mode === 'grille'
                    ? 'Grille enregistrée avec succès'
                    : 'Note enregistrée avec succès'}
                </p>
                <p className="text-sm text-emerald-800">
                  {savedSummary.prenom} {savedSummary.nom}{' '}
                  <span className="font-mono text-emerald-700">(CEF {savedSummary.cef})</span>
                </p>
                <p className="text-lg font-bold text-[#0f4c81]">
                  {savedSummary.note70}/70 — {savedSummary.note20}/20
                </p>
                <p className="text-sm text-gray-600 pt-2">
                  Saisissez le CEF du candidat suivant ci-dessus.
                </p>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400">
                Recherchez un candidat par CEF pour afficher la fiche et la grille de notation.
              </p>
            )}
          </div>
        )}

        {candidat && !searchLoading && saisieMode === 'grille' && (
          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 lg:grid-cols-[minmax(260px,300px)_1fr] min-h-[calc(100vh-11rem)] max-h-[calc(100vh-8rem)]"
          >
            {/* Panneau candidat — gauche, fixe */}
            <aside className="border-b lg:border-b-0 lg:border-r border-gray-100 bg-slate-50/80 p-4 flex flex-col gap-4 overflow-y-auto overscroll-contain">
              <div>
                <div className="flex items-start gap-2">
                  <User className="w-5 h-5 text-[#0f4c81] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 leading-tight">
                      {candidat.prenom} {candidat.nom}
                    </h3>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">CEF {candidat.cef}</p>
                    {grilleMeta?.code && (
                      <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                        Grille {grilleMeta.code}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <dl className="space-y-2 text-xs flex-1 min-h-0">
                {CANDIDAT_PANEL_FIELDS.map(({ key, label }) => {
                  const v = candidat[key]
                  return (
                    <div key={key} className="grid grid-cols-[88px_1fr] gap-1.5 items-start">
                      <dt className="text-gray-500 shrink-0">{label}</dt>
                      <dd className="font-medium text-gray-800 break-words">
                        {v == null || v === '' ? '—' : String(v)}
                      </dd>
                    </div>
                  )
                })}
              </dl>

              {noteDejaSaisie ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 shrink-0">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Note déjà saisie
                  </p>
                  <p className="mt-1">
                    {candidat.note_70}/70 — {candidat.note_20}/20
                  </p>
                </div>
              ) : grilleModeBlocked ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 shrink-0">
                  {resolveGrilleCodeFromFiliere(candidat.filiere) ? (
                    <p>Grille {grilleMeta?.code} non intégrée — passez en saisie /70.</p>
                  ) : (
                    <p>Aucune grille pour « {candidat.filiere ?? '—'} ».</p>
                  )}
                </div>
              ) : grilleDefinition ? (
                <div className="space-y-3 shrink-0 pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white border border-teal-200 px-3 py-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Total /70</p>
                      <p className="text-lg font-bold text-[#0f4c81]">{grilleTotal ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Note /20</p>
                      <p className="text-lg font-bold text-gray-800">
                        {previewNote20Grille != null ? previewNote20Grille : '—'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60"
                  >
                    {saveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Valider la grille
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </aside>

            {/* Grille — droite */}
            <div className="p-4 min-h-0 overflow-y-auto overscroll-contain bg-white">
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="w-4 h-4 text-teal-600" />
                <h4 className="font-semibold text-gray-900 text-sm">Grille d&apos;évaluation</h4>
              </div>

              {noteDejaSaisie || grilleModeBlocked ? (
                <p className="text-sm text-gray-500">
                  Consultez le panneau de gauche — saisie impossible pour ce candidat.
                </p>
              ) : grilleDefinition ? (
                <NotesConcoursGrilleForm
                  layout="compact"
                  definition={grilleDefinition}
                  scores={grilleScores}
                  observations={grilleObservations}
                  disabled={saveLoading}
                  onScoreChange={(id, value) =>
                    setGrilleScores((prev) => ({ ...prev, [id]: value }))
                  }
                  onObservationChange={(id, value) =>
                    setGrilleObservations((prev) => ({ ...prev, [id]: value }))
                  }
                />
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                  Impossible d&apos;afficher la grille pour cette filière.
                </div>
              )}
            </div>
          </form>
        )}

        {candidat && !searchLoading && saisieMode !== 'grille' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-gray-800">
              <User className="w-5 h-5 text-[#0f4c81]" />
              <h3 className="font-bold text-lg">
                {candidat.prenom} {candidat.nom}
              </h3>
              <span className="text-sm text-gray-500 font-mono">CEF {candidat.cef}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {CANDIDAT_READONLY_FIELDS.map(({ key, label }) => (
                <div key={key} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <span className="text-xs text-gray-500 block">{label}</span>
                  <span className="font-medium text-gray-800">
                    {(() => {
                      const v = candidat[key as keyof CandidatInfo]
                      if (v == null || v === '') return '—'
                      return String(v)
                    })()}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSave} className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <PenLine className="w-5 h-5 text-violet-600" />
                <h4 className="font-semibold text-gray-900">Saisie des notes</h4>
              </div>

              {noteDejaSaisie ? (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold">Note déjà saisie</p>
                    <p>
                      Ce candidat a déjà une note enregistrée ({candidat.note_70}/70 —{' '}
                      {candidat.note_20}/20). Merci de contacter l&apos;administrateur pour toute
                      modification.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Note /70 *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={70}
                        step={0.01}
                        value={note70}
                        onChange={(e) => setNote70(e.target.value)}
                        className="w-full px-4 py-2.5 border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 bg-violet-50/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Note /20 (calculée)
                      </label>
                      <div className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-700 font-semibold">
                        {previewNote20Direct != null ? previewNote20Direct : '—'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-60"
                  >
                    {saveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Valider et enregistrer
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>
        )}
      </div>
    </VideoPortalLayout>
  )
}
