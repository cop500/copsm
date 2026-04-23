'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle,
  User,
  Phone,
  Compass,
  Briefcase,
  CircleHelp,
  GraduationCap,
  ArrowRight,
} from 'lucide-react'

type TypeVisite = 'orientation' | 'entreprise' | 'autre'

interface Pole {
  id: string
  nom: string
}

const VISIT_OPTIONS = [
  {
    id: 'orientation' as const,
    title: 'Orientation',
    description: "Demande d'information",
    icon: Compass,
    activeClasses: 'border-blue-500 bg-blue-50/90 text-blue-700 shadow-md shadow-blue-100',
    iconWrapActive: 'bg-blue-600 text-white',
    iconWrapIdle: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'entreprise' as const,
    title: 'Entreprise',
    description: 'Visite professionnelle',
    icon: Briefcase,
    activeClasses: 'border-indigo-500 bg-indigo-50/90 text-indigo-700 shadow-md shadow-indigo-100',
    iconWrapActive: 'bg-indigo-600 text-white',
    iconWrapIdle: 'bg-indigo-100 text-indigo-600',
  },
  {
    id: 'autre' as const,
    title: 'Autre',
    description: 'Autre demande',
    icon: CircleHelp,
    activeClasses: 'border-violet-500 bg-violet-50/90 text-violet-700 shadow-md shadow-violet-100',
    iconWrapActive: 'bg-violet-600 text-white',
    iconWrapIdle: 'bg-violet-100 text-violet-600',
  },
]

export default function RegistreVisiteursPublicPage() {
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [typeVisite, setTypeVisite] = useState<TypeVisite | null>(null)
  const [poleId, setPoleId] = useState('')
  const [motifAutre, setMotifAutre] = useState('')
  const [poles, setPoles] = useState<Pole[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState('')
  const [confirmDuplicate, setConfirmDuplicate] = useState(false)

  useEffect(() => {
    const loadPoles = async () => {
      const { data } = await supabase.from('poles').select('id, nom').order('nom')
      setPoles((data as Pole[]) || [])
    }
    loadPoles()
  }, [])

  const selectedPole = useMemo(() => poles.find((p) => p.id === poleId), [poles, poleId])
  const normalizedPhone = useMemo(() => telephone.replace(/[^\d+]/g, ''), [telephone])

  useEffect(() => {
    setConfirmDuplicate(false)
    setDuplicateWarning('')
  }, [nom, prenom, telephone, typeVisite, poleId, motifAutre])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nom.trim() || !prenom.trim() || !normalizedPhone.trim() || !typeVisite) {
      setError('Veuillez remplir les champs obligatoires.')
      return
    }

    if (typeVisite === 'orientation' && !poleId) {
      setError("Veuillez choisir un pole d'interet.")
      return
    }

    if (typeVisite === 'autre' && !motifAutre.trim()) {
      setError("Veuillez preciser l'objet de visite.")
      return
    }

    setSubmitting(true)
    try {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date()
      dayEnd.setHours(23, 59, 59, 999)

      const { data: duplicates, error: duplicateError } = await supabase
        .from('registre_visiteurs')
        .select('id, created_at, nom, prenom')
        .eq('telephone', normalizedPhone)
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())
        .limit(1)

      if (duplicateError) throw duplicateError

      if (duplicates && duplicates.length > 0 && !confirmDuplicate) {
        setDuplicateWarning(
          "Attention: ce numero a deja ete enregistre aujourd'hui. Cliquez a nouveau sur Valider pour confirmer."
        )
        setConfirmDuplicate(true)
        setSubmitting(false)
        return
      }

      const { error: insertError } = await supabase.from('registre_visiteurs').insert({
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: normalizedPhone,
        type_visite: typeVisite,
        pole_id: typeVisite === 'orientation' ? poleId : null,
        pole_nom: typeVisite === 'orientation' ? selectedPole?.nom || null : null,
        motif_autre: typeVisite === 'autre' ? motifAutre.trim() : null,
      })
      if (insertError) throw insertError
      setSuccess(true)
    } catch (err) {
      console.error('Erreur enregistrement visiteur:', err)
      setError("Erreur lors de l'enregistrement. Merci de reessayer.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci pour votre visite</h1>
          <p className="text-gray-600">Votre passage a bien ete enregistre.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-10 px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/registre des visiteurs.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/16 via-blue-900/10 to-indigo-900/14" />
      <div className="absolute inset-0 bg-white/6" />
      <div className="relative max-w-2xl mx-auto bg-white/68 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/70 p-6 md:p-8 animate-fade-slide">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 mb-3">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Registre des visiteurs COP</h1>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Nom</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  placeholder="Votre nom"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Prénom</label>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                placeholder="Votre prénom"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Téléphone</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                placeholder="06XXXXXXXX"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Objet de visite</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {VISIT_OPTIONS.map((option) => {
                const Icon = option.icon
                const isActive = typeVisite === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTypeVisite(option.id)}
                    className={`border rounded-2xl p-4 text-left transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md ${
                      isActive
                        ? option.activeClasses
                        : 'border-slate-200 bg-white/90 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${isActive ? option.iconWrapActive : option.iconWrapIdle}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className={`text-base ${isActive ? 'font-semibold' : 'font-medium'}`}>{option.title}</p>
                    <p className="text-xs mt-1 opacity-80">{option.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {typeVisite === 'orientation' && (
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Pôle d’intérêt</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {poles.map((pole) => (
                  <button
                    key={pole.id}
                    type="button"
                    onClick={() => setPoleId(pole.id)}
                    className={`border rounded-xl p-3 text-left transition-all hover:shadow-sm ${
                      poleId === pole.id ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      {pole.nom}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {duplicateWarning && <p className="text-sm text-amber-700">{duplicateWarning}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {typeVisite === 'autre' && (
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Précisez votre objet de visite</label>
              <textarea
                value={motifAutre}
                onChange={(e) => setMotifAutre(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                placeholder="Ex: demande d'information, suivi dossier..."
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-md shadow-blue-200 hover:brightness-105 hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {submitting ? (
              'Enregistrement...'
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Valider ma visite
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
      <style jsx>{`
        .animate-fade-slide {
          animation: fadeSlide 350ms ease-out;
        }
        @keyframes fadeSlide {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

