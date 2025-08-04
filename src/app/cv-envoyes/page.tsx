'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Download, Eye, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react'

interface Candidature {
  id: string
  entreprise_nom: string
  poste: string
  type_contrat: string
  date_candidature: string
  source_offre: string
  statut_candidature: string
  created_at: string
  cv_url?: string
  nom?: string
  prenom?: string
  email?: string
  telephone?: string
}

const CandidaturesRecuesPage = () => {
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [showDetails, setShowDetails] = useState(false)

  // Charger les candidatures
  const loadCandidatures = async () => {
    try {
      console.log('🔍 Chargement des candidatures reçues...')
      
      const { data, error } = await supabase
        .from('candidatures_stagiaires')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      console.log('📊 Candidatures trouvées:', data?.length || 0)
      setCandidatures(data || [])
    } catch (err) {
      console.error('Erreur chargement candidatures:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCandidatures()
  }, [])

  // Filtrer les candidatures
  const filteredCandidatures = candidatures.filter(candidature => {
    const matchesSearch = candidature.entreprise_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidature.poste.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidature.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidature.prenom?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'tous' || candidature.statut_candidature === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Mettre à jour le statut d'une candidature
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('candidatures_stagiaires')
        .update({ statut_candidature: newStatus })
        .eq('id', id)
      
      if (error) throw error
      
      // Recharger les candidatures
      loadCandidatures()
    } catch (err) {
      console.error('Erreur mise à jour statut:', err)
    }
  }

  // Télécharger le CV
  const downloadCV = async (cvUrl: string, fileName: string) => {
    try {
      const response = await fetch(cvUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Erreur téléchargement CV:', err)
    }
  }

  // Obtenir l'icône du statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'envoye':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'accepte':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'refuse':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'envoye':
        return 'bg-blue-100 text-blue-800'
      case 'accepte':
        return 'bg-green-100 text-green-800'
      case 'refuse':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Obtenir le texte du statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'envoye':
        return 'Envoyée'
      case 'accepte':
        return 'Acceptée'
      case 'refuse':
        return 'Refusée'
      default:
        return 'En attente'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Candidatures Reçues</h1>
          <p className="text-gray-600">Gérez les candidatures des stagiaires</p>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Rechercher
              </label>
              <input
                type="text"
                placeholder="Rechercher par entreprise, poste, nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tous">Tous les statuts</option>
                <option value="envoye">Envoyée</option>
                <option value="accepte">Acceptée</option>
                <option value="refuse">Refusée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des candidatures */}
        <div className="grid gap-6">
          {filteredCandidatures.map((candidature) => (
            <div key={candidature.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {candidature.entreprise_nom}
                    </h3>
                    <p className="text-gray-600 mb-2">{candidature.poste}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Type: {candidature.type_contrat}</span>
                      <span>Date: {new Date(candidature.date_candidature).toLocaleDateString('fr-FR')}</span>
                      <span>Source: {candidature.source_offre}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidature.statut_candidature)}`}>
                      {getStatusIcon(candidature.statut_candidature)}
                      <span className="ml-1">{getStatusText(candidature.statut_candidature)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedCandidature(candidature)
                      setShowDetails(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Voir détails
                  </button>
                  
                  {candidature.cv_url && (
                    <button
                      onClick={() => downloadCV(candidature.cv_url!, `CV_${candidature.entreprise_nom}_${candidature.poste}.pdf`)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger CV
                    </button>
                  )}

                  {/* Actions rapides pour le statut */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(candidature.id, 'accepte')}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => updateStatus(candidature.id, 'refuse')}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCandidatures.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucune candidature trouvée</p>
          </div>
        )}
      </div>

      {/* Modal détails */}
      {showDetails && selectedCandidature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Détails de la candidature</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Informations de l'offre</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Entreprise</label>
                      <p className="text-gray-900">{selectedCandidature.entreprise_nom}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Poste</label>
                      <p className="text-gray-900">{selectedCandidature.poste}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Type de contrat</label>
                      <p className="text-gray-900">{selectedCandidature.type_contrat}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Date de candidature</label>
                      <p className="text-gray-900">{new Date(selectedCandidature.date_candidature).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Informations du candidat</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Nom</label>
                      <p className="text-gray-900">{selectedCandidature.nom || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Prénom</label>
                      <p className="text-gray-900">{selectedCandidature.prenom || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedCandidature.email || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Téléphone</label>
                      <p className="text-gray-900">{selectedCandidature.telephone || 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Statut</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCandidature.statut_candidature)}`}>
                      {getStatusIcon(selectedCandidature.statut_candidature)}
                      <span className="ml-1">{getStatusText(selectedCandidature.statut_candidature)}</span>
                    </span>
                  </div>
                </div>

                {selectedCandidature.cv_url && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">CV</h3>
                    <button
                      onClick={() => downloadCV(selectedCandidature.cv_url!, `CV_${selectedCandidature.entreprise_nom}_${selectedCandidature.poste}.pdf`)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger CV
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CandidaturesRecuesPage 