'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
import { 
  Calendar, Clock, MapPin, Users, BookOpen, CheckCircle, XCircle,
  AlertCircle, Loader2, ArrowRight, Star, Zap, Target, Award, Search,
  User, ChevronRight
} from 'lucide-react'

interface Atelier {
  id: string
  titre: string
  description: string
  date_debut: string
  date_fin: string
  capacite_maximale: number
  capacite_actuelle: number
  pole: string | null
  filliere: string | null
  lieu: string
  statut: string
  animateur_nom?: string
  animateur_role?: string
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
      setError(null)
      
      console.log('🔄 Chargement des ateliers depuis evenements...')
      
      // Utiliser la table evenements pour la cohérence
      const { data, error } = await supabase
        .from('evenements')
        .select('*')
        .eq('type_evenement', 'atelier')
        .eq('visible_inscription', true)
        .in('statut', ['planifie', 'en_cours'])
        .order('date_debut', { ascending: true })

      if (error) {
        console.error('❌ Erreur chargement ateliers:', error)
        throw error
      }
      
      console.log('✅ Ateliers chargés:', data)
      
      // Debug: vérifier les valeurs de capacité
      if (data && data.length > 0) {
        console.log('🔍 Premier atelier debug (inscription):', {
          id: data[0].id,
          titre: data[0].titre,
          capacite_maximale: data[0].capacite_maximale,
          capacite_actuelle: data[0].capacite_actuelle,
          visible_inscription: data[0].visible_inscription
        });
      }
      
      setAteliers(data || [])
    } catch (err: any) {
      console.error('❌ Erreur chargement ateliers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les filières selon le pôle sélectionné
  const filieresFiltered = React.useMemo(() => {
    if (!formData.pole) return []
    const pole = poles.find(p => p.nom === formData.pole)
    return pole ? filieres.filter(f => f.pole_id === pole.id) : []
  }, [formData.pole, poles, filieres])

  // Filtrer les ateliers
  const filteredAteliers = React.useMemo(() => {
    return ateliers.filter(atelier => {
      const matchesSearch = searchTerm === '' || 
        atelier.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (atelier.description && atelier.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesPole = !filterPole || atelier.pole === filterPole
      const matchesFiliere = !filterFiliere || atelier.filliere === filterFiliere

      return matchesSearch && matchesPole && matchesFiliere
    })
  }, [ateliers, searchTerm, filterPole, filterFiliere])

  // S'inscrire à un atelier
  const handleInscription = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
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

      // Vérifier la capacité en comptant les inscriptions actives (non annulées)
      const { data: activeInscriptions, error: countError } = await supabase
        .from('inscriptions_ateliers')
        .select('id', { count: 'exact', head: false })
        .eq('atelier_id', selectedAtelier!.id)
        .or('statut.is.null,statut.neq.annule')

      if (countError) throw countError

      const activeCount = activeInscriptions?.length || 0
      if (activeCount >= selectedAtelier!.capacite_maximale) {
        throw new Error('Cet atelier est complet')
      }

      // Créer l'inscription
      // Ne pas inclure statut pour laisser la valeur par défaut NULL s'appliquer
      const { error: insertError } = await supabase
        .from('inscriptions_ateliers')
        .insert([{
          atelier_id: selectedAtelier!.id,
          stagiaire_nom: formData.nom,
          stagiaire_email: formData.email,
          pole: formData.pole,
          filliere: formData.filliere,
          stagiaire_telephone: formData.telephone,
          date_inscription: new Date().toISOString()
          // statut non inclus : la valeur par défaut NULL sera utilisée automatiquement
        }])

      if (insertError) throw insertError

      // Mettre à jour la capacité de l'atelier dans evenements
      const { error: updateError } = await supabase
        .from('evenements')
        .update({ capacite_actuelle: (selectedAtelier!.capacite_actuelle || 0) + 1 })
        .eq('id', selectedAtelier!.id)

      if (updateError) throw updateError

      setInscriptionSuccess(true)
      setFormData({
        nom: '',
        email: '',
        pole: '',
        filliere: '',
        telephone: ''
      })
      
      await loadAteliers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Ouvrir le formulaire d'inscription
  const openInscriptionForm = (atelier: Atelier) => {
    // Vérifier si l'atelier est complet (seulement si capacité maximale définie)
    if (atelier.capacite_maximale && (atelier.capacite_actuelle || 0) >= atelier.capacite_maximale) {
      setError('Cet atelier est complet. Aucune place disponible.')
      return
    }
    
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

  // Obtenir le statut de l'atelier
  const getAtelierStatus = (atelier: Atelier) => {
    const capaciteActuelle = atelier.capacite_actuelle || 0
    const capaciteMaximale = atelier.capacite_maximale || 0
    
    // Si pas de capacité maximale définie, considérer comme disponible
    if (capaciteMaximale === 0) {
      return { text: 'Places disponibles', color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' }
    }
    
    if (capaciteActuelle >= capaciteMaximale) {
      return { text: 'Complet', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' }
    } else if (atelier.statut === 'planifie') {
      return { text: 'Places disponibles', color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' }
    } else {
      return { text: 'Planifié', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🔵' }
    }
  }

  useEffect(() => {
    loadAteliers()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Chargement des ateliers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100">
      {/* Header avec effet de flou */}
      <div className="relative bg-gradient-to-r from-blue-600/80 to-blue-700/80 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-700/20"></div>
        <div className="relative z-10 container mx-auto px-4 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Espace Ateliers
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Découvrez, réservez et participez à nos ateliers de développement professionnel
            </p>
          </div>
        </div>
      </div>
      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Section Ateliers disponibles */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Ateliers Disponibles
              </h2>
              <button
                onClick={loadAteliers}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Loader2 className="w-4 h-4" />
                Actualiser
              </button>
            </div>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-yellow-400 mx-auto mb-8"></div>
          </div>

          {/* Liste des ateliers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAteliers.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun atelier disponible</h3>
                <p className="text-gray-600">
                  {searchTerm || filterPole || filterFiliere 
                    ? 'Aucun atelier ne correspond à vos critères de recherche.'
                    : 'Aucun atelier n\'est actuellement disponible pour inscription.'
                  }
                </p>
              </div>
            ) : (
              filteredAteliers.map(atelier => {
                const status = getAtelierStatus(atelier)
                return (
                  <div 
                    key={atelier.id} 
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group"
                    onClick={() => openInscriptionForm(atelier)}
                  >
                    {/* Badge de statut */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
                        {status.icon} {status.text}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>

                    {/* Titre */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {atelier.titre}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {atelier.description}
                    </p>

                    {/* Informations de l'atelier */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-gray-700">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium">
                          {new Date(atelier.date_debut).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-700">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium">
                          {new Date(atelier.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(atelier.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-700">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium">{atelier.lieu}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-700">
                        <Users className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium">
                          {atelier.capacite_actuelle || 0} / {atelier.capacite_maximale || 'N/A'} places
                        </span>
                      </div>

                      {/* Animateur */}
                      {atelier.animateur_nom && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <User className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-medium">
                            {atelier.animateur_nom}
                            {atelier.animateur_role && (
                              <span className="text-gray-500 ml-1">({atelier.animateur_role})</span>
                            )}
                          </span>
                        </div>
                      )}

                      {atelier.pole && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Target className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-medium">
                            {atelier.pole} - {atelier.filliere}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bouton S'inscrire */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openInscriptionForm(atelier)
                      }}
                      disabled={atelier.capacite_maximale && (atelier.capacite_actuelle || 0) >= atelier.capacite_maximale}
                      className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                        !atelier.capacite_maximale || (atelier.capacite_actuelle || 0) < atelier.capacite_maximale
                          ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>
                        {!atelier.capacite_maximale || (atelier.capacite_actuelle || 0) < atelier.capacite_maximale ? 'S\'inscrire' : 'Complet'}
                      </span>
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Formulaire d'inscription */}
      {showInscriptionForm && selectedAtelier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {inscriptionSuccess ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Inscription réussie !</h3>
                  <p className="text-gray-600 mb-8">
                    Votre inscription à l'atelier <strong>"{selectedAtelier.titre}"</strong> a été confirmée.
                    <br />Votre inscription est prise en compte.
                  </p>
                  <button
                    onClick={closeInscriptionForm}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Inscription à l'atelier</h2>
                    <button
                      onClick={closeInscriptionForm}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">{selectedAtelier.titre}</h3>
                    <div className="text-gray-600 space-y-1 text-sm">
                      <p>📅 {new Date(selectedAtelier.date_debut).toLocaleDateString('fr-FR')}</p>
                      <p>🕐 {new Date(selectedAtelier.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedAtelier.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p>📍 {selectedAtelier.lieu}</p>
                      <p>👥 {selectedAtelier.capacite_actuelle || 0} / {selectedAtelier.capacite_maximale || 'N/A'} places</p>
                      {selectedAtelier.animateur_nom && (
                        <p>👨‍🏫 {selectedAtelier.animateur_nom}</p>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 font-medium">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleInscription} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nom complet <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Votre nom complet"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="votre.email@exemple.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          value={formData.telephone}
                          onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="06 12 34 56 78"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Pôle <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.pole}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            pole: e.target.value,
                            filliere: ''
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        >
                          <option value="">Sélectionnez un pôle</option>
                          {poles.filter(p => p.actif).map(pole => (
                            <option key={pole.id} value={pole.nom}>{pole.nom}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Filière <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.filliere}
                        onChange={(e) => setFormData(prev => ({ ...prev, filliere: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                        disabled={!formData.pole}
                        required
                      >
                        <option value="">
                          {formData.pole ? 'Sélectionnez une filière' : 'Sélectionnez d\'abord un pôle'}
                        </option>
                        {filieresFiltered.map(filiere => (
                          <option key={filiere.id} value={filiere.nom}>{filiere.nom}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={closeInscriptionForm}
                        className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold transition-colors"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Inscription en cours...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Confirmer l'inscription</span>
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