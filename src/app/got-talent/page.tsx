'use client'

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import {
  GOT_TALENT_CATEGORIES,
  GotTalentActivite,
  GotTalentCategorie,
} from '@/lib/gotTalentConfig'
import {
  AlertCircle,
  CheckCircle2,
  Dumbbell,
  Leaf,
  Lightbulb,
  Loader2,
  Palette,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import './got-talent.css'

function GotTalentBackground() {
  return (
    <>
      <div className="got-talent-bg" aria-hidden="true">
        <Image
          src="/bg-entreprise.jpg"
          alt=""
          fill
          priority
          quality={85}
          sizes="100vw"
          className="got-talent-bg-image"
        />
      </div>
      <div className="got-talent-bg-overlay" aria-hidden="true" />
    </>
  )
}

type SelectedActivite = {
  categorie: GotTalentCategorie
  activite: string
  autre: string
}

type FieldKey =
  | 'nom'
  | 'prenom'
  | 'groupe'
  | 'telephone'
  | 'email'
  | 'pole'
  | 'filliere'

const MAX_ACTIVITES = 2
const DRAFT_KEY = 'got-talent-draft-v1'
const STEPS = [
  { id: 1, label: 'Identification' },
  { id: 2, label: 'Activités' },
  { id: 3, label: 'Validation' },
] as const

const CATEGORY_ICONS: Record<GotTalentCategorie, React.ElementType> = {
  sportives: Dumbbell,
  culturelles: Palette,
  environnementales: Leaf,
  innovation: Lightbulb,
}

function selectionKey(categorie: GotTalentCategorie, activite: string, autre: string) {
  return `${categorie}::${activite === 'Autre' ? autre.trim() : activite}`
}

const inputBase =
  'mt-1.5 w-full min-h-[48px] px-4 py-2.5 rounded-xl border bg-white text-[15px] text-slate-900 placeholder:text-slate-400 transition-colors'
const inputOk = `${inputBase} border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none`
const inputErr = `${inputBase} border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none`

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function validatePhone(value: string) {
  return value.replace(/\D/g, '').length >= 9
}

type RefPole = { id: string; nom: string; actif?: boolean }
type RefFiliere = { id: string; nom: string; pole_id: string; actif?: boolean }

function GotTalentPageContent() {
  const searchParams = useSearchParams()
  const isKiosk = searchParams.get('kiosk') === '1'
  const [poles, setPoles] = useState<RefPole[]>([])
  const [filieres, setFilieres] = useState<RefFiliere[]>([])
  const [referentielsLoading, setReferentielsLoading] = useState(true)
  const [referentielsError, setReferentielsError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(1)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})

  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [pole, setPole] = useState('')
  const [filliere, setFilliere] = useState('')
  const [groupe, setGroupe] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [consentement, setConsentement] = useState(false)
  const [selected, setSelected] = useState<SelectedActivite[]>([])
  const [autreDraft, setAutreDraft] = useState<Record<string, string>>({})
  const [expandedAutre, setExpandedAutre] = useState<Record<string, boolean>>({})

  const sectionIdentificationRef = useRef<HTMLElement>(null)
  const sectionActivitesRef = useRef<HTMLElement>(null)
  const sectionValidationRef = useRef<HTMLElement>(null)
  const errorBannerRef = useRef<HTMLDivElement>(null)

  const filieresFiltered = useMemo(() => {
    if (!pole) return []
    const p = poles.find((x) => x.nom === pole)
    return p ? filieres.filter((f) => f.pole_id === p.id) : []
  }, [pole, poles, filieres])

  useEffect(() => {
    const loadReferentiels = async () => {
      try {
        setReferentielsLoading(true)
        setReferentielsError(null)
        const res = await fetch('/api/got-talent/referentiels')
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Impossible de charger les pôles et filières.')
        }
        setPoles(data.poles ?? [])
        setFilieres(data.filieres ?? [])
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur de chargement des référentiels.'
        setReferentielsError(msg)
      } finally {
        setReferentielsLoading(false)
      }
    }
    loadReferentiels()
  }, [])

  const validateField = useCallback((key: FieldKey, values?: {
    nom: string; prenom: string; groupe: string; telephone: string; email: string; pole: string; filliere: string
  }): string | undefined => {
    const v = values ?? { nom, prenom, groupe, telephone, email, pole, filliere }
    switch (key) {
      case 'nom':
        return v.nom.trim().length < 2 ? 'Le nom est obligatoire (2 caractères min.).' : undefined
      case 'prenom':
        return v.prenom.trim().length < 2 ? 'Le prénom est obligatoire (2 caractères min.).' : undefined
      case 'groupe':
        return v.groupe.trim().length < 1 ? 'Le groupe est obligatoire.' : undefined
      case 'telephone':
        return !validatePhone(v.telephone) ? 'Numéro de téléphone invalide (9 chiffres min.).' : undefined
      case 'email':
        return !validateEmail(v.email) ? 'Adresse email invalide.' : undefined
      case 'pole':
        return !v.pole ? 'Sélectionnez un pôle.' : undefined
      case 'filliere':
        return !v.filliere ? 'Sélectionnez une filière.' : undefined
      default:
        return undefined
    }
  }, [nom, prenom, groupe, telephone, email, pole, filliere])

  const identificationComplete = useMemo(() => {
    const keys: FieldKey[] = ['nom', 'prenom', 'groupe', 'telephone', 'email', 'pole', 'filliere']
    return keys.every((k) => !validateField(k))
  }, [validateField])

  const canSubmit =
    identificationComplete && selected.length >= 1 && consentement && !submitting

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as Record<string, unknown>
      if (typeof draft.nom === 'string') setNom(draft.nom)
      if (typeof draft.prenom === 'string') setPrenom(draft.prenom)
      if (typeof draft.pole === 'string') setPole(draft.pole)
      if (typeof draft.filliere === 'string') setFilliere(draft.filliere)
      if (typeof draft.groupe === 'string') setGroupe(draft.groupe)
      if (typeof draft.telephone === 'string') setTelephone(draft.telephone)
      if (typeof draft.email === 'string') setEmail(draft.email)
      if (typeof draft.consentement === 'boolean') setConsentement(draft.consentement)
      if (Array.isArray(draft.selected)) setSelected(draft.selected as SelectedActivite[])
      if (draft.autreDraft && typeof draft.autreDraft === 'object') {
        setAutreDraft(draft.autreDraft as Record<string, string>)
      }
    } catch {
      /* ignore corrupt draft */
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            nom,
            prenom,
            pole,
            filliere,
            groupe,
            telephone,
            email,
            consentement,
            selected,
            autreDraft,
          })
        )
      } catch {
        /* storage full */
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [nom, prenom, pole, filliere, groupe, telephone, email, consentement, selected, autreDraft])

  useEffect(() => {
    const sections = [
      { ref: sectionIdentificationRef, step: 1 },
      { ref: sectionActivitesRef, step: 2 },
      { ref: sectionValidationRef, step: 3 },
    ]

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) {
          const match = sections.find((s) => s.ref.current === visible[0].target)
          if (match) setActiveStep(match.step)
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.3, 0.6] }
    )

    sections.forEach(({ ref }) => {
      if (ref.current) observer.observe(ref.current)
    })
    return () => observer.disconnect()
  }, [])

  const markTouched = (key: FieldKey) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
    const err = validateField(key)
    setFieldErrors((prev) => ({ ...prev, [key]: err }))
  }

  const toggleActivite = (categorie: GotTalentCategorie, activite: string) => {
    const draftKey = `${categorie}-${activite}`
    const autre = (autreDraft[draftKey] ?? '').trim()
    const key = selectionKey(categorie, activite, autre)
    const exists = selected.some((s) => selectionKey(s.categorie, s.activite, s.autre) === key)

    if (exists) {
      setSelected((prev) =>
        prev.filter((s) => selectionKey(s.categorie, s.activite, s.autre) !== key)
      )
      setError(null)
      return
    }

    if (selected.length >= MAX_ACTIVITES) {
      setError('Vous pouvez sélectionner au maximum 2 activités.')
      sectionActivitesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    if (activite === 'Autre' && autre.trim().length < 2) {
      setExpandedAutre((prev) => ({ ...prev, [draftKey]: true }))
      setError('Précisez votre activité dans le champ « Autre ».')
      return
    }

    setError(null)
    setSelected((prev) => [
      ...prev,
      { categorie, activite, autre: activite === 'Autre' ? autre.trim() : '' },
    ])
  }

  const isChecked = (categorie: GotTalentCategorie, activite: string) => {
    const autre = autreDraft[`${categorie}-${activite}`] ?? ''
    const key = selectionKey(categorie, activite, autre)
    return selected.some((s) => selectionKey(s.categorie, s.activite, s.autre) === key)
  }

  const isAutreChecked = (categorie: GotTalentCategorie) => isChecked(categorie, 'Autre')

  const scrollToFirstError = (errors: Partial<Record<FieldKey, string>>) => {
    const order: FieldKey[] = ['nom', 'prenom', 'groupe', 'telephone', 'email', 'pole', 'filliere']
    const first = order.find((k) => errors[k])
    if (first) {
      sectionIdentificationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const el = document.getElementById(`gt-${first}`)
      el?.focus()
      return
    }
    if (selected.length < 1) {
      sectionActivitesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (!consentement) {
      sectionValidationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)

    const keys: FieldKey[] = ['nom', 'prenom', 'groupe', 'telephone', 'email', 'pole', 'filliere']
    const errors: Partial<Record<FieldKey, string>> = {}
    keys.forEach((k) => {
      const err = validateField(k)
      if (err) errors[k] = err
    })
    setFieldErrors(errors)
    setTouched(Object.fromEntries(keys.map((k) => [k, true])) as Partial<Record<FieldKey, boolean>>)

    if (Object.keys(errors).length > 0) {
      setError('Veuillez corriger les champs signalés dans la section Identification.')
      scrollToFirstError(errors)
      return
    }

    if (selected.length < 1) {
      setError('Choisissez au moins une activité parascolaire.')
      sectionActivitesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    if (!consentement) {
      setError('Vous devez accepter le consentement éclairé.')
      sectionValidationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    const activites: GotTalentActivite[] = selected.map((s) => ({
      categorie: s.categorie,
      activite: s.activite,
      ...(s.activite === 'Autre' ? { autre: s.autre } : {}),
    }))

    setSubmitting(true)
    try {
      const res = await fetch('/api/got-talent/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          prenom: prenom.trim(),
          pole,
          filliere,
          groupe: groupe.trim(),
          telephone: telephone.trim(),
          email: email.trim(),
          consentement: true,
          activites,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || data.error || "Erreur lors de l'inscription.")
        errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      localStorage.removeItem(DRAFT_KEY)
      setReference(data.reference ?? null)
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Erreur réseau. Réessayez.')
      errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (
    key: FieldKey,
    label: string,
    required: boolean,
    node: React.ReactNode
  ) => (
    <div>
      <label htmlFor={`gt-${key}`} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-orange-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {node}
      {touched[key] && fieldErrors[key] && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {fieldErrors[key]}
        </p>
      )}
    </div>
  )

  if (success) {
    return (
      <div className={`got-talent-page${isKiosk ? ' got-talent-kiosk' : ''} flex items-center justify-center p-4`}>
        {!isKiosk && <GotTalentBackground />}
        <div
          className={`got-talent-content w-full max-w-lg rounded-2xl shadow-xl p-8 sm:p-10 text-center${isKiosk ? ' bg-white border border-slate-200' : ' bg-white/98 backdrop-blur-sm border border-white/60'}`}
          role="status"
          aria-live="polite"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Inscription enregistrée
          </h1>
          <p className="text-slate-600 text-base mb-1">
            Votre inscription a bien été enregistrée.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Merci {prenom} {nom}, à bientôt dans vos clubs parascolaires !
          </p>
          {reference && (
            <div className="inline-block px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 mb-6 font-mono">
              Référence : <strong>{reference}</strong>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              window.location.href = isKiosk ? '/got-talent/ecran' : window.location.pathname
            }}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            Terminer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`got-talent-page${isKiosk ? ' got-talent-kiosk' : ''}`}>
      {!isKiosk && <GotTalentBackground />}
      {isKiosk && (
        <div className="got-talent-kiosk-bar">
          <a href="/got-talent/ecran">← Accueil écran</a>
          <span className="text-white text-base font-bold tracking-wide">OFPPT GOT TALENTS</span>
          <button type="button" onClick={() => window.location.reload()}>
            Recharger
          </button>
        </div>
      )}
      <div
        className={`got-talent-content mx-auto w-full${isKiosk ? ' px-4 py-3 sm:py-4' : ' px-4 sm:px-6 py-6 sm:py-10 max-w-[1024px]'}`}
      >
        {isKiosk ? (
          <nav className="got-talent-kiosk-steps" aria-label="Progression du formulaire">
            {STEPS.map((step) => {
              const done = activeStep > step.id
              const current = activeStep === step.id
              return (
                <div
                  key={step.id}
                  className={`got-talent-kiosk-step${current ? ' active' : ''}${done ? ' done' : ''}`}
                  aria-current={current ? 'step' : undefined}
                >
                  <span>{done ? '✓' : `0${step.id}`}</span>
                  <span>{step.label}</span>
                </div>
              )
            })}
          </nav>
        ) : (
        <header className="text-center mb-6 sm:mb-8">
          <div className="got-talent-header-glass rounded-2xl sm:rounded-3xl px-4 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-5 sm:gap-8 mb-5">
              <Image
                src="/logo CMC-01.png"
                alt="Logo CMC"
                width={88}
                height={88}
                className="h-14 sm:h-[72px] w-auto drop-shadow-md"
                priority
              />
              <Image
                src="/LOGO CMC COP-01.png"
                alt="Logo CMC COP"
                width={100}
                height={88}
                className="h-14 sm:h-[72px] w-auto drop-shadow-md"
                priority
              />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/25 border border-violet-300/30 text-violet-100 text-xs sm:text-sm font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Clubs parascolaires
            </span>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-2 drop-shadow-sm">
              OFPPT GOT TALENTS
            </h1>
            <p className="text-slate-200/95 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Inscrivez-vous aux activités parascolaires de votre établissement — sport, culture,
              environnement et innovation.
            </p>

            {/* Stepper — desktop (dans le bandeau) */}
            <nav
              className="hidden sm:flex items-center justify-center gap-2 mt-6 pt-5 border-t border-white/10"
              aria-label="Progression du formulaire"
            >
          {STEPS.map((step, index) => {
            const done = activeStep > step.id
            const current = activeStep === step.id
            return (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                    current
                      ? 'bg-violet-500/20 border border-violet-400/40'
                      : done
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-transparent border border-transparent'
                  }`}
                  aria-current={current ? 'step' : undefined}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      current
                        ? 'bg-violet-500 text-white'
                        : done
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {done ? '✓' : `0${step.id}`}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      current ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="w-8 h-px bg-slate-600" aria-hidden="true" />
                )}
              </React.Fragment>
            )
          })}
            </nav>

            {/* Stepper — mobile */}
            <p className="sm:hidden text-center text-sm text-slate-200 mt-5 pt-4 border-t border-white/10" aria-live="polite">
              Étape {activeStep} sur 3 — {STEPS[activeStep - 1].label}
            </p>
          </div>
        </header>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate>
          {/* 1. Identification */}
          <section
            ref={sectionIdentificationRef}
            id="section-identification"
            className={`rounded-2xl shadow-sm overflow-hidden got-talent-section ${isKiosk ? 'bg-white border border-slate-200' : 'bg-white/98 backdrop-blur-sm border border-white/70'}`}
            aria-labelledby="gt-heading-id"
          >
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h2 id="gt-heading-id" className={`font-semibold text-slate-900 ${isKiosk ? 'text-xl' : 'text-lg'}`}>
                1. Identification
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Renseignez vos informations personnelles
              </p>
            </div>
            <div className={`p-5 sm:p-6 grid gap-4 sm:gap-5 gt-identification-grid ${isKiosk ? '' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {renderField(
                'nom',
                'Nom',
                true,
                <input
                  id="gt-nom"
                  type="text"
                  autoComplete="family-name"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  onBlur={() => markTouched('nom')}
                  className={touched.nom && fieldErrors.nom ? inputErr : inputOk}
                />
              )}
              {renderField(
                'prenom',
                'Prénom',
                true,
                <input
                  id="gt-prenom"
                  type="text"
                  autoComplete="given-name"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  onBlur={() => markTouched('prenom')}
                  className={touched.prenom && fieldErrors.prenom ? inputErr : inputOk}
                />
              )}
              {renderField(
                'telephone',
                'Téléphone',
                true,
                <input
                  id="gt-telephone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  onBlur={() => markTouched('telephone')}
                  className={touched.telephone && fieldErrors.telephone ? inputErr : inputOk}
                />
              )}
              {renderField(
                'email',
                'Email',
                true,
                <input
                  id="gt-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched('email')}
                  className={touched.email && fieldErrors.email ? inputErr : inputOk}
                />
              )}
              {renderField(
                'pole',
                'Pôle',
                true,
                <select
                  id="gt-pole"
                  value={pole}
                  onChange={(e) => {
                    setPole(e.target.value)
                    setFilliere('')
                    markTouched('pole')
                  }}
                  onBlur={() => markTouched('pole')}
                  disabled={referentielsLoading}
                  className={`${touched.pole && fieldErrors.pole ? inputErr : inputOk} appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {referentielsLoading ? 'Chargement…' : 'Sélectionner un pôle'}
                  </option>
                  {poles.map((p) => (
                    <option key={p.id} value={p.nom}>
                      {p.nom}
                    </option>
                  ))}
                </select>
              )}
              {renderField(
                'filliere',
                'Filière',
                true,
                <select
                  id="gt-filliere"
                  value={filliere}
                  onChange={(e) => {
                    setFilliere(e.target.value)
                    markTouched('filliere')
                  }}
                  onBlur={() => markTouched('filliere')}
                  disabled={!pole || referentielsLoading}
                  className={`${touched.filliere && fieldErrors.filliere ? inputErr : inputOk} appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {!pole
                      ? 'Choisissez d\'abord un pôle'
                      : referentielsLoading
                        ? 'Chargement…'
                        : 'Sélectionner une filière'}
                  </option>
                  {filieresFiltered.map((f) => (
                    <option key={f.id} value={f.nom}>
                      {f.nom}
                    </option>
                  ))}
                </select>
              )}
              {renderField(
                'groupe',
                'Groupe',
                true,
                <input
                  id="gt-groupe"
                  type="text"
                  value={groupe}
                  onChange={(e) => setGroupe(e.target.value)}
                  onBlur={() => markTouched('groupe')}
                  className={touched.groupe && fieldErrors.groupe ? inputErr : inputOk}
                />
              )}
            </div>
            {referentielsError && (
              <div className="mx-5 sm:mx-6 mb-5 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                {referentielsError}
              </div>
            )}
          </section>

          {/* 2. Activités */}
          <section
            ref={sectionActivitesRef}
            id="section-activites"
            className={`rounded-2xl shadow-sm overflow-hidden got-talent-section ${isKiosk ? 'bg-white border border-slate-200' : 'bg-white/98 backdrop-blur-sm border border-white/70'}`}
            aria-labelledby="gt-heading-act"
          >
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 id="gt-heading-act" className={`font-semibold text-slate-900 ${isKiosk ? 'text-xl' : 'text-lg'}`}>
                  2. Choisissez vos activités
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">Sélectionnez 1 à 2 activités</p>
              </div>
              <div
                className={`inline-flex items-center self-start sm:self-auto px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  selected.length === MAX_ACTIVITES
                    ? 'bg-violet-100 text-violet-800'
                    : 'bg-orange-50 text-orange-700'
                }`}
                aria-live="polite"
              >
                {selected.length} / {MAX_ACTIVITES} sélectionnée(s)
              </div>
            </div>
            <div className={`p-5 sm:p-6 grid gap-4 gt-activities-grid ${isKiosk ? '' : 'grid-cols-1 md:grid-cols-2'}`}>
              {GOT_TALENT_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id]
                const hasSelectionInCat = selected.some((s) => s.categorie === cat.id)
                return (
                  <article
                    key={cat.id}
                    className={`rounded-2xl border transition-all duration-200 ${
                      hasSelectionInCat
                        ? 'border-violet-400 ring-2 ring-violet-500/15 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          hasSelectionInCat ? 'bg-violet-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="gt-activity-card-title font-semibold text-slate-900 text-[15px] leading-snug">
                          {cat.label}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{cat.subtitle}</p>
                      </div>
                    </div>
                    <ul className="p-3 space-y-1.5" role="group" aria-label={cat.label}>
                      {cat.activities.map((activite) => {
                        const draftKey = `${cat.id}-${activite}`
                        const checked = isChecked(cat.id, activite)
                        const atMax = selected.length >= MAX_ACTIVITES && !checked
                        const inputId = `gt-act-${cat.id}-${activite.replace(/\s/g, '-')}`
                        return (
                          <li key={activite}>
                            <label
                              htmlFor={inputId}
                              className={`gt-activity-label flex items-center gap-3 min-h-[44px] px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-violet-50 border border-violet-200'
                                  : atMax
                                    ? 'opacity-45 cursor-not-allowed'
                                    : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              <input
                                id={inputId}
                                type="checkbox"
                                checked={checked}
                                disabled={atMax}
                                onChange={() => toggleActivite(cat.id, activite)}
                                className="w-[18px] h-[18px] rounded border-slate-300 text-violet-600 focus:ring-violet-500/30 shrink-0"
                              />
                              <span className="text-sm text-slate-800">{activite}</span>
                              {checked && (
                                <CheckCircle2
                                  className="w-4 h-4 text-violet-600 ml-auto shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                            </label>
                            {activite === 'Autre' &&
                              (isAutreChecked(cat.id) || expandedAutre[draftKey]) && (
                              <div className="px-3 pb-2 pt-1">
                                <label htmlFor={`${inputId}-autre`} className="sr-only">
                                  Précisez l&apos;activité autre pour {cat.label}
                                </label>
                                <input
                                  id={`${inputId}-autre`}
                                  type="text"
                                  placeholder="Précisez votre activité…"
                                  value={autreDraft[draftKey] ?? ''}
                                  onChange={(e) =>
                                    setAutreDraft((prev) => ({
                                      ...prev,
                                      [draftKey]: e.target.value,
                                    }))
                                  }
                                  onBlur={() => {
                                    const val = (autreDraft[draftKey] ?? '').trim()
                                    if (val.length >= 2 && !isChecked(cat.id, 'Autre')) {
                                      toggleActivite(cat.id, 'Autre')
                                    }
                                  }}
                                  className={`${inputOk} text-sm min-h-[44px]`}
                                />
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </article>
                )
              })}
            </div>
          </section>

          {/* 3. Consentement + CTA */}
          <section
            ref={sectionValidationRef}
            id="section-validation"
            className={`rounded-2xl shadow-sm overflow-hidden got-talent-section ${isKiosk ? 'bg-white border border-slate-200' : 'bg-white/98 backdrop-blur-sm border border-white/70'}`}
            aria-labelledby="gt-heading-consent"
          >
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h2 id="gt-heading-consent" className={`font-semibold text-slate-900 ${isKiosk ? 'text-xl' : 'text-lg'}`}>
                3. Consentement
              </h2>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Je prends connaissance de ma participation aux activités parascolaires et
                j&apos;accepte que mon activité soit publiée sur différents médias sociaux de
                l&apos;OFPPT. Mes informations seront utilisées uniquement dans le cadre de cette
                inscription.
              </p>
              <label
                htmlFor="gt-consentement"
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors min-h-[44px] ${
                  consentement
                    ? 'border-violet-400 bg-violet-50/60'
                    : 'border-slate-200 hover:border-violet-200 bg-white'
                }`}
              >
                <input
                  id="gt-consentement"
                  type="checkbox"
                  checked={consentement}
                  onChange={(e) => setConsentement(e.target.checked)}
                  className="mt-0.5 w-[18px] h-[18px] rounded border-slate-300 text-violet-600 focus:ring-violet-500/30 shrink-0"
                />
                <span className="text-sm text-slate-800">
                  <strong>Je valide et j&apos;accepte</strong> les conditions ci-dessus.
                </span>
              </label>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Fait le {new Date().toLocaleDateString('fr-FR')}.
              </p>
            </div>
          </section>

          {error && (
            <div
              ref={errorBannerRef}
              className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className={`pb-6 sm:pb-8 flex flex-col items-center gap-3${isKiosk ? ' w-full' : ''}`}>
            <button
              type="submit"
              disabled={!canSubmit}
              aria-busy={submitting}
              className={`inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-base shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500/40 gt-submit-btn ${isKiosk ? '' : 'w-full sm:w-auto min-w-[280px] min-h-[52px] px-8'}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  Inscription en cours…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  Valider mon inscription
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GotTalentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      }
    >
      <GotTalentPageContent />
    </Suspense>
  )
}
