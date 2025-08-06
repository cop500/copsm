'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
import './styles.css'
import { 
  Calendar, Clock, MapPin, Users, BookOpen, CheckCircle, XCircle,
  AlertCircle, Loader2, ArrowRight, Star, Zap, Target, Award, Search
} from 'lucide-react'

interface Atelier {
  id: string
  titre: string
  description: string
  date_debut: string
  date_fin: string
  capacite_max: number
  capacite_actuelle: number
  pole: string | null
  filliere: string | null
  lieu: string
  statut: string
}

interface InscriptionForm {
  nom: string
  email: string
  pole: string
  filliere: string
  telephone?: string
}

export default function InscriptionAteliersPage() {
  const { poles, filieres } = useSettings()
  const [ateliers, setAteliers] = useState<Atelier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAtelier, setSelectedAtelier] = useState<Atelier | null>(null)
  const [showInscriptionForm, setShowInscriptionForm] = useState(false)
  const [inscriptionSuccess, setInscriptionSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filtres
  const [filterPole, setFilterPole] = useState('')
  const [filterFiliere, setFilterFiliere] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Formulaire d'inscription
  const [formData, setFormData] = useState<InscriptionForm>({
    nom: '',
    email: '',
    pole: '',
    filliere: '',
    telephone: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Charger les ateliers disponibles
  const loadAteliers = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('ateliers')
        .select('*')
        .eq('statut', 'planifie')
        .gte('date_debut', new Date().toISOString())
        .order('date_debut', { ascending: true })

      if (error) throw error
      
      setAteliers(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Erreur chargement ateliers:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les filières selon le pôle sélectionné
  const filieresFiltered = formData.pole 
    ? filieres.filter(f => {
        const pole = poles.find(p => p.nom === formData.pole)
        return pole && f.pole_id === pole.id
      })
    : []

  // Filtrer les ateliers
  const filteredAteliers = ateliers.filter(atelier => {
    const matchesSearch = atelier.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atelier.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPole = !filterPole || atelier.pole === filterPole
    const matchesFiliere = !filterFiliere || atelier.filliere === filterFiliere
    const hasCapacity = atelier.capacite_actuelle < atelier.capacite_max

    return matchesSearch && matchesPole && matchesFiliere && hasCapacity
  })

  // S'inscrire à un atelier
  const handleInscription = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Valider les données
      if (!formData.nom || !formData.email || !formData.pole || !formData.filliere) {
        throw new Error('Veuillez remplir tous les champs obligatoires')
      }

             // Vérifier si l'utilisateur n'est pas déjà inscrit
       const { data: existingInscription, error: checkError } = await supabase
         .from('inscriptions_ateliers')
         .select('*')
         .eq('atelier_id', selectedAtelier!.id)
         .eq('stagiaire_email', formData.email)
         .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingInscription) {
        throw new Error('Vous êtes déjà inscrit à cet atelier')
      }

      // Vérifier la capacité
      if (selectedAtelier!.capacite_actuelle >= selectedAtelier!.capacite_max) {
        throw new Error('Cet atelier est complet')
      }

             // Créer l'inscription
       const { error: insertError } = await supabase
         .from('inscriptions_ateliers')
         .insert([{
           atelier_id: selectedAtelier!.id,
           stagiaire_nom: formData.nom,
           stagiaire_email: formData.email,
           pole: formData.pole,
           filliere: formData.filliere,
           stagiaire_telephone: formData.telephone,
           statut: 'en_attente',
           date_inscription: new Date().toISOString()
         }])

      if (insertError) throw insertError

      // Mettre à jour la capacité de l'atelier
      const { error: updateError } = await supabase
        .from('ateliers')
        .update({ capacite_actuelle: selectedAtelier!.capacite_actuelle + 1 })
        .eq('id', selectedAtelier!.id)

      if (updateError) throw updateError

      // Succès
      setInscriptionSuccess(true)
      setFormData({
        nom: '',
        email: '',
        pole: '',
        filliere: '',
        telephone: ''
      })
      
      // Recharger les ateliers
      await loadAteliers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Ouvrir le formulaire d'inscription
  const openInscriptionForm = (atelier: Atelier) => {
    setSelectedAtelier(atelier)
    setShowInscriptionForm(true)
    setInscriptionSuccess(false)
    setError(null)
  }

  // Fermer le formulaire
  const closeInscriptionForm = () => {
    setShowInscriptionForm(false)
    setSelectedAtelier(null)
    setInscriptionSuccess(false)
    setError(null)
  }

  useEffect(() => {
    loadAteliers()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Chargement des ateliers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-['Montserrat']">
      {/* En-tête avec background image */}
      <div className="relative bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: "url('/bg-entreprise.jpg')"
      }}>
        {/* Overlay pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* Logo animé */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse" style={{animationDelay: '0.5s'}}>
                <Target className="w-12 h-12 text-white" />
              </div>
              <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse" style={{animationDelay: '1s'}}>
                <Award className="w-12 h-12 text-white" />
              </div>
            </div>
            
            {/* Titre principal */}
            <h1 className="text-6xl font-black mb-6 leading-tight text-gray-100">
              🚀 ATELIERS COP
            </h1>
            
            {/* Sous-titre accrocheur */}
            <h2 className="text-4xl font-bold text-gray-50 mb-8 leading-tight">
              Transformez votre avenir professionnel !
            </h2>
            
            {/* Description motivante */}
            <div className="max-w-4xl mx-auto">
              <p className="text-2xl text-gray-200 mb-6 leading-relaxed font-medium">
                Rejoignez nos ateliers et développez vos compétences
              </p>
              <p className="text-xl text-gray-300 leading-relaxed">
                ✨ Formations pratiques • 🎯 Projets concrets
              </p>
            </div>
            
            {/* Call-to-action */}
            <div className="mt-10">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full px-8 py-4 shadow-lg border border-blue-300">
                <Zap className="w-6 h-6 text-white animate-bounce" />
                <span className="text-white font-semibold text-lg">
                  Inscriptions ouvertes - Places limitées !
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

             {/* Liste des ateliers */}
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
         {/* Titre de section */}
         <div className="text-center mb-12">
           <h2 className="text-4xl font-bold text-blue-900 mb-4">
             🎯 Ateliers Disponibles
           </h2>
           <p className="text-xl text-gray-600 max-w-2xl mx-auto">
             Découvrez nos ateliers spécialisés et inscrivez-vous aux sessions qui vous intéressent
           </p>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredAteliers.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-blue-100 p-16 text-center">
              <BookOpen className="w-20 h-20 text-blue-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Aucun atelier disponible</h3>
              <p className="text-gray-600 text-lg">
                {searchTerm || filterPole || filterFiliere 
                  ? 'Aucun atelier ne correspond à vos critères de recherche.'
                  : 'Aucun atelier n\'est actuellement disponible pour inscription.'
                }
              </p>
            </div>
          ) : (
            filteredAteliers.map(atelier => (
              <div key={atelier.id} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 overflow-hidden hover:shadow-xl transition-all duration-300 opacity-0 animate-fade-in">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-blue-900 mb-3 leading-tight">{atelier.titre}</h3>
                      <p className="text-gray-700 text-base leading-relaxed line-clamp-3">{atelier.description}</p>
                    </div>
                    <div className="ml-6">
                      <span className={`px-3 py-2 rounded-full text-sm font-semibold ${
                        atelier.statut === 'planifie' ? 'bg-blue-200 text-blue-800 border border-blue-300' :
                        atelier.statut === 'en_cours' ? 'bg-green-200 text-green-800 border border-green-300' :
                        'bg-gray-200 text-gray-800 border border-gray-300'
                      }`}>
                        {atelier.statut === 'planifie' ? 'Planifié' :
                         atelier.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="border-b border-blue-200 pb-4">
                                           <div className="flex items-center gap-3 text-blue-900 font-medium">
                       <Calendar className="w-5 h-5 text-blue-400" />
                       <span className="text-lg">{new Date(atelier.date_debut).toLocaleDateString('fr-FR')}</span>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-3 text-blue-900 font-medium">
                     <Clock className="w-5 h-5 text-blue-400" />
                     <span className="text-lg">
                       {new Date(atelier.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - 
                       {new Date(atelier.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                     </span>
                   </div>
                   
                   <div className="flex items-center gap-3 text-blue-900 font-medium">
                     <MapPin className="w-5 h-5 text-blue-400" />
                     <span className="text-lg">{atelier.lieu}</span>
                   </div>
                   
                   <div className="flex items-center gap-3 text-blue-900 font-medium">
                     <Users className="w-5 h-5 text-blue-400" />
                     <span className="text-lg">{atelier.capacite_actuelle} / {atelier.capacite_max} places</span>
                   </div>

                   {atelier.pole && (
                     <div className="flex items-center gap-3 text-blue-900 font-medium">
                       <Target className="w-5 h-5 text-blue-400" />
                       <span className="text-lg">{atelier.pole} - {atelier.filliere}</span>
                     </div>
                   )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-blue-200">
                    <div className="flex items-center gap-3">
                      {atelier.capacite_actuelle < atelier.capacite_max ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                      <span className={`text-lg font-semibold ${
                        atelier.capacite_actuelle < atelier.capacite_max ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {atelier.capacite_actuelle < atelier.capacite_max ? 'Places disponibles' : 'Complet'}
                      </span>
                    </div>
                    
                                         <button
                       onClick={() => openInscriptionForm(atelier)}
                       disabled={atelier.capacite_actuelle >= atelier.capacite_max}
                       className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-3 ${
                         atelier.capacite_actuelle < atelier.capacite_max
                           ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105'
                           : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                       }`}
                     >
                       <ArrowRight className="w-5 h-5" />
                       S'inscrire
                     </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

             {/* Modal Formulaire d'inscription */}
       {showInscriptionForm && selectedAtelier && (
         <div className="fixed inset-0 bg-gradient-to-br from-blue-600/90 via-purple-600/90 to-indigo-600/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
           <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-blue-200">
            <div className="p-8">
                              {inscriptionSuccess ? (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-blue-900 mb-4">Inscription réussie !</h3>
                    <p className="text-gray-700 mb-8 text-lg leading-relaxed">
                      Votre inscription à l'atelier <strong className="text-blue-900">"{selectedAtelier.titre}"</strong> a été confirmée.
                      Vous recevrez un email de confirmation.
                    </p>
                    <button
                      onClick={closeInscriptionForm}
                      className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 font-semibold shadow-lg"
                    >
                      Fermer
                    </button>
                  </div>
              ) : (
                                  <>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-blue-900">Inscription à l'atelier</h2>
                      <button
                        onClick={closeInscriptionForm}
                        className="text-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <XCircle className="w-8 h-8" />
                      </button>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-8 border border-blue-200">
                      <h3 className="font-bold text-blue-900 mb-4 text-xl">{selectedAtelier.titre}</h3>
                      <div className="text-blue-800 space-y-2 text-lg">
                        <p className="flex items-center gap-2">📅 {new Date(selectedAtelier.date_debut).toLocaleDateString('fr-FR')}</p>
                        <p className="flex items-center gap-2">🕐 {new Date(selectedAtelier.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedAtelier.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="flex items-center gap-2">📍 {selectedAtelier.lieu}</p>
                        <p className="flex items-center gap-2">👥 {selectedAtelier.capacite_actuelle} / {selectedAtelier.capacite_max} places</p>
                      </div>
                    </div>

                                      {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 font-medium">{error}</p>
                      </div>
                    )}

                                        <form onSubmit={handleInscription} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-blue-900 mb-3">
                          Nom complet <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                          className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/50 transition-all duration-200"
                          placeholder="Votre nom complet"
                          required
                        />
                      </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="votre.email@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="06 12 34 56 78"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pôle <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.pole}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          pole: e.target.value,
                          filliere: '' // Réinitialiser la filière
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Sélectionner un pôle</option>
                        {poles.filter(p => p.actif).map(pole => (
                          <option key={pole.id} value={pole.nom}>{pole.nom}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Filière <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.filliere}
                        onChange={(e) => setFormData(prev => ({ ...prev, filliere: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!formData.pole}
                        required
                      >
                        <option value="">
                          {formData.pole ? 'Sélectionner une filière' : 'Sélectionnez d\'abord un pôle'}
                        </option>
                        {filieresFiltered.map(filiere => (
                          <option key={filiere.id} value={filiere.nom}>{filiere.nom}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeInscriptionForm}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Annuler
                      </button>
                                             <button
                         type="submit"
                         disabled={submitting}
                         className="flex-1 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-110 border-2 border-orange-300"
                       >
                         {submitting ? (
                           <>
                             <Loader2 className="w-5 h-5 animate-spin" />
                             Inscription...
                           </>
                         ) : (
                           <>
                             <CheckCircle className="w-5 h-5" />
                             Confirmer l'inscription
                           </>
                         )}
                       </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 