'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  Save, 
  X, 
  AlertCircle,
  Building2
} from 'lucide-react'
import { useEntreprises } from '@/hooks/useEntreprises'
import type { VisiteEntreprise } from '@/hooks/useVisitesEntreprises'

interface VisiteFormProps {
  visite?: VisiteEntreprise
  onSave: (data: Partial<VisiteEntreprise>) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
}

const VisiteForm: React.FC<VisiteFormProps> = ({ 
  visite, 
  onSave, 
  onCancel
}) => {
  const { entreprises, loading: entreprisesLoading } = useEntreprises()
  
  // Options prédéfinies pour l'objectif
  const objectifsOptions = [
    'Recrutement',
    'Partenariat',
    'Suivi partenariat',
    'Prospection',
    'Présentation COP',
    'Diagnostic besoins',
    'Formation',
    'Stage',
    'Alternance',
    'Autre'
  ]

  // États du formulaire
  const [formData, setFormData] = useState<Partial<VisiteEntreprise>>({
    entreprise_id: '',
    date_visite: '',
    heure_visite: '',
    objectif: '',
    statut_relation: 'moyen',
    etat_relation: 'prospect',
    ...visite
  })

  const [objectifAutre, setObjectifAutre] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Initialiser le formulaire avec les données de la visite si elle existe
  useEffect(() => {
    if (visite) {
      setFormData({
        entreprise_id: visite.entreprise_id,
        date_visite: visite.date_visite ? new Date(visite.date_visite).toISOString().split('T')[0] : '',
        heure_visite: visite.heure_visite || '',
        objectif: visite.objectif || '',
        statut_relation: visite.statut_relation || 'moyen',
        etat_relation: visite.etat_relation || 'prospect',
      })
      // Si l'objectif n'est pas dans les options, c'est "Autre"
      if (visite.objectif && !objectifsOptions.includes(visite.objectif)) {
        setObjectifAutre(visite.objectif)
        setFormData(prev => ({ ...prev, objectif: 'Autre' }))
      }
    }
  }, [visite])

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.entreprise_id) {
      newErrors.entreprise_id = 'L\'entreprise est obligatoire'
    }
    if (!formData.date_visite) {
      newErrors.date_visite = 'La date de visite est obligatoire'
    }
    if (!formData.objectif) {
      newErrors.objectif = 'L\'objectif est obligatoire'
    } else if (formData.objectif === 'Autre' && !objectifAutre.trim()) {
      newErrors.objectif = 'Veuillez préciser l\'objectif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) {
      return
    }

    setLoading(true)
    try {
      // Déterminer l'objectif final (si "Autre", utiliser objectifAutre)
      const objectifFinal = formData.objectif === 'Autre' ? objectifAutre : formData.objectif

      // Formater la date avec l'heure si fournie
      let dateVisite = formData.date_visite
      if (formData.heure_visite && formData.date_visite) {
        const [hours, minutes] = formData.heure_visite.split(':')
        const date = new Date(formData.date_visite)
        date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0)
        dateVisite = date.toISOString()
      } else if (formData.date_visite) {
        dateVisite = new Date(formData.date_visite).toISOString()
      }

      const result = await onSave({
        entreprise_id: formData.entreprise_id,
        date_visite: dateVisite,
        heure_visite: formData.heure_visite || null,
        objectif: objectifFinal,
        statut_relation: formData.statut_relation,
        etat_relation: formData.etat_relation,
      })

      if (!result.success) {
        setSubmitError(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              {visite ? 'Modifier la visite' : 'Nouvelle visite entreprise'}
            </h2>
            <p className="text-gray-600 mt-1">Planifier et enregistrer une visite terrain</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitError && (
            <div className="mb-4 border border-red-200 bg-red-50 text-red-700 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold">Erreur</p>
                <p className="text-sm">{submitError}</p>
              </div>
            </div>
          )}

          {/* Entreprise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entreprise <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.entreprise_id || ''}
              onChange={(e) => setFormData({ ...formData, entreprise_id: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.entreprise_id ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={entreprisesLoading}
            >
              <option value="">Sélectionner une entreprise</option>
              {entreprises.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.nom} {ent.secteur ? `- ${ent.secteur}` : ''}
                </option>
              ))}
            </select>
            {errors.entreprise_id && (
              <p className="mt-1 text-sm text-red-600">{errors.entreprise_id}</p>
            )}
          </div>

          {/* Date et heure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de visite <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.date_visite || ''}
                  onChange={(e) => setFormData({ ...formData, date_visite: e.target.value })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.date_visite ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.date_visite && (
                <p className="mt-1 text-sm text-red-600">{errors.date_visite}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de visite
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  value={formData.heure_visite || ''}
                  onChange={(e) => setFormData({ ...formData, heure_visite: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Objectif */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objectif de la visite <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.objectif || ''}
              onChange={(e) => setFormData({ ...formData, objectif: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.objectif ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner un objectif</option>
              {objectifsOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {formData.objectif === 'Autre' && (
              <input
                type="text"
                value={objectifAutre}
                onChange={(e) => setObjectifAutre(e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Précisez l'objectif..."
              />
            )}
            {errors.objectif && (
              <p className="mt-1 text-sm text-red-600">{errors.objectif}</p>
            )}
          </div>


          {/* Statut relation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau d'intérêt
              </label>
              <select
                value={formData.statut_relation || 'moyen'}
                onChange={(e) => setFormData({ ...formData, statut_relation: e.target.value as 'faible' | 'moyen' | 'fort' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="fort">Fort</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                État de la relation
              </label>
              <select
                value={formData.etat_relation || 'prospect'}
                onChange={(e) => setFormData({ ...formData, etat_relation: e.target.value as 'prospect' | 'actif' | 'partenaire' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="prospect">Prospect</option>
                <option value="actif">Actif</option>
                <option value="partenaire">Partenaire</option>
              </select>
            </div>
          </div>


          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VisiteForm

