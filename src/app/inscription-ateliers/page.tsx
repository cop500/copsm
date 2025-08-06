'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
import { 
  Calendar, Clock, MapPin, Users, BookOpen, CheckCircle, XCircle,
  AlertCircle, Loader2, ArrowRight, Star, Zap, Target, Award
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
        .eq('email', formData.email)
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
          nom: formData.nom,
          email: formData.email,
          pole: formData.pole,
          filliere: formData.filliere,
          telephone: formData.telephone,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Inscription aux Ateliers
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez nos ateliers spécialisés et inscrivez-vous aux sessions qui vous intéressent. 
              Développez vos compétences avec nos experts !
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtrer les ateliers</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un atelier..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pôle</label>
              <select
                value={filterPole}
                onChange={(e) => setFilterPole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les pôles</option>
                {poles.filter(p => p.actif).map(pole => (
                  <option key={pole.id} value={pole.nom}>{pole.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filière</label>
              <select
                value={filterFiliere}
                onChange={(e) => setFilterFiliere(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes les filières</option>
                {filieres.filter(f => f.actif).map(filiere => (
                  <option key={filiere.id} value={filiere.nom}>{filiere.nom}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterPole('')
                  setFilterFiliere('')
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des ateliers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAteliers.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm border p-12 text-center">
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
            filteredAteliers.map(atelier => (
              <div key={atelier.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{atelier.titre}</h3>
                      <p className="text-gray-600 text-sm line-clamp-3">{atelier.description}</p>
                    </div>
                    <div className="ml-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        atelier.statut === 'planifie' ? 'bg-blue-100 text-blue-800' :
                        atelier.statut === 'en_cours' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {atelier.statut === 'planifie' ? 'Planifié' :
                         atelier.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(atelier.date_debut).toLocaleDateString('fr-FR')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(atelier.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(atelier.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{atelier.lieu}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{atelier.capacite_actuelle} / {atelier.capacite_max} places</span>
                    </div>

                    {atelier.pole && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="w-4 h-4" />
                        <span>{atelier.pole} - {atelier.filliere}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {atelier.capacite_actuelle < atelier.capacite_max ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        atelier.capacite_actuelle < atelier.capacite_max ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {atelier.capacite_actuelle < atelier.capacite_max ? 'Places disponibles' : 'Complet'}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => openInscriptionForm(atelier)}
                      disabled={atelier.capacite_actuelle >= atelier.capacite_max}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        atelier.capacite_actuelle < atelier.capacite_max
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {inscriptionSuccess ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Inscription réussie !</h3>
                  <p className="text-gray-600 mb-6">
                    Votre inscription à l'atelier <strong>"{selectedAtelier.titre}"</strong> a été confirmée.
                    Vous recevrez un email de confirmation.
                  </p>
                  <button
                    onClick={closeInscriptionForm}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Inscription à l'atelier</h2>
                    <button
                      onClick={closeInscriptionForm}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-blue-900 mb-2">{selectedAtelier.titre}</h3>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>📅 {new Date(selectedAtelier.date_debut).toLocaleDateString('fr-FR')}</p>
                      <p>🕐 {new Date(selectedAtelier.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedAtelier.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p>📍 {selectedAtelier.lieu}</p>
                      <p>👥 {selectedAtelier.capacite_actuelle} / {selectedAtelier.capacite_max} places</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleInscription} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Inscription...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
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