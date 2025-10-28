'use client'

import React, { useState } from 'react'
import { useActionsAmbassadeurs, ActionAmbassadeurFormData } from '@/hooks/useActionsAmbassadeurs'
import { Calendar, MapPin, Users, User, Building2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import './formulaire.css'
import Image from 'next/image'

// Volets supprimés pour simplifier le formulaire

export default function FormulaireAmbassadeurs() {
  const { saveAction } = useActionsAmbassadeurs()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<ActionAmbassadeurFormData>({
    nom_prenom_stagiaire: '',
    equipe_participante: '',
    volet_action: 'information_communication', // Valeur par défaut
    responsable_action: '',
    lieu_realisation: '',
    date_action: '',
    nombre_participants: 0
  })

  const [errors, setErrors] = useState<Partial<ActionAmbassadeurFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<ActionAmbassadeurFormData> = {}

    if (!formData.nom_prenom_stagiaire.trim()) {
      newErrors.nom_prenom_stagiaire = 'Le nom et prénom sont requis'
    }

    // Volet supprimé de la validation

    if (!formData.responsable_action.trim()) {
      newErrors.responsable_action = 'Le responsable de l\'action est requis'
    }

    if (!formData.lieu_realisation.trim()) {
      newErrors.lieu_realisation = 'Le lieu de réalisation est requis'
    }

    if (!formData.date_action) {
      newErrors.date_action = 'La date de l\'action est requise'
    }

    if (formData.nombre_participants < 0) {
      newErrors.nombre_participants = 'Le nombre de participants doit être positif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await saveAction(formData)
      
      if (result.success) {
        setSuccess(true)
        // Réinitialiser le formulaire
        setFormData({
          nom_prenom_stagiaire: '',
          equipe_participante: '',
          volet_action: 'information_communication', // Valeur par défaut
          responsable_action: '',
          lieu_realisation: '',
          date_action: '',
          nombre_participants: 0
        })
        setErrors({})
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ActionAmbassadeurFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (success) {
    return (
      <div className="formulaire-container">
        {/* Image de fond avec Next.js Image */}
        <Image
          src="/formulaire7.jpg"
          alt="Arrière-plan du formulaire"
          fill
          className="formulaire-bg-image"
          priority
          quality={90}
        />
        
        {/* Overlay dégradé pour la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-white/20"></div>
        
        {/* Contenu principal */}
        <div className="formulaire-content flex items-center justify-center min-h-screen p-4">
          <div className="backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-white border-opacity-30">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
              Action enregistrée !
            </h2>
            <p className="text-white mb-6 drop-shadow-md">
              Votre action de stagiaire ambassadeur a été enregistrée avec succès.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] bg-opacity-90 backdrop-blur-sm text-white rounded-xl hover:from-[#2563EB] hover:to-[#6D28D9] transition-all duration-300 font-semibold border border-white/40 shadow-xl hover:shadow-2xl hover:scale-105 transform"
            >
              Enregistrer une nouvelle action
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="formulaire-container">
      {/* Image de fond avec Next.js Image */}
      <Image
        src="/formulaire7.jpg"
        alt="Arrière-plan du formulaire"
        fill
        className="formulaire-bg-image"
        priority
        quality={90}
      />
      
      {/* Overlay dégradé pour la lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-white/20 md:from-black/30 md:via-black/20 md:to-white/20"></div>
      
      {/* Contenu principal */}
      <div className="formulaire-content py-8 px-4">
        <div className="max-w-lg mx-auto px-4 md:px-0">
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-xl">
              Formulaire de Suivi des Actions
            </h1>
            <p className="text-xl text-[#EDEDED] drop-shadow-lg">
              Stagiaires Ambassadeurs
            </p>
          </div>

          {/* Formulaire glassmorphism */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20">
          {error && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-50 backdrop-blur-sm border border-red-400 border-opacity-50 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-300" />
              <p className="text-red-200 drop-shadow-md">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations Générales */}
            <div className="backdrop-blur-lg bg-white/15 md:bg-white/15 bg-white/25 rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-white/20">
              <h2 className="text-2xl font-semibold text-white text-center flex items-center justify-center gap-3 drop-shadow-xl">
                <User className="w-6 h-6 text-[#00E5B0]" />
                Informations Générales
              </h2>
              
              <div>
                <label className="block text-sm font-semibold text-white mb-3 drop-shadow-lg">
                  Nom et prénom du stagiaire ambassadeur *
                </label>
                <input
                  type="text"
                  value={formData.nom_prenom_stagiaire}
                  onChange={(e) => handleInputChange('nom_prenom_stagiaire', e.target.value)}
                  className={`w-full px-4 py-3 backdrop-blur-md bg-white/20 border border-white/40 rounded-xl focus:ring-2 focus:ring-[#00E5B0] focus:border-[#00E5B0] transition-all duration-300 text-base text-white placeholder-[#EDEDED] ${
                    errors.nom_prenom_stagiaire ? 'border-red-400' : 'border-white/40'
                  }`}
                  placeholder="Nom et prénom"
                />
                {errors.nom_prenom_stagiaire && (
                  <p className="mt-1 text-sm text-red-600 drop-shadow-sm">{errors.nom_prenom_stagiaire}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3 drop-shadow-lg">
                  Équipe participante / membres impliqués
                </label>
                <textarea
                  value={formData.equipe_participante}
                  onChange={(e) => handleInputChange('equipe_participante', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 backdrop-blur-md bg-white/20 border border-white/40 rounded-xl focus:ring-2 focus:ring-[#00E5B0] focus:border-[#00E5B0] transition-all duration-300 text-base text-white placeholder-[#EDEDED]"
                  placeholder="Décrivez l'équipe et les membres impliqués dans cette action..."
                />
              </div>
            </div>

            {/* Détails de l'Action */}
            <div className="backdrop-blur-lg bg-white/15 md:bg-white/15 bg-white/25 rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-white/20">
              <h2 className="text-2xl font-semibold text-white text-center flex items-center justify-center gap-3 drop-shadow-xl">
                <Building2 className="w-6 h-6 text-[#00E5B0]" />
                Détails de l'Action
              </h2>

              <div>
                <label className="block text-sm font-semibold text-white mb-3 drop-shadow-lg">
                  Responsable de l'action *
                </label>
                <input
                  type="text"
                  value={formData.responsable_action}
                  onChange={(e) => handleInputChange('responsable_action', e.target.value)}
                  className={`w-full px-4 py-3 backdrop-blur-md bg-white/20 border border-white/40 rounded-xl focus:ring-2 focus:ring-[#00E5B0] focus:border-[#00E5B0] transition-all duration-300 text-base text-white placeholder-[#EDEDED] ${
                    errors.responsable_action ? 'border-red-400' : 'border-white/40'
                  }`}
                  placeholder="Nom et prénom du responsable"
                />
                {errors.responsable_action && (
                  <p className="mt-1 text-sm text-red-600 drop-shadow-sm">{errors.responsable_action}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3 drop-shadow-lg">
                  Lieu de réalisation *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#EDEDED]" />
                  <input
                    type="text"
                    value={formData.lieu_realisation}
                    onChange={(e) => handleInputChange('lieu_realisation', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 backdrop-blur-md bg-white/20 border border-white/40 rounded-xl focus:ring-2 focus:ring-[#00E5B0] focus:border-[#00E5B0] transition-all duration-300 text-base text-white placeholder-[#EDEDED] ${
                      errors.lieu_realisation ? 'border-red-400' : 'border-white/40'
                    }`}
                    placeholder="Lieu de réalisation"
                  />
                </div>
                {errors.lieu_realisation && (
                  <p className="mt-1 text-sm text-red-600 drop-shadow-sm">{errors.lieu_realisation}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3 drop-shadow-lg">
                  Date de l'action *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#EDEDED]" />
                  <input
                    type="date"
                    value={formData.date_action}
                    onChange={(e) => handleInputChange('date_action', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 backdrop-blur-md bg-white/20 border border-white/40 rounded-xl focus:ring-2 focus:ring-[#00E5B0] focus:border-[#00E5B0] transition-all duration-300 text-base text-white placeholder-[#EDEDED] ${
                      errors.date_action ? 'border-red-400' : 'border-white/40'
                    }`}
                  />
                </div>
                {errors.date_action && (
                  <p className="mt-1 text-sm text-red-600 drop-shadow-sm">{errors.date_action}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3 drop-shadow-lg">
                  Nombre de participants *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#EDEDED]" />
                  <input
                    type="number"
                    min="0"
                    value={formData.nombre_participants}
                    onChange={(e) => handleInputChange('nombre_participants', parseInt(e.target.value) || 0)}
                    className={`w-full pl-10 pr-4 py-3 backdrop-blur-md bg-white/20 border border-white/40 rounded-xl focus:ring-2 focus:ring-[#00E5B0] focus:border-[#00E5B0] transition-all duration-300 text-base text-white placeholder-[#EDEDED] ${
                      errors.nombre_participants ? 'border-red-400' : 'border-white/40'
                    }`}
                    placeholder="0"
                  />
                </div>
                {errors.nombre_participants && (
                  <p className="mt-1 text-sm text-red-600 drop-shadow-sm">{errors.nombre_participants}</p>
                )}
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] bg-opacity-90 backdrop-blur-sm text-white rounded-xl hover:from-[#2563EB] hover:to-[#6D28D9] transition-all duration-300 font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-white/40 shadow-xl hover:shadow-2xl hover:scale-105 transform"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enregistrement en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Enregistrer l'action
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Pied de page supprimé pour simplifier */}
      </div>
    </div>
  </div>
  )
}
