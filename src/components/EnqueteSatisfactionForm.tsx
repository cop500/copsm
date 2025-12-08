'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Send,
  Loader2,
  Save
} from 'lucide-react'
import type { EnqueteSatisfactionFormData } from '@/hooks/useEnqueteSatisfaction'

interface EnqueteSatisfactionFormProps {
  onSubmit: (data: EnqueteSatisfactionFormData) => Promise<{ success: boolean; error?: string }>
  onSuccess?: () => void
  isPublic?: boolean
}

export const EnqueteSatisfactionForm: React.FC<EnqueteSatisfactionFormProps> = ({
  onSubmit,
  onSuccess,
  isPublic = false
}) => {
  const [formData, setFormData] = useState<EnqueteSatisfactionFormData>({
    nom_entreprise: '',
    nom_representant: '',
    fonction_representant: '',
    email_entreprise: '',
    telephone_entreprise: '',
    niveau_technique: undefined,
    communication: undefined,
    soft_skills: undefined,
    adequation_besoins: undefined,
    profil_interessant: undefined,
    intention_recruter: undefined,
    organisation_globale: undefined,
    accueil_accompagnement: undefined,
    communication_avant_event: undefined,
    pertinence_profils: undefined,
    fluidite_delais: undefined,
    logistique_espace: undefined,
    nombre_profils_retenus: undefined,
    intention_revenir: undefined,
    recommandation_autres_entreprises: undefined,
    suggestions: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Clé pour le localStorage
  const STORAGE_KEY = 'enquete_satisfaction_draft'

  // Restaurer les données sauvegardées au chargement
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        // Vérifier que les données ne sont pas trop anciennes (max 7 jours)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          setFormData(parsed.data)
          setLastSaved(new Date(parsed.timestamp))
          setAutoSaved(true)
        } else {
          // Supprimer les données trop anciennes
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (err) {
      console.error('Erreur lors de la restauration des données:', err)
    }
  }, [])

  // Sauvegarder automatiquement dans le localStorage
  const saveToLocalStorage = useCallback((data: EnqueteSatisfactionFormData) => {
    try {
      const dataToSave = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      setLastSaved(new Date())
      setAutoSaved(true)
      
      // Masquer l'indicateur après 3 secondes
      setTimeout(() => setAutoSaved(false), 3000)
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
    }
  }, [])

  // Sauvegarder automatiquement après chaque modification (avec debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Ne sauvegarder que si le formulaire n'est pas vide et n'est pas en cours de soumission
      if (!loading && !success && (formData.nom_entreprise || formData.email_entreprise || formData.nom_representant)) {
        saveToLocalStorage(formData)
      }
    }, 2000) // Sauvegarder 2 secondes après la dernière modification

    return () => clearTimeout(timer)
  }, [formData, loading, success, saveToLocalStorage])

  // Nettoyer le localStorage après soumission réussie
  useEffect(() => {
    if (success) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [success])

  // Composant pour les étoiles avec labels accessibles
  const StarRating: React.FC<{
    value?: number
    onChange: (value: number) => void
    label: string
    required?: boolean
  }> = ({ value, onChange, label, required = false }) => {
    const starLabels = ['Très insatisfait', 'Insatisfait', 'Neutre', 'Satisfait', 'Très satisfait']
    
    return (
      <div className="space-y-3">
        <label className="block text-base font-semibold text-gray-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`transition-all transform hover:scale-110 ${
                value && star <= value
                  ? 'text-yellow-400 scale-110'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
              aria-label={`${star} étoile${star > 1 ? 's' : ''} - ${starLabels[star - 1]}`}
              title={`${star}/5 - ${starLabels[star - 1]}`}
            >
              <Star className="w-8 h-8 fill-current" />
            </button>
          ))}
          {value && (
            <span className="ml-3 text-base font-medium text-gray-700">
              {value}/5 - {starLabels[value - 1]}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          1 = Très insatisfait | 2 = Insatisfait | 3 = Neutre | 4 = Satisfait | 5 = Très satisfait
        </p>
        {errors[label] && (
          <p className="text-sm font-medium text-red-600 mt-1">{errors[label]}</p>
        )}
      </div>
    )
  }

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Informations entreprise (obligatoires)
    if (!formData.nom_entreprise.trim()) {
      newErrors.nom_entreprise = 'Le nom de l\'entreprise est obligatoire'
    }
    if (!formData.nom_representant.trim()) {
      newErrors.nom_representant = 'Le nom du représentant est obligatoire'
    }
    if (!formData.fonction_representant.trim()) {
      newErrors.fonction_representant = 'La fonction est obligatoire'
    }
    if (!formData.email_entreprise.trim()) {
      newErrors.email_entreprise = 'L\'email est obligatoire'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_entreprise)) {
      newErrors.email_entreprise = 'Email invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSuccess(false)

    if (!validate()) {
      return
    }

    setLoading(true)
    try {
      const result = await onSubmit(formData)
      
      if (result.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 2000)
        }
      } else {
        setSubmitError(result.error || 'Erreur lors de la soumission')
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Erreur lors de la soumission')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-xl p-10 md:p-12 text-center border-2 border-green-200 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 animate-bounce">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Merci pour votre participation !
        </h2>
        <p className="text-lg text-gray-700 mb-2">
          Votre réponse a été envoyée avec succès.
        </p>
        <p className="text-base text-gray-600">
          Nous apprécions votre retour et l'utiliserons pour améliorer nos services.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-8 md:p-10 space-y-10 max-w-5xl mx-auto">
      {/* Indicateur de sauvegarde automatique */}
      {autoSaved && lastSaved && (
        <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg p-3 flex items-center gap-2 mb-4 animate-fade-in">
          <Save className="w-4 h-4" />
          <span className="text-sm font-medium">
            Données sauvegardées automatiquement {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {submitError && (
        <div className="border-2 border-red-300 bg-red-50 text-red-700 rounded-xl p-5 flex gap-3 mb-6">
          <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-base mb-1">Erreur</p>
            <p className="text-sm">{submitError}</p>
          </div>
        </div>
      )}

      {/* A. Informations entreprise */}
      <section className="bg-blue-50/50 rounded-xl p-6 md:p-8 space-y-6 border-2 border-blue-100">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-300">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-blue-900">
            A. Informations entreprise
          </h2>
        </div>
        <p className="text-sm text-gray-600 -mt-2">
          Veuillez renseigner les informations de votre entreprise
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Nom entreprise <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nom_entreprise}
              onChange={(e) => setFormData({ ...formData, nom_entreprise: e.target.value })}
              placeholder="Nom de l'entreprise"
              className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                errors.nom_entreprise ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.nom_entreprise && (
              <p className="mt-2 text-sm font-medium text-red-600">{errors.nom_entreprise}</p>
            )}
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Nom du représentant <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.nom_representant}
                onChange={(e) => setFormData({ ...formData, nom_representant: e.target.value })}
                placeholder="Nom du représentant"
                className={`w-full pl-12 pr-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.nom_representant ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.nom_representant && (
              <p className="mt-2 text-sm font-medium text-red-600">{errors.nom_representant}</p>
            )}
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Fonction <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fonction_representant}
              onChange={(e) => setFormData({ ...formData, fonction_representant: e.target.value })}
              placeholder="Votre fonction"
              className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                errors.fonction_representant ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.fonction_representant && (
              <p className="mt-2 text-sm font-medium text-red-600">{errors.fonction_representant}</p>
            )}
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email_entreprise}
                onChange={(e) => setFormData({ ...formData, email_entreprise: e.target.value })}
                placeholder="Adresse email"
                className={`w-full pl-12 pr-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.email_entreprise ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.email_entreprise && (
              <p className="mt-2 text-sm font-medium text-red-600">{errors.email_entreprise}</p>
            )}
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Téléphone
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.telephone_entreprise || ''}
                onChange={(e) => setFormData({ ...formData, telephone_entreprise: e.target.value })}
                placeholder="Numéro de téléphone"
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* B. Satisfaction concernant les lauréats */}
      <section className="bg-blue-50/50 rounded-xl p-6 md:p-8 space-y-6 border-2 border-blue-100">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-300">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          <h2 className="text-2xl font-bold text-blue-900">
            B. Satisfaction concernant les lauréats
          </h2>
        </div>
        <p className="text-sm text-gray-600 -mt-2">
          Évaluez votre satisfaction concernant les candidats rencontrés
        </p>

        <div className="space-y-6">
          <StarRating
            value={formData.niveau_technique}
            onChange={(value) => setFormData({ ...formData, niveau_technique: value })}
            label="Niveau technique"
          />
          <StarRating
            value={formData.communication}
            onChange={(value) => setFormData({ ...formData, communication: value })}
            label="Communication"
          />
          <StarRating
            value={formData.soft_skills}
            onChange={(value) => setFormData({ ...formData, soft_skills: value })}
            label="Soft skills"
          />
          <StarRating
            value={formData.adequation_besoins}
            onChange={(value) => setFormData({ ...formData, adequation_besoins: value })}
            label="Adéquation avec les besoins"
          />

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Avez-vous trouvé un profil intéressant ?
            </label>
            <div className="flex flex-wrap gap-6">
              {(['oui', 'non', 'en_cours'] as const).map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="profil_interessant"
                    value={option}
                    checked={formData.profil_interessant === option}
                    onChange={(e) => setFormData({ ...formData, profil_interessant: e.target.value as any })}
                    className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-base font-medium text-gray-700 capitalize group-hover:text-blue-600 transition-colors">
                    {option.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Intention de recruter
            </label>
            <div className="flex flex-wrap gap-6">
              {(['oui', 'non', 'peut_etre'] as const).map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="intention_recruter"
                    value={option}
                    checked={formData.intention_recruter === option}
                    onChange={(e) => setFormData({ ...formData, intention_recruter: e.target.value as any })}
                    className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-base font-medium text-gray-700 capitalize group-hover:text-blue-600 transition-colors">
                    {option.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* C. Satisfaction par rapport à nos services */}
      <section className="bg-blue-50/50 rounded-xl p-6 md:p-8 space-y-6 border-2 border-blue-100">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-300">
          <Star className="w-6 h-6 text-purple-500 fill-purple-500" />
          <h2 className="text-2xl font-bold text-blue-900">
            C. Satisfaction par rapport à nos services
          </h2>
        </div>
        <p className="text-sm text-gray-600 -mt-2">
          Évaluez votre satisfaction concernant nos services et notre accompagnement
        </p>

        <div className="space-y-6">
          <StarRating
            value={formData.organisation_globale}
            onChange={(value) => setFormData({ ...formData, organisation_globale: value })}
            label="Organisation globale"
          />
          <StarRating
            value={formData.accueil_accompagnement}
            onChange={(value) => setFormData({ ...formData, accueil_accompagnement: value })}
            label="Accueil et accompagnement"
          />
          <StarRating
            value={formData.communication_avant_event}
            onChange={(value) => setFormData({ ...formData, communication_avant_event: value })}
            label="Communication avant l'événement"
          />
          <StarRating
            value={formData.pertinence_profils}
            onChange={(value) => setFormData({ ...formData, pertinence_profils: value })}
            label="Pertinence des profils"
          />
          <StarRating
            value={formData.fluidite_delais}
            onChange={(value) => setFormData({ ...formData, fluidite_delais: value })}
            label="Fluidité / délais"
          />
          <StarRating
            value={formData.logistique_espace}
            onChange={(value) => setFormData({ ...formData, logistique_espace: value })}
            label="Logistique / espace"
          />
        </div>
      </section>

      {/* D. Retombées */}
      <section className="bg-blue-50/50 rounded-xl p-6 md:p-8 space-y-6 border-2 border-blue-100">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-300">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-bold text-blue-900">
            D. Retombées
          </h2>
        </div>
        <p className="text-sm text-gray-600 -mt-2">
          Informations sur les résultats et votre intention de participer à nouveau
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Nombre de profils retenus
            </label>
            <select
              value={formData.nombre_profils_retenus || ''}
              onChange={(e) => setFormData({ ...formData, nombre_profils_retenus: e.target.value as any })}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Sélectionner...</option>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2-5">2-5</option>
              <option value="+5">+5</option>
            </select>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Intention de revenir
            </label>
            <div className="flex flex-wrap gap-6">
              {(['oui', 'non', 'peut_etre'] as const).map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="intention_revenir"
                    value={option}
                    checked={formData.intention_revenir === option}
                    onChange={(e) => setFormData({ ...formData, intention_revenir: e.target.value as any })}
                    className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-base font-medium text-gray-700 capitalize group-hover:text-blue-600 transition-colors">
                    {option.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Recommandation à d'autres entreprises
            </label>
            <div className="flex flex-wrap gap-6">
              {(['oui', 'non'] as const).map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="recommandation_autres_entreprises"
                    value={option}
                    checked={formData.recommandation_autres_entreprises === option}
                    onChange={(e) => setFormData({ ...formData, recommandation_autres_entreprises: e.target.value as any })}
                    className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-base font-medium text-gray-700 capitalize group-hover:text-blue-600 transition-colors">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* E. Suggestions */}
      <section className="bg-blue-50/50 rounded-xl p-6 md:p-8 space-y-6 border-2 border-blue-100">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-300">
          <AlertCircle className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-blue-900">
            E. Suggestions
          </h2>
        </div>
        <p className="text-sm text-gray-600 -mt-2">
          Partagez vos idées pour améliorer nos services et événements
        </p>

        <div>
          <label className="block text-base font-semibold text-gray-900 mb-3">
            Vos suggestions et commentaires
          </label>
          <textarea
            value={formData.suggestions || ''}
            onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-y"
            placeholder="Ex: Améliorer l'espace d'accueil, proposer plus de profils techniques, organiser des sessions de networking..."
          />
        </div>
      </section>

      {/* Bouton de soumission */}
      <div className="flex justify-center pt-6 border-t-2 border-blue-200">
        <button
          type="submit"
          disabled={loading}
          className="px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 min-w-[250px] justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Envoi en cours...</span>
            </>
          ) : (
            <>
              <Send className="w-6 h-6" />
              <span>Envoyer l'enquête</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

