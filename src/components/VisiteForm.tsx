'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Save, 
  X, 
  Plus,
  Trash2,
  AlertCircle,
  Target,
  Building2,
  Mail,
  Phone,
  CheckCircle
} from 'lucide-react'
import { useEntreprises } from '@/hooks/useEntreprises'
import type { VisiteEntreprise, PersonneRencontree, ActionSuivi } from '@/hooks/useVisitesEntreprises'

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
  
  // États du formulaire
  const [formData, setFormData] = useState<Partial<VisiteEntreprise>>({
    entreprise_id: '',
    date_visite: '',
    heure_visite: '',
    objectif: '',
    personnes_rencontrees: [],
    compte_rendu: '',
    points_discutes: '',
    besoins_detectes: '',
    actions_a_prevues: '',
    statut_relation: 'moyen',
    etat_relation: 'prospect',
    actions_suivi: [],
    ...visite
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Initialiser le formulaire avec les données de la visite si elle existe
  useEffect(() => {
    if (visite) {
      setFormData({
        ...visite,
        date_visite: visite.date_visite ? new Date(visite.date_visite).toISOString().split('T')[0] : '',
        heure_visite: visite.heure_visite || '',
      })
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
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Gérer les personnes rencontrées
  const addPersonne = () => {
    setFormData({
      ...formData,
      personnes_rencontrees: [
        ...(formData.personnes_rencontrees || []),
        { nom: '', fonction: '', email: '', telephone: '' }
      ]
    })
  }

  const removePersonne = (index: number) => {
    const personnes = [...(formData.personnes_rencontrees || [])]
    personnes.splice(index, 1)
    setFormData({ ...formData, personnes_rencontrees: personnes })
  }

  const updatePersonne = (index: number, field: keyof PersonneRencontree, value: string) => {
    const personnes = [...(formData.personnes_rencontrees || [])]
    personnes[index] = { ...personnes[index], [field]: value }
    setFormData({ ...formData, personnes_rencontrees: personnes })
  }

  // Gérer les actions de suivi
  const addAction = () => {
    setFormData({
      ...formData,
      actions_suivi: [
        ...(formData.actions_suivi || []),
        { tache: '', date_limite: '', statut: 'en_attente' }
      ]
    })
  }

  const removeAction = (index: number) => {
    const actions = [...(formData.actions_suivi || [])]
    actions.splice(index, 1)
    setFormData({ ...formData, actions_suivi: actions })
  }

  const updateAction = (index: number, field: keyof ActionSuivi, value: string | 'en_attente' | 'en_cours' | 'termine' | 'annule') => {
    const actions = [...(formData.actions_suivi || [])]
    actions[index] = { ...actions[index], [field]: value }
    setFormData({ ...formData, actions_suivi: actions })
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
        ...formData,
        date_visite: dateVisite,
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
            <textarea
              value={formData.objectif || ''}
              onChange={(e) => setFormData({ ...formData, objectif: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.objectif ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Décrivez l'objectif de cette visite..."
            />
            {errors.objectif && (
              <p className="mt-1 text-sm text-red-600">{errors.objectif}</p>
            )}
          </div>

          {/* Personnes rencontrées */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Personnes rencontrées
              </label>
              <button
                type="button"
                onClick={addPersonne}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {(formData.personnes_rencontrees || []).map((personne, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Personne {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removePersonne(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nom *</label>
                      <input
                        type="text"
                        value={personne.nom}
                        onChange={(e) => updatePersonne(index, 'nom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Nom complet"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fonction *</label>
                      <input
                        type="text"
                        value={personne.fonction}
                        onChange={(e) => updatePersonne(index, 'fonction', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Directeur, RH, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={personne.email || ''}
                        onChange={(e) => updatePersonne(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="email@entreprise.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={personne.telephone || ''}
                        onChange={(e) => updatePersonne(index, 'telephone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="+212 6XX XXX XXX"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!formData.personnes_rencontrees || formData.personnes_rencontrees.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune personne rencontrée. Cliquez sur "Ajouter" pour en ajouter.
                </p>
              )}
            </div>
          </div>

          {/* Compte-rendu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compte-rendu
            </label>
            <textarea
              value={formData.compte_rendu || ''}
              onChange={(e) => setFormData({ ...formData, compte_rendu: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Résumé de la visite..."
            />
          </div>

          {/* Points discutés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points discutés
            </label>
            <textarea
              value={formData.points_discutes || ''}
              onChange={(e) => setFormData({ ...formData, points_discutes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Points principaux abordés lors de la visite..."
            />
          </div>

          {/* Besoins détectés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Besoins détectés
            </label>
            <textarea
              value={formData.besoins_detectes || ''}
              onChange={(e) => setFormData({ ...formData, besoins_detectes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Besoins identifiés de l'entreprise..."
            />
          </div>

          {/* Actions à prévoir */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actions à prévoir
            </label>
            <textarea
              value={formData.actions_a_prevues || ''}
              onChange={(e) => setFormData({ ...formData, actions_a_prevues: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Actions à planifier suite à la visite..."
            />
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

          {/* Actions de suivi */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Actions de suivi
              </label>
              <button
                type="button"
                onClick={addAction}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {(formData.actions_suivi || []).map((action, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Action {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeAction(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tâche *</label>
                      <input
                        type="text"
                        value={action.tache}
                        onChange={(e) => updateAction(index, 'tache', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Description de la tâche"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Date limite</label>
                      <input
                        type="date"
                        value={action.date_limite}
                        onChange={(e) => updateAction(index, 'date_limite', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Statut</label>
                      <select
                        value={action.statut}
                        onChange={(e) => updateAction(index, 'statut', e.target.value as ActionSuivi['statut'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en_attente">En attente</option>
                        <option value="en_cours">En cours</option>
                        <option value="termine">Terminé</option>
                        <option value="annule">Annulé</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {(!formData.actions_suivi || formData.actions_suivi.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune action de suivi. Cliquez sur "Ajouter" pour en ajouter.
                </p>
              )}
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

