'use client'

import React, { useState, useEffect } from 'react'
import { useAteliers } from '@/hooks/useAteliers'
import { useUser } from '@/contexts/UserContext'
import { useRole } from '@/hooks/useRole'
import { 
  Plus, Calendar, Users, MapPin, Clock, Edit3, Trash2, 
  Eye, Search, Filter, BookOpen, AlertCircle, CheckCircle,
  XCircle, PlayCircle, PauseCircle, X, ChevronRight
} from 'lucide-react'

export default function AteliersPage() {
  const { 
    ateliers, 
    loading, 
    error, 
    loadAteliers, 
    deleteAtelier 
  } = useAteliers()
  
  const { currentUser } = useUser()
  const { isAdmin } = useRole()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAtelier, setSelectedAtelier] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Charger les ateliers au montage
  useEffect(() => {
    loadAteliers()
  }, [loadAteliers])

  // Filtrer les ateliers
  const filteredAteliers = ateliers.filter(atelier => {
    const matchesSearch = atelier.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        atelier.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        atelier.lieu?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || atelier.statut === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Obtenir le statut en français
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planifie': return 'Planifié'
      case 'en_cours': return 'En cours'
      case 'termine': return 'Terminé'
      case 'annule': return 'Annulé'
      default: return status
    }
  }

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planifie': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'en_cours': return 'bg-green-100 text-green-800 border-green-200'
      case 'termine': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'annule': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculer la durée
  const getDuration = (dateDebut: string, dateFin: string) => {
    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)
    const diffMs = fin.getTime() - debut.getTime()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))
    return `${diffHours}h`
  }

  // Gérer la suppression
  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('Seuls les administrateurs peuvent supprimer des ateliers')
      return
    }
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet atelier ?')) {
      try {
        await deleteAtelier(id)
      } catch (error) {
        console.error('Erreur suppression:', error)
      }
    }
  }

  // Voir les détails
  const handleViewDetails = (atelier: any) => {
    setSelectedAtelier(atelier)
    setShowDetailsModal(true)
  }

  // Statistiques
  const stats = {
    total: ateliers.length,
    planifies: ateliers.filter(a => a.statut === 'planifie').length,
    enCours: ateliers.filter(a => a.statut === 'en_cours').length,
    termines: ateliers.filter(a => a.statut === 'termine').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des ateliers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadAteliers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                Ateliers
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez vos ateliers et workshops
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouvel atelier
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Planifiés</p>
                <p className="text-2xl font-bold text-blue-600">{stats.planifies}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <PlayCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-green-600">{stats.enCours}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Terminés</p>
                <p className="text-2xl font-bold text-gray-600">{stats.termines}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un atelier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des ateliers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Liste des ateliers ({filteredAteliers.length})
            </h2>
          </div>
          
          {filteredAteliers.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun atelier trouvé</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun atelier ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre premier atelier.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Créer un atelier
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAteliers.map((atelier) => (
                <div key={atelier.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{atelier.titre}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(atelier.statut)}`}>
                          {getStatusLabel(atelier.statut)}
                        </span>
                      </div>
                      
                      {atelier.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">{atelier.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(atelier.date_debut)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {getDuration(atelier.date_debut, atelier.date_fin)}
                        </div>
                        {atelier.lieu && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {atelier.lieu}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {atelier.capacite_actuelle || 0}/{atelier.capacite_max} participants
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewDetails(atelier)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {/* TODO: Edit */}}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(atelier.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails */}
      {showDetailsModal && selectedAtelier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{selectedAtelier.titre}</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-900">{selectedAtelier.description || 'Aucune description'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Date de début</h3>
                    <p className="text-gray-900">{formatDate(selectedAtelier.date_debut)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Date de fin</h3>
                    <p className="text-gray-900">{formatDate(selectedAtelier.date_fin)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Durée</h3>
                    <p className="text-gray-900">{getDuration(selectedAtelier.date_debut, selectedAtelier.date_fin)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Lieu</h3>
                    <p className="text-gray-900">{selectedAtelier.lieu || 'Non spécifié'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Capacité</h3>
                  <p className="text-gray-900">
                    {selectedAtelier.capacite_actuelle || 0} / {selectedAtelier.capacite_max} participants
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Statut</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedAtelier.statut)}`}>
                    {getStatusLabel(selectedAtelier.statut)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {/* TODO: Edit */}}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création (placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nouvel atelier</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Le formulaire de création d'atelier sera implémenté dans la prochaine étape.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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