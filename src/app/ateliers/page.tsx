'use client'

import React, { useState } from 'react'
import { useAteliers } from '@/hooks/useAteliers'
import { useUser } from '@/contexts/UserContext'
import { useRole } from '@/hooks/useRole'
import { 
  Plus, Calendar, Users, MapPin, Clock, Edit3, Trash2, 
  Eye, Search, Filter, BookOpen, AlertCircle, CheckCircle,
  XCircle, PlayCircle, PauseCircle, X
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
      case 'planifie': return 'bg-blue-100 text-blue-800'
      case 'en_cours': return 'bg-green-100 text-green-800'
      case 'termine': return 'bg-gray-100 text-gray-800'
      case 'annule': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              Ateliers
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez vos ateliers et suivez les inscriptions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Créer un atelier
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ateliers</p>
              <p className="text-2xl font-bold text-gray-900">{ateliers.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Planifiés</p>
              <p className="text-2xl font-bold text-blue-600">
                {ateliers.filter(a => a.statut === 'planifie').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-green-600">
                {ateliers.filter(a => a.statut === 'en_cours').length}
              </p>
            </div>
            <PlayCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terminés</p>
              <p className="text-2xl font-bold text-gray-600">
                {ateliers.filter(a => a.statut === 'termine').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un atelier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="planifie">Planifiés</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminés</option>
              <option value="annule">Annulés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des ateliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAteliers.map((atelier) => (
          <div key={atelier.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header de la carte */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {atelier.titre}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(atelier.statut)}`}>
                    {getStatusLabel(atelier.statut)}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(atelier)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Voir détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {atelier.animateur_id === currentUser?.id && (
                    <button
                      onClick={() => {/* TODO: Edit */}}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Modifier"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(atelier.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              {atelier.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {atelier.description}
                </p>
              )}

              {/* Informations */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(atelier.date_debut)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Durée: {getDuration(atelier.date_debut, atelier.date_fin)}</span>
                </div>
                
                {atelier.lieu && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{atelier.lieu}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{atelier.capacite_actuelle}/{atelier.capacite_max} participants</span>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Capacité</span>
                  <span>{Math.round((atelier.capacite_actuelle / atelier.capacite_max) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      atelier.capacite_actuelle >= atelier.capacite_max 
                        ? 'bg-red-500' 
                        : atelier.capacite_actuelle > atelier.capacite_max * 0.8 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((atelier.capacite_actuelle / atelier.capacite_max) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Animateur */}
              {atelier.animateur_nom && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Animateur</p>
                  <p className="text-sm font-medium text-gray-900">{atelier.animateur_nom}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun atelier */}
      {filteredAteliers.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun atelier trouvé
          </h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Aucun atelier ne correspond à vos critères de recherche.'
              : 'Commencez par créer votre premier atelier.'
            }
          </p>
        </div>
      )}

      {/* Modal de détails (à implémenter) */}
      {showDetailsModal && selectedAtelier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Détails de l'atelier</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedAtelier.titre}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900">{selectedAtelier.description || 'Aucune description'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                    <p className="text-gray-900">{formatDate(selectedAtelier.date_debut)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                    <p className="text-gray-900">{formatDate(selectedAtelier.date_fin)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                    <p className="text-gray-900">{selectedAtelier.lieu || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
                    <p className="text-gray-900">{selectedAtelier.capacite_actuelle}/{selectedAtelier.capacite_max}</p>
                  </div>
                </div>
                
                {selectedAtelier.pole && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pôle</label>
                    <p className="text-gray-900">{selectedAtelier.pole}</p>
                  </div>
                )}
                
                {selectedAtelier.filliere && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
                    <p className="text-gray-900">{selectedAtelier.filliere}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création (à implémenter) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Créer un atelier</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600">
                Formulaire de création d'atelier à implémenter...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 