'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  User,
  PenLine,
} from 'lucide-react'
import AgentLoginScreen from '@/components/notes/AgentLoginScreen'
import VideoPortalLayout from '@/components/video/VideoPortalLayout'
import { calcNote20From70, CANDIDAT_READONLY_FIELDS } from '@/lib/notesConcoursConstants'

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

export default function SaisieNotesPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [agent, setAgent] = useState<AgentInfo | null>(null)
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [cefSearch, setCefSearch] = useState('')
  const [candidat, setCandidat] = useState<CandidatInfo | null>(null)
  const [note70, setNote70] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [pageError, setPageError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

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
    setCandidat(null)
    setCefSearch('')
    setNote70('')
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const cef = cefSearch.trim()
    if (!cef) return
    setSearchLoading(true)
    setPageError('')
    setSuccessMsg('')
    setCandidat(null)
    try {
      const res = await fetch(`/api/notes/agent/candidats?cef=${encodeURIComponent(cef)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Recherche impossible')
      setCandidat(json.candidat)
      setNote70(json.candidat.note_70 != null ? String(json.candidat.note_70) : '')
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!candidat) return
    setSaveLoading(true)
    setPageError('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/notes/agent/candidats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: candidat.id, note_70: Number(note70) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Enregistrement impossible')
      setCandidat(json.candidat)
      setSuccessMsg(json.message ?? 'Notes enregistrées.')
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaveLoading(false)
    }
  }

  const previewNote20 =
    note70 !== '' && !Number.isNaN(Number(note70))
      ? calcNote20From70(Number(note70))
      : null

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
      footer={
        <p className="text-xs text-blue-100/70">
          Recherche par CEF — seule la note /70 est modifiable
        </p>
      }
    >
      <div className="mb-4 flex justify-end">
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

      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl overflow-hidden max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-[#0a3560] to-[#0f4c81] px-6 py-4 text-white flex items-center gap-3">
          <Search className="w-5 h-5" />
          <h2 className="font-semibold">Rechercher un candidat (CEF)</h2>
        </div>
        <form onSubmit={handleSearch} className="p-6 border-b flex flex-wrap gap-3">
          <input
            type="text"
            value={cefSearch}
            onChange={(e) => setCefSearch(e.target.value)}
            placeholder="Numéro CEF"
            className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
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

        {candidat && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-gray-800">
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
                    {(candidat[key as keyof CandidatInfo] as string) ?? '—'}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSave} className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <PenLine className="w-5 h-5 text-violet-600" />
                <h4 className="font-semibold text-gray-900">Saisie des notes</h4>
              </div>
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
                    {previewNote20 != null ? previewNote20 : '—'}
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={saveLoading}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-60"
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
            </form>
          </div>
        )}
      </div>
    </VideoPortalLayout>
  )
}
