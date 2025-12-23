'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Send, 
  User, 
  FileText, 
  Target,
  Briefcase,
  Users,
  Heart,
  Phone,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface FormData {
  nom: string
  prenom: string
  telephone: string
  pole_id: string
  filiere_id: string
  type_assistance: string
  sujet: string
  description: string
  conseiller_id: string
}

interface Pole {
  id: string
  nom: string
  code: string
  couleur: string
}

interface Filiere {
  id: string
  nom: string
  code: string
  pole_id: string
  color: string
}

const typesAssistance = [
  {
    id: 'orientation',
    nom: 'Orientation et Projet Professionnel',
    description: 'Accompagnement à l\'orientation, conseil en poursuite d\'études, validation du PPP',
    icone: Target,
    couleur: 'blue',
    details: [
      'Accompagnement à l\'orientation ou à la réorientation',
      'Conseil en poursuite d\'études',
      'Validation et affinement du Projet Professionnel Personnel (PPP)',
      'Entretiens d\'orientation approfondis',
      'Bilans et tests d\'orientation',
      'Auto-exploration et clarification du projet professionnel'
    ]
  },
  {
    id: 'strategie',
    nom: 'Stratégie et Recherche d\'Emploi / Carrière',
    description: 'Conseil en stratégie de carrière, aide à la recherche d\'emploi, optimisation CV',
    icone: Briefcase,
    couleur: 'green',
    details: [
      'Conseil en stratégie de carrière',
      'Aide à la recherche d\'emploi ou de stage',
      'Correction et relecture de CV et lettres de motivation',
      'Optimisation du profil professionnel en ligne (LinkedIn, etc.)',
      'Construction du "pitch" professionnel',
      'Soutien à la mobilité internationale'
    ]
  },
  {
    id: 'entretiens',
    nom: 'Préparation aux Entretiens et Recrutement',
    description: 'Simulation d\'entretien, entraînement aux tests de recrutement',
    icone: Users,
    couleur: 'purple',
    details: [
      'Simulation d\'entretien (Mock Interviews)',
      'Entraînement aux tests de recrutement'
    ]
  },
  {
    id: 'developpement',
    nom: 'Développement Personnel et Confiance',
    description: 'Coaching émotionnel, soutien psychologique léger, coaching de décision',
    icone: Heart,
    couleur: 'pink',
    details: [
      'Coaching émotionnel et confiance en soi',
      'Soutien psychologique léger',
      'Coaching de décision'
    ]
  }
]

interface Conseiller {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  telephone?: string
  poste?: string
}

export default function DemandeAssistance() {
  const [form, setForm] = useState<FormData>({
    nom: '',
    prenom: '',
    telephone: '',
    pole_id: '',
    filiere_id: '',
    type_assistance: '',
    sujet: '',
    description: '',
    conseiller_id: ''
  })
  const [selectedType, setSelectedType] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [poles, setPoles] = useState<Pole[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [conseillers, setConseillers] = useState<Conseiller[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Charger les pôles, filières et conseillers
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true)
        
        const [polesResult, filieresResult, conseillersResult] = await Promise.all([
          supabase.from('poles').select('*').eq('actif', true).order('nom'),
          supabase.from('filieres').select('*').eq('actif', true).order('nom'),
          supabase.from('profiles')
            .select('id, nom, prenom, email, role, telephone, poste')
            .in('role', ['conseiller_cop', 'conseillere_carriere'])
            .eq('actif', true)
            .order('nom')
        ])
        
        // Filtrer pour ne garder que les 3 conseillers spécifiques
        const conseillersAutorises = ['ABDELHAMID INAJJAREN', 'SIHAM EL OMARI', 'IMANE IDRISSI', 'SARA HANZAZE']
        const conseillersFiltres = (conseillersResult.data || []).filter(conseiller => {
          const nomComplet = `${conseiller.prenom} ${conseiller.nom}`.toUpperCase()
          return conseillersAutorises.some(autorise => 
            nomComplet.includes(autorise.toUpperCase()) || 
            autorise.toUpperCase().includes(nomComplet)
          )
        })
        
        if (polesResult.error) throw polesResult.error
        if (filieresResult.error) throw filieresResult.error
        if (conseillersResult.error) throw conseillersResult.error
        
        setPoles(polesResult.data || [])
        setFilieres(filieresResult.data || [])
        setConseillers(conseillersFiltres)
      } catch (error) {
        console.error('Erreur chargement données:', error)
      } finally {
        setLoadingData(false)
      }
    }
    
    loadData()
  }, [])

  // Filtrer les filières selon le pôle sélectionné
  const getFilieresForPole = (poleId: string) => {
    return filieres.filter(f => f.pole_id === poleId)
  }


  const handleTypeSelect = (type: any) => {
    setSelectedType(type)
    setForm(prev => ({ ...prev, type_assistance: type.id }))
    setErrors(prev => ({ ...prev, type_assistance: '' }))
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value }
      
      // Si on change le pôle, on réinitialise la filière
      if (field === 'pole_id') {
        newForm.filiere_id = ''
      }
      
      return newForm
    })
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }


  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!form.nom.trim()) newErrors.nom = 'Le nom est requis'
    if (!form.prenom.trim()) newErrors.prenom = 'Le prénom est requis'
    if (!form.telephone.trim()) newErrors.telephone = 'Le téléphone est requis'
    if (!form.pole_id) newErrors.pole_id = 'Veuillez sélectionner un pôle'
    if (!form.filiere_id) newErrors.filiere_id = 'Veuillez sélectionner une filière'
    if (!form.type_assistance) newErrors.type_assistance = 'Veuillez sélectionner un type d\'assistance'
    if (!form.conseiller_id) newErrors.conseiller_id = 'Veuillez sélectionner un conseiller'
    // Sujet et description supprimés pour simplifier
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      // Logs de débogage côté client
      console.log('📤 Envoi de la demande d\'assistance...')
      console.log('📋 Données du formulaire:', form)
      console.log('📋 Conseiller ID:', form.conseiller_id)
      console.log('📋 Conseiller ID type:', typeof form.conseiller_id)
      console.log('📋 Conseiller ID vide?', !form.conseiller_id || form.conseiller_id.trim() === '')
      
      const response = await fetch('/api/assistance-stagiaires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      })
      
      const result = await response.json()
      
      console.log('📥 Réponse du serveur:', result)
      console.log('📥 Status:', response.status)
      
      if (!response.ok) {
        console.error('❌ Erreur serveur:', result.error)
        throw new Error(result.error || 'Erreur lors de l\'envoi')
      }
      
      // Succès
      console.log('✅ Demande créée avec succès, ID:', result.data?.id)
      alert(result.message || 'Votre demande a été soumise avec succès ! Vous recevrez une réponse sous 24h.')
      
      // Reset form
      setForm({
        nom: '',
        prenom: '',
        telephone: '',
        pole_id: '',
        filiere_id: '',
        type_assistance: '',
        sujet: '',
        description: '',
        conseiller_id: ''
      })
      setSelectedType(null)
      
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/assistance-stagiaires"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Demande d'assistance – Un conseiller vous accompagne</h1>
                <p className="text-gray-600">Décrivez votre besoin et nous vous mettrons en relation avec un conseiller</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingData ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Étape 1: Informations personnelles */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center space-x-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>1. Vos informations personnelles</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    placeholder="Votre nom de famille"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.nom && (
                    <p className="text-red-600 text-sm mt-1">{errors.nom}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => handleChange('prenom', e.target.value)}
                    placeholder="Votre prénom"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.prenom && (
                    <p className="text-red-600 text-sm mt-1">{errors.prenom}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => handleChange('telephone', e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                {errors.telephone && (
                  <p className="text-red-600 text-sm mt-1">{errors.telephone}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pôle *
                  </label>
                  <select
                    value={form.pole_id}
                    onChange={(e) => handleChange('pole_id', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Sélectionnez votre pôle</option>
                    {poles.map((pole) => (
                      <option key={pole.id} value={pole.id}>
                        {pole.nom}
                      </option>
                    ))}
                  </select>
                  {errors.pole_id && (
                    <p className="text-red-600 text-sm mt-1">{errors.pole_id}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filière *
                  </label>
                  <select
                    value={form.filiere_id}
                    onChange={(e) => handleChange('filiere_id', e.target.value)}
                    disabled={!form.pole_id}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {form.pole_id ? 'Sélectionnez votre filière' : 'Choisissez d\'abord un pôle'}
                    </option>
                    {getFilieresForPole(form.pole_id).map((filiere) => (
                      <option key={filiere.id} value={filiere.id}>
                        {filiere.nom}
                      </option>
                    ))}
                  </select>
                  {errors.filiere_id && (
                    <p className="text-red-600 text-sm mt-1">{errors.filiere_id}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Étape 2: Type d'assistance */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span>2. Type d'assistance souhaitée</span>
              </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {typesAssistance.map((type) => {
                const IconComponent = type.icone
                const isSelected = selectedType?.id === type.id
                
                return (
                  <div
                    key={type.id}
                    onClick={() => handleTypeSelect(type)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? `border-${type.couleur}-500 bg-${type.couleur}-50` 
                        : 'border-gray-200 hover:border-gray-300 bg-white/50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? `bg-${type.couleur}-100` : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          isSelected ? `text-${type.couleur}-600` : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          isSelected ? `text-${type.couleur}-900` : 'text-gray-900'
                        }`}>
                          {type.nom}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {errors.type_assistance && (
              <p className="text-red-600 text-sm mt-2">{errors.type_assistance}</p>
            )}
          </div>

          {/* Détails du type sélectionné */}
          {selectedType && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
              <h3 className="text-md font-medium text-gray-900 mb-3">
                Services disponibles pour "{selectedType.nom}"
              </h3>
              <ul className="space-y-2">
                {selectedType.details.map((detail: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

            {/* Étape 3: Sélection du conseiller */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>3. Choisir votre conseiller</span>
              </h2>
            
            {conseillers.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Aucun conseiller disponible pour le moment.</p>
                <p className="text-sm text-gray-500 mt-1">Veuillez contacter l'administration.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conseillers.map((conseiller) => (
                <div
                  key={conseiller.id}
                  onClick={() => handleChange('conseiller_id', conseiller.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    form.conseiller_id === conseiller.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {conseiller.prenom} {conseiller.nom}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {conseiller.role === 'conseiller_cop' 
                          ? (conseiller.prenom?.toUpperCase().includes('SARA') ? 'Conseillère d\'orientation' : 'Conseiller d\'orientation')
                          : 'Conseillère Carrière'}
                        {conseiller.poste && ` - ${conseiller.poste}`}
                      </p>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
            
            {errors.conseiller_id && (
              <p className="text-red-600 text-sm mt-2">{errors.conseiller_id}</p>
            )}
          </div>


          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/assistance-stagiaires"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Soumettre ma demande</span>
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
