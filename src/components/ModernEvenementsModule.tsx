'use client'

import React, { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, Plus, Search, Filter, Grid, List, 
  Clock, CheckCircle, AlertTriangle, XCircle,
  TrendingUp, Users, MapPin, FileText, Zap, Edit3,
  BookOpen, Eye, Trash2
} from 'lucide-react'
import { NewEventForm } from './NewEventForm'
import { EventCard } from './EventCard'
import AIContentGenerator from './AIContentGenerator'
import { RapportsList } from './RapportsList'

export const ModernEvenementsModule = () => {
  const { eventTypes } = useSettings()
  const [showForm, setShowForm] = useState(false)
  const [evenements, setEvenements] = useState<any[]>([])
  const [ateliers, setAteliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [typeFilter, setTypeFilter] = useState('tous') // 'tous', 'evenements', 'ateliers'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedAtelier, setSelectedAtelier] = useState<any>(null)
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [showEventDetail, setShowEventDetail] = useState(false)
  const [showAtelierDetail, setShowAtelierDetail] = useState(false)
  const [eventDetailTab, setEventDetailTab] = useState<'details' | 'rapports'>('details')
  const [activeTab, setActiveTab] = useState<'evenements' | 'ateliers'>('evenements')

  // Charger les événements et ateliers
  const loadEvenements = async () => {
    try {
      setLoading(true)
      
      // Charger les événements
      const { data: evenementsData, error: evenementsError } = await supabase
        .from('evenements')
        .select(`
          *,
          event_types(nom, couleur)
        `)
        .order('date_debut', { ascending: false })

      if (evenementsError) throw evenementsError
      
      // Charger les ateliers
      const { data: ateliersData, error: ateliersError } = await supabase
        .from('ateliers')
        .select('*')
        .order('date_debut', { ascending: false })

      if (ateliersError) throw ateliersError
      
      setEvenements(evenementsData || [])
      setAteliers(ateliersData || [])
    } catch (err: any) {
      console.error('Erreur chargement:', err)
      showMessage('Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Afficher un message
  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // Sauvegarder un événement
  const handleSaveEvent = async (eventData: any) => {
    try {
      showMessage('Événement sauvegardé avec succès !')
      setShowForm(false)
      await loadEvenements()
    } catch (error: any) {
      showMessage('Erreur lors de la sauvegarde', 'error')
    }
  }

  // Supprimer un événement
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return

    try {
      const { error } = await supabase
        .from('evenements')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      showMessage('Événement supprimé avec succès')
      await loadEvenements()
    } catch (error: any) {
      showMessage('Erreur lors de la suppression', 'error')
    }
  }

  // Modifier un événement
  const handleEditEvent = (event: any) => {
    setSelectedEvent(event)
    setShowForm(true)
  }

  // Voir les détails d'un événement
  const handleViewEvent = (event: any) => {
    setSelectedEvent(event)
    setShowEventDetail(true)
  }

  // Voir les détails d'un atelier
  const handleViewAtelier = (atelier: any) => {
    setSelectedAtelier(atelier)
    setShowAtelierDetail(true)
  }

  // Supprimer un atelier
  const handleDeleteAtelier = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet atelier ?')) return

    try {
      const { error } = await supabase
        .from('ateliers')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      showMessage('Atelier supprimé avec succès')
      await loadEvenements()
    } catch (error: any) {
      showMessage('Erreur lors de la suppression', 'error')
    }
  }

  // Gérer la génération de contenu IA
  const handleContentGenerated = (content: string) => {
    console.log('🔄 Contenu généré reçu:', content.substring(0, 100) + '...')
    setGeneratedContent(content)
    showMessage('Contenu généré avec succès !')
    // Ne pas fermer le modal du générateur ici, laisser l'utilisateur voir le résultat
    // Le modal de contenu généré s'affichera automatiquement grâce à la condition {generatedContent && ...}
  }

  // Fermer le modal de contenu généré
  const closeGeneratedContent = () => {
    setGeneratedContent('')
    setShowAIGenerator(false) // Fermer aussi le générateur
  }

  // Réinitialiser tous les états des modals (en cas de problème)
  const resetModalStates = () => {
    setShowAIGenerator(false)
    setGeneratedContent('')
    setShowEventDetail(false)
    setShowAtelierDetail(false)
    setSelectedEvent(null)
    setSelectedAtelier(null)
  }

  // Ouvrir le générateur IA pour un événement spécifique
  const handleGenerateContent = (event: any) => {
    setSelectedEvent(event)
    setShowAIGenerator(true)
  }



  // Statistiques
  const getStatusCount = (status: string) => 
    evenements.filter(e => e.statut === status).length

  const getTypeCount = (typeId: string) => 
    evenements.filter(e => e.type_evenement_id === typeId).length

  // Fonctions utilitaires pour les ateliers
  const getAtelierStatusLabel = (status: string) => {
    switch (status) {
      case 'planifie': return 'Planifié'
      case 'en_cours': return 'En cours'
      case 'termine': return 'Terminé'
      case 'annule': return 'Annulé'
      default: return status
    }
  }

  const getAtelierStatusColor = (status: string) => {
    switch (status) {
      case 'planifie': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'en_cours': return 'bg-green-100 text-green-800 border-green-200'
      case 'termine': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'annule': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDuration = (dateDebut: string, dateFin: string) => {
    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)
    const diffMs = fin.getTime() - debut.getTime()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))
    return `${diffHours}h`
  }

  // Filtrer selon l'onglet actif
  const filteredEvenements = evenements.filter(event => {
    const matchesSearch = event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        event.lieu?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'tous' || event.statut === statusFilter
    const matchesType = typeFilter === 'tous' || event.type_evenement_id === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const filteredAteliers = ateliers.filter(atelier => {
    const matchesSearch = atelier.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        atelier.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        atelier.lieu?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'tous' || atelier.statut === statusFilter
    const matchesType = typeFilter === 'tous' || typeFilter === 'atelier'
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Obtenir les éléments à afficher selon l'onglet actif
  const getDisplayItems = () => {
    if (activeTab === 'evenements') {
      return filteredEvenements.sort((a, b) => 
        new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()
      )
    } else {
      return filteredAteliers.sort((a, b) => 
        new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()
      )
    }
  }

  const displayItems = getDisplayItems()

  // Charger au démarrage
  useEffect(() => {
    loadEvenements()
  }, [])

  // Effet pour fermer automatiquement le générateur quand le contenu est généré
  useEffect(() => {
    if (generatedContent) {
      console.log('🔒 Fermeture automatique du générateur')
      setShowAIGenerator(false)
    }
  }, [generatedContent])

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Messages */}
      {message && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-md flex items-center z-50 ${
          message.type === 'error' 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          <CheckCircle className="w-4 h-4 mr-2" />
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Gestion des Événements
            </h1>
            <p className="text-gray-600 mt-2">
              Organisez et gérez vos événements et ateliers d'insertion professionnelle
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedEvent(null)
                setShowForm(true)
              }}
              className={`${
                activeTab === 'evenements' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-lg`}
            >
              <Plus className="w-5 h-5" />
              {activeTab === 'evenements' ? 'Nouvel Événement' : 'Nouvel Atelier'}
            </button>
            {(showAIGenerator || generatedContent || showEventDetail || showAtelierDetail) && (
              <button
                onClick={resetModalStates}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                title="Fermer tous les modals"
              >
                <XCircle className="w-4 h-4" />
                Fermer tout
              </button>
            )}
          </div>
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('evenements')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'evenements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Événements
            </button>
            <button
              onClick={() => setActiveTab('ateliers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'ateliers'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Ateliers
            </button>
          </nav>
        </div>
      </div>

      {/* Statistiques */}
      {activeTab === 'evenements' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{evenements.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Planifiés</p>
                <p className="text-3xl font-bold text-blue-600">{getStatusCount('planifie')}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-yellow-600">{getStatusCount('en_cours')}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminés</p>
                <p className="text-3xl font-bold text-green-600">{getStatusCount('termine')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{ateliers.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Planifiés</p>
                <p className="text-3xl font-bold text-blue-600">{ateliers.filter(a => a.statut === 'planifie').length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-yellow-600">{ateliers.filter(a => a.statut === 'en_cours').length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminés</p>
                <p className="text-3xl font-bold text-green-600">{ateliers.filter(a => a.statut === 'termine').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par titre, lieu, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Filtre statut */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="tous">Tous les statuts</option>
              <option value="planifie">Planifiés</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminés</option>
              <option value="annule">Annulés</option>
            </select>
          </div>

          {/* Filtre type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="tous">Tous les types</option>
              {activeTab === 'evenements' ? (
                eventTypes.filter(t => t.actif && t.nom !== 'Atelier').map(type => (
                  <option key={type.id} value={type.id}>
                    {type.nom}
                  </option>
                ))
              ) : (
                <option value="atelier">Atelier</option>
              )}
            </select>
          </div>
        </div>

        {/* Mode d'affichage */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Affichage :</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {displayItems.length} {activeTab === 'evenements' ? 'événement(s)' : 'atelier(s)'} trouvé(s)
          </div>
        </div>
      </div>

      {/* Liste des éléments selon l'onglet actif */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            {activeTab === 'evenements' ? (
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            ) : (
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun {activeTab === 'evenements' ? 'événement' : 'atelier'} trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'evenements' 
                ? (evenements.length === 0 ? 'Créez votre premier événement pour commencer' : 'Ajustez vos filtres pour voir plus de résultats')
                : (ateliers.length === 0 ? 'Créez votre premier atelier pour commencer' : 'Ajustez vos filtres pour voir plus de résultats')
              }
            </p>
            {((activeTab === 'evenements' && evenements.length === 0) || (activeTab === 'ateliers' && ateliers.length === 0)) && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer un {activeTab === 'evenements' ? 'événement' : 'atelier'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {activeTab === 'evenements' ? (
            // Affichage des événements
            displayItems.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                onView={handleViewEvent}
                onGenerateContent={handleGenerateContent}
              />
            ))
          ) : (
            // Affichage des ateliers
            displayItems.map(atelier => (
              <div key={atelier.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header de la carte */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {atelier.titre}
                        </h3>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAtelierStatusColor(atelier.statut)}`}>
                        {getAtelierStatusLabel(atelier.statut)}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewAtelier(atelier)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAtelier(atelier.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                      <span>{atelier.capacite_actuelle || 0}/{atelier.capacite_max} participants</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Formulaire modal */}
      {showForm && (
        <NewEventForm
          onSave={handleSaveEvent}
          onCancel={() => {
            setShowForm(false)
            setSelectedEvent(null)
          }}
          initialData={selectedEvent}
        />
      )}

      {/* Modal Générateur IA */}
      {showAIGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  Générateur de contenu IA
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAIGenerator(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Fermer le générateur"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <AIContentGenerator
                eventId={selectedEvent?.id || ''}
                eventTitle={selectedEvent?.titre || 'Nouvel événement'}
                eventData={selectedEvent}
                onContentGenerated={handleContentGenerated}
              />
            </div>
          </div>
        </div>
      )}

      {/* Affichage du contenu généré */}
      {generatedContent && (
        <>
          {console.log('📄 Affichage du modal de contenu généré')}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Contenu généré par IA
                </h2>
                <button
                  onClick={() => {
                    closeGeneratedContent()
                    setShowAIGenerator(false) // Fermer aussi le générateur
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                {generatedContent}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent);
                    showMessage('Contenu copié dans le presse-papiers !');
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Copier
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Contenu généré - ${selectedEvent?.titre || 'Événement'}</title>
                            <style>
                              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
                              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                              .content { white-space: pre-wrap; }
                              @media print { body { margin: 0; } }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <h1>Contenu généré par IA</h1>
                              <p><strong>Événement:</strong> ${selectedEvent?.titre || 'N/A'}</p>
                              <p><strong>Date de génération:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                            </div>
                            <div class="content">${generatedContent}</div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Imprimer
                </button>
                <button
                  onClick={() => {
                    setGeneratedContent('')
                    setShowAIGenerator(false) // Fermer aussi le générateur
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Modal de détails d'événement */}
      {showEventDetail && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Détails de l'événement
                </h2>
                <button
                  onClick={() => setShowEventDetail(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Onglets */}
              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setEventDetailTab('details')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      eventDetailTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Détails
                  </button>
                  <button
                    onClick={() => setEventDetailTab('rapports')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      eventDetailTab === 'rapports'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Rapports
                  </button>
                </div>
              </div>

              {/* Contenu des onglets */}
              {eventDetailTab === 'details' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Informations principales */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations générales</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                          <p className="text-gray-900 font-medium">{selectedEvent.titre}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type d'événement</label>
                          <p className="text-gray-900">{selectedEvent.event_types?.nom || 'Non spécifié'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            selectedEvent.statut === 'planifie' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            selectedEvent.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            selectedEvent.statut === 'termine' ? 'bg-green-100 text-green-800 border-green-200' :
                            selectedEvent.statut === 'annule' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {selectedEvent.statut === 'planifie' ? 'Planifié' :
                             selectedEvent.statut === 'en_cours' ? 'En cours' :
                             selectedEvent.statut === 'termine' ? 'Terminé' :
                             selectedEvent.statut === 'annule' ? 'Annulé' :
                             selectedEvent.statut}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                          <p className="text-gray-900">{selectedEvent.lieu}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                          <p className="text-gray-900">{selectedEvent.responsable_cop || 'Non spécifié'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Dates et horaires</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Début :</span>
                          <span className="text-sm font-medium">{new Date(selectedEvent.date_debut).toLocaleString('fr-FR')}</span>
                        </div>
                        {selectedEvent.date_fin && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Fin :</span>
                            <span className="text-sm font-medium">{new Date(selectedEvent.date_fin).toLocaleString('fr-FR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description et photos */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                    </div>

                    {selectedEvent.photos_urls && selectedEvent.photos_urls.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Photos ({selectedEvent.photos_urls.length})</h3>
                        {console.log('📸 Photos URLs:', selectedEvent.photos_urls)}
                        <div className="grid grid-cols-2 gap-2">
                          {selectedEvent.photos_urls.map((photo: string, index: number) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo}
                                alt={`Photo ${index + 1} - ${selectedEvent.titre}`}
                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(photo, '_blank')}
                                onError={(e) => {
                                  console.error('❌ Erreur chargement image:', photo)
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAxMDBDNjAgODguOTU0MyA2OC45NTQzIDgwIDgwIDgwQzgxLjA5MDkgODAgODIuMTY2NyA4MC4wMzQ3IDgzLjIyNzMgODAuMTAyN0M4NC4yODc5IDgwLjE3MDcgODUuMzI5MiA4MC4yNzE3IDg2LjM0NzcgODAuNDA0N0M4Ny4zNjYyIDgwLjUzNzcgODguMzU5NyA4MC43MDI3IDg5LjMyNTcgODAuODk5N0M5MC4yOTE3IDgxLjA5NjcgOTEuMjI4NyA4MS4zMjU3IDkyLjEzNTcgODEuNTg2N0M5My4wNDI3IDgxLjg0NzcgOTMuOTIwNyA4Mi4xNDA3IDk0Ljc2NTcgODIuNDY1N0M5NS42MTA3IDgyLjc5MDcgOTYuNDIxNyA4My4xNDc3IDk3LjE5NzcgODMuNTM2N0M5Ny45NzM3IDgzLjkyNTcgOTguNzEzNyA4NC4zNDY3IDk5LjQxNTcgODQuNzk5N0MxMDAuMTE3NyA4NS4yNTI3IDEwMC43ODU3IDg1LjczNzcgMTAxLjQxOTcgODYuMjU0N0MxMDIuMDUzNyA4Ni43NzE3IDEwMi42NTM3IDg3LjMyMDcgMTAzLjIxOTcgODcuODk5N0MxMDMuNzg1NyA4OC40Nzg3IDEwNC4zMTc3IDg5LjA4ODcgMTA0LjgxNTcgODkuNzI5N0MxMDUuMzEzNyA5MC4zNzA3IDEwNS43Nzc3IDkxLjA0MjcgMTA2LjIwNTcgOTEuNzM1N0MxMDYuNjMzNyA5Mi40Mjg3IDEwNy4wMjU3IDkzLjE0MTcgMTA3LjM4MTcgOTMuODc0N0MxMDcuNzM3NyA5NC42MDc3IDEwOC4wNTc3IDk1LjM2MDcgMTA4LjM0MTcgOTYuMTMzN0MxMDguNjI1NyA5Ni45MDY3IDEwOC44NzM3IDk3LjY5OTcgMTA5LjA4NTcgOTguNTAyN0MxMDkuMjk3NyA5OS4zMDU3IDEwOS40NzM3IDEwMC4xMjg3IDEwOS42MTM3IDEwMC45NzE3QzEwOS43NTM3IDEwMS44MTQ3IDEwOS44NTc3IDEwMi42Njc3IDEwOS45MjU3IDEwMy41MzA3QzEwOS45OTM3IDEwNC4zOTM3IDExMC4wMjU3IDEwNS4yNjY3IDExMC4wMjE3IDEwNi4xNDk3QzExMC4wMTc3IDEwNy4wMzI3IDEwOS45Nzc3IDEwNy45MTU3IDEwOS45MDE3IDEwOC43ODg3QzEwOS44MjU3IDEwOS42NjE3IDEwOS43MTM3IDExMC41MjQ3IDEwOS41NjU3IDExMS4zNjc3QzEwOS40MTc3IDExMi4yMTA3IDEwOS4yMzM3IDExMy4wNDM3IDEwOS4wMTM3IDExMy44NTY3QzEwOC43OTM3IDExNC42Njk3IDEwOC41Mzc3IDExNS40NjI3IDEwOC4yNDU3IDExNi4yMzU3QzEwNy45NTM3IDExNy4wMDg3IDEwNy42MjU3IDExNy43NjE3IDEwNy4yNjE3IDExOC40OTQ3QzEwNi44OTc3IDExOS4yMjc3IDEwNi40OTc3IDExOS45NDA3IDEwNi4wNjE3IDEyMC42MzM3QzEwNS42MjU3IDEyMS4zMjY3IDEwNS4xNjM3IDEyMS45OTk3IDEwNC42NzU3IDEyMi42NTI3QzEwNC4xODc3IDEyMy4zMDU3IDEwMy42NzM3IDEyMy45Mzg3IDEwMy4xMzM3IDEyNC41NTE3QzEwMi41OTM3IDEyNS4xNjQ3IDEwMi4wMjc3IDEyNS43NTc3IDEwMS40MzU3IDEyNi4zMzA3QzEwMC44NDM3IDEyNi45MDM3IDEwMC4yMjU3IDEyNy40NTY3IDk5LjU4MTcgMTI3Ljk4OTdDOTguOTM3NyAxMjguNTIyNyA5OC4yNjc3IDEyOS4wMzQ3IDk3LjU3MTcgMTI5LjUyNjdDOTYuODc1NyAxMzAuMDE4NyA5Ni4xNTM3IDEzMC40OTA3IDk1LjQwNTcgMTMwLjk0MjdDOTQuNjU3NyAxMzEuMzk0NyA5My44ODM3IDEzMS44MjU3IDkzLjA4MzcgMTMyLjIzNTdDOTIuMjgzNyAxMzIuNjQ1NyA5MS40NTc3IDEzMy4wMzU3IDkwLjYwNTcgMTMzLjQwNTdDODkuNzUzNyAxMzMuNzc1NyA4OC44NzU3IDEzNC4xMjU3IDg3Ljk3MTcgMTM0LjQ1NTdDODcuMDY3NyAxMzQuNzg1NyA4Ni4xMzc3IDEzNS4wOTU3IDg1LjE4MTcgMTM1LjM4NTdDODQuMjI1NyAxMzUuNjc1NyA4My4yNDM3IDEzNS45NDU3IDgyLjIzNTcgMTM2LjE5NTdDODEuMjI3NyAxMzYuNDQ1NyA4MC4xOTM3IDEzNi42NzU3IDc5LjEzMzcgMTM2Ljg4NTdDNzguMDczNyAxMzcuMDk1NyA3Ni45ODc3IDEzNy4yODU3IDc1Ljg3NTcgMTM3LjQ1NTdDNzQuNzYzNyAxMzcuNjI1NyA3My42MjU3IDEzNy43NzU3IDcyLjQ2MTcgMTM3LjkwNTdDNzEuMjk3NyAxMzguMDM1NyA3MC4xMDc3IDEzOC4xNDU3IDY4Ljg5MTcgMTM4LjIzNTdDNjcuNjc1NyAxMzguMzI1NyA2Ni40MzM3IDEzOC4zOTU3IDY1LjE2NTcgMTM4LjQ0NTdDNjMuODk3NyAxMzguNDk1NyA2Mi42MDc3IDEzOC41MjU3IDYxLjI5NTcgMTM4LjUzNTdDNjAuNTM5NyAxMzguNTQwNyA1OS43ODM3IDEzOC41NDA3IDU5LjAyNzcgMTM4LjUzNTdDNTguMjcxNyAxMzguNTMwNyA1Ny41MTU3IDEzOC41MjA3IDU2Ljc1OTcgMTM4LjUwNTdDNTYuMDAzNyAxMzguNDkwNyA1NS4yNDc3IDEzOC40NzA3IDU0LjQ5MTcgMTM4LjQ0NTdDNTMuNzM1NyAxMzguNDIwNyA1Mi45Nzk3IDEzOC4zOTA3IDUyLjIyMzcgMTM4LjM1NTdDNTEuNDY3NyAxMzguMzIwNyA1MC43MTE3IDEzOC4yODA3IDQ5Ljk1NTcgMTM4LjIzNTdDNDkuMTk5NyAxMzguMTkwNyA0OC40NDM3IDEzOC4xNDA3IDQ3LjY4NzcgMTM4LjA4NTdDNDYuOTMxNyAxMzguMDMwNyA0Ni4xNzU3IDEzNy45NzA3IDQ1LjQxOTcgMTM3LjkwNTdDNDQuNjYzNyAxMzcuODQwNyA0My45MDc3IDEzNy43NzA3IDQzLjE1MTcgMTM3LjY5NTdDNDIuMzk1NyAxMzcuNjIwNyA0MS42Mzk3IDEzNy41NDA3IDQwLjg4MzcgMTM3LjQ1NTdDNDAuMTI3NyAxMzcuMzcwNyAzOS4zNzE3IDEzNy4yODA3IDM4LjYxNTcgMTM3LjE4NTdDMzcuODU5NyAxMzcuMDkwNyAzNy4xMDM3IDEzNi45OTA3IDM2LjM0NzcgMTM2Ljg4NTdDMzUuNTkxNyAxMzYuNzgwNyAzNC44MzU3IDEzNi42NzA3IDM0LjA3OTcgMTM2LjU1NTdDMzMuMzIzNyAxMzYuNDQwNyAzMi41Njc3IDEzNi4zMjA3IDMxLjgxMTcgMTM2LjE5NTdDMzEuMDU1NyAxMzYuMDcwNyAzMC4yOTk3IDEzNS45NDA3IDI5LjU0MzcgMTM1LjgwNTdDMjguNzg3NyAxMzUuNjcwNyAyOC4wMzE3IDEzNS41MzA3IDI3LjI3NTcgMTM1LjM4NTdDMjYuNTE5NyAxMzUuMjQwNyAyNS43NjM3IDEzNS4wOTA3IDI1LjAwNzcgMTM0LjkzNTdDMjQuMjUxNyAxMzQuNzgwNyAyMy40OTU3IDEzNC42MjA3IDIyLjczOTcgMTM0LjQ1NTdDMjEuOTgzNyAxMzQuMjkwNyAyMS4yMjc3IDEzNC4xMjA3IDIwLjQ3MTcgMTMzLjk0NTdDMTkuNzE1NyAxMzMuNzcwNyAxOC45NTk3IDEzMy41OTA3IDE4LjIwMzcgMTMzLjQwNTdDMTcuNDQ3NyAxMzMuMjIwNyAxNi42OTE3IDEzMy4wMzA3IDE1LjkzNTcgMTMyLjgzNTdDMTUuMTc5NyAxMzIuNjQwNyAxNC40MjM3IDEzMi40NDA3IDEzLjY2NzcgMTMyLjIzNTdDMTIuOTExNyAxMzIuMDMwNyAxMi4xNTU3IDEzMS44MjA3IDExLjM5OTcgMTMxLjYwNTdDMTAuNjQzNyAxMzEuMzkwNyA5Ljg4NzcgMTMxLjE3MDcgOS4xMzE3IDEzMC45NDU3QzguMzc1NyAxMzAuNzIwNyA3LjYxOTcgMTMwLjQ5MDcgNi44NjM3IDEzMC4yNTU3QzYuMTA3NyAxMzAuMDIwNyA1LjM1MTcgMTI5Ljc4MDcgNC41OTU3IDEyOS41MzU3QzMuODM5NyAxMjkuMjkwNyAzLjA4MzcgMTI5LjA0MDcgMi4zMjc3IDEyOC43ODU3QzEuNTcxNyAxMjguNTMwNyAwLjgxNTcgMTI4LjI3MDcgMC4wNTk3IDEyOC4wMDU3QzAuMDM5NyAxMjcuOTk1NyAwLjAxOTcgMTI3Ljk4NTcgMCAxMjcuOTc1N1YxMDBDMCA4OC45NTQzIDguOTU0MyA4MCAyMCA4MEgxNDBDMTUxLjA0NiA4MCAxNjAgODguOTU0MyAxNjAgMTAwVjEyOEMxNjAgMTM5LjA0NiAxNTEuMDQ2IDE0OCAxNDAgMTQ4SDIwQzguOTU0MyAxNDggMCAxMzkuMDQ2IDAgMTI4VjEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTYwIDEwMEM2MCA4OC45NTQzIDY4Ljk1NDMgODAgODAgODBDODEuMDkwOSA4MCA4Mi4xNjY3IDgwLjAzNDcgODMuMjI3MyA4MC4xMDI3Qzg0LjI4NzkgODAuMTcwNyA4NS4zMjkyIDgwLjI3MTcgODYuMzQ3NyA4MC40MDQ3Qzg3LjM2NjIgODAuNTM3NyA4OC4zNTk3IDgwLjcwMjcgODkuMzI1NyA4MC44OTk3QzkwLjI5MTcgODEuMDk2NyA5MS4yMjg3IDgxLjMyNTcgOTIuMTM1NyA4MS41ODY3QzkzLjA0MjcgODEuODQ3NyA5My45MjA3IDgyLjE0MDcgOTQuNzY1NyA4Mi40NjU3Qzk1LjYxMDcgODIuNzkwNyA5Ni40MjE3IDgzLjE0NzcgOTcuMTk3NyA4My41MzY3Qzk3Ljk3MzcgODMuOTI1NyA5OC43MTM3IDg0LjM0NjcgOTkuNDE1NyA4NC43OTk3QzEwMC4xMTc3IDg1LjI1MjcgMTAwLjc4NTcgODUuNzM3NyAxMDEuNDE5NyA4Ni4yNTQ3QzEwMi4wNTM3IDg2Ljc3MTcgMTAyLjY1MzcgODcuMzIwNyAxMDMuMjE5NyA4Ny44OTk3QzEwMy43ODU3IDg4LjQ3ODcgMTA0LjMxNzcgODkuMDg4NyAxMDQuODE1NyA4OS43Mjk3QzEwNS4zMTM3IDkwLjM3MDcgMTA1Ljc3NzcgOTEuMDQyNyAxMDYuMjA1NyA5MS43MzU3QzEwNi42MzM3IDkyLjQyODcgMTA3LjAyNTcgOTMuMTQxNyAxMDcuMzgxNyA5My44NzQ3QzEwNy43Mzc3IDk0LjYwNzcgMTA4LjA1NzcgOTUuMzYwNyAxMDguMzQxNyA5Ni4xMzM3QzEwOC42MjU3IDk2LjkwNjcgMTA4Ljg3MzcgOTcuNjk5NyAxMDkuMDg1NyA5OC41MDI3QzEwOS4yOTc3IDk5LjMwNTcgMTA5LjQ3MzcgMTAwLjEyODcgMTA5LjYxMzcgMTAwLjk3MTdDMTA5Ljc1MzcgMTAxLjgxNDcgMTA5Ljg1NzcgMTAyLjY2NzcgMTA5LjkyNTcgMTAzLjUzMDdDMTA5Ljk5MzcgMTA0LjM5MzcgMTEwLjAyNTcgMTA1LjI2NjcgMTEwLjAyMTcgMTA2LjE0OTdDMTEwLjAxNzcgMTA3LjAzMjcgMTA5Ljk3NzcgMTA3LjkxNTcgMTA5LjkwMTcgMTA4Ljc4ODdDMTA5LjgyNTcgMTA5LjY2MTcgMTA5LjcxMzcgMTEwLjUyNDcgMTA5LjU2NTcgMTExLjM2NzdDMTA5LjQxNzcgMTEyLjIxMDcgMTA5LjIzMzcgMTEzLjA0MzcgMTA5LjAxMzcgMTEzLjg1NjdDMTA4Ljc5MzcgMTE0LjY2OTcgMTA4LjUzNzcgMTE1LjQ2MjcgMTA4LjI0NTcgMTE2LjIzNTdDMTA3Ljk1MzcgMTE3LjAwODcgMTA3LjYyNTcgMTE3Ljc2MTcgMTA3LjI2MTcgMTE4LjQ5NDdDMTA2Ljg5NzcgMTE5LjIyNzcgMTA2LjQ5NzcgMTE5Ljk0MDcgMTA2LjA2MTcgMTIwLjYzMzdDMTA1LjYyNTcgMTIxLjMyNjcgMTA1LjE2MzcgMTIxLjk5OTcgMTA0LjY3NTcgMTIyLjY1MjdDMTA0LjE4NzcgMTIzLjMwNTcgMTAzLjY3MzcgMTIzLjkzODcgMTAzLjEzMzcgMTI0LjU1MTdDMTAyLjU5MzcgMTI1LjE2NDcgMTAyLjAyNzcgMTI1Ljc1NzcgMTAxLjQzNTcgMTI2LjMzMDdDMTAwLjg0MzcgMTI2LjkwMzcgMTAwLjIyNTcgMTI3LjQ1NjcgOTkuNTgxNyAxMjcuOTg5N0M5OC45Mzc3IDEyOC41MjI3IDk4LjI2NzcgMTI5LjAzNDcgOTcuNTcxNyAxMjkuNTI2N0M5Ni44NzU3IDEzMC4wMTg3IDk2LjE1MzcgMTMwLjQ5MDcgOTUuNDA1NyAxMzAuOTQyN0M5NC42NTc3IDEzMS4zOTQ3IDkzLjg4MzcgMTMxLjgyNTcgOTMuMDgzNyAxMzIuMjM1N0M5Mi4yODM3IDEzMi42NDU3IDkxLjQ1NzcgMTMzLjAzNTcgOTAuNjA1NyAxMzMuNDA1N0M4OS43NTM3IDEzMy43NzU3IDg4Ljg3NTcgMTM0LjEyNTcgODcuOTcxNyAxMzQuNDU1N0M4Ny4wNjc3IDEzNC43ODU3IDg2LjEzNzcgMTM1LjA5NTcgODUuMTgxNyAxMzUuMzg1N0M4NC4yMjU3IDEzNS42NzU3IDgzLjI0MzcgMTM1Ljk0NTcgODIuMjM1NyAxMzYuMTk1N0M4MS4yMjc3IDEzNi40NDU3IDgwLjE5MzcgMTM2LjY3NTcgNzkuMTMzNyAxMzYuODg1N0M3OC4wNzM3IDEzNy4wOTU3IDc2Ljk4NzcgMTM3LjI4NTcgNzUuODc1NyAxMzcuNDU1N0M3NC43NjM3IDEzNy42MjU3IDczLjYyNTcgMTM3Ljc3NTcgNzIuNDYxNyAxMzcuOTA1N0M3MS4yOTc3IDEzOC4wMzU3IDcwLjEwNzcgMTM4LjE0NTcgNjguODkxNyAxMzguMjM1N0M2Ny42NzU3IDEzOC4zMjU3IDY2LjQzMzcgMTM4LjM5NTcgNjUuMTY1NyAxMzguNDQ1N0M2My44OTc3IDEzOC40OTU3IDYyLjYwNzcgMTM4LjUyNTcgNjEuMjk1NyAxMzguNTM1N0M2MC41Mzk3IDEzOC41NDA3IDU5Ljc4MzcgMTM4LjU0MDcgNTkuMDI3NyAxMzguNTMwN0M1OC4yNzE3IDEzOC41MzA3IDU3LjUxNTcgMTM4LjUyMDcgNTYuNzU5NyAxMzguNTA1N0M1Ni4wMDM3IDEzOC40OTA3IDU1LjI0NzcgMTM4LjQ3MDcgNTQuNDkxNyAxMzguNDQ1N0M1My43MzU3IDEzOC40MjA3IDUyLjk3OTcgMTM4LjM5MDcgNTEuNDY3NyAxMzguMzIwNyA1MC43MTE3IDEzOC4yODA3IDQ5Ljk1NTcgMTM4LjIzNTdDNDkuMTk5NyAxMzguMTkwNyA0OC40NDM3IDEzOC4xNDA3IDQ3LjY4NzcgMTM4LjA4NTdDNDYuOTMxNyAxMzguMDMwNyA0Ni4xNzU3IDEzNy45NzA3IDQ1LjQxOTcgMTM3LjkwNTdDNDQuNjYzNyAxMzcuODQwNyA0My45MDc3IDEzNy43NzA3IDQzLjE1MTcgMTM3LjY5NTdDNDIuMzk1NyAxMzcuNjIwNyA0MS42Mzk3IDEzNy41NDA3IDQwLjg4MzcgMTM3LjQ1NTdDNDAuMTI3NyAxMzcuMzcwNyAzOS4zNzE3IDEzNy4yODA3IDM4LjYxNTcgMTM3LjE4NTdDMzcuODU5NyAxMzcuMDkwNyAzNy4xMDM3IDEzNi45OTA3IDM2LjM0NzcgMTM2Ljg4NTdDMzUuNTkxNyAxMzYuNzgwNyAzNC44MzU3IDEzNi42NzA3IDM0LjA3OTcgMTM2LjU1NTdDMzMuMzIzNyAxMzYuNDQwNyAzMi41Njc3IDEzNi4zMjA3IDMxLjgxMTcgMTM2LjE5NTdDMzEuMDU1NyAxMzYuMDcwNyAzMC4yOTk3IDEzNS45NDA3IDI5LjU0MzcgMTM1LjgwNTdDMjguNzg3NyAxMzUuNjcwNyAyOC4wMzE3IDEzNS41MzA3IDI3LjI3NTcgMTM1LjM4NTdDMjYuNTE5NyAxMzUuMjQwNyAyNS43NjM3IDEzNS4wOTA3IDI1LjAwNzcgMTM0LjkzNTdDMjQuMjUxNyAxMzQuNzgwNyAyMy40OTU3IDEzNC42MjA3IDIyLjczOTcgMTM0LjQ1NTdDMjEuOTgzNyAxMzQuMjkwNyAyMS4yMjc3IDEzNC4xMjA3IDIwLjQ3MTcgMTMzLjk0NTdDMTkuNzE1NyAxMzMuNzcwNyAxOC45NTk3IDEzMy41OTA3IDE4LjIwMzcgMTMzLjQwNTdDMTcuNDQ3NyAxMzMuMjIwNyAxNi42OTE3IDEzMy4wMzA3IDE1LjkzNTcgMTMyLjgzNTdDMTUuMTc5NyAxMzIuNjQwNyAxNC40MjM3IDEzMi40NDA3IDEzLjY2NzcgMTMyLjIzNTdDMTIuOTExNyAxMzIuMDMwNyAxMi4xNTU3IDEzMS44MjA3IDExLjM5OTcgMTMxLjYwNTdDMTAuNjQzNyAxMzEuMzkwNyA5Ljg4NzcgMTMxLjE3MDcgOS4xMzE3IDEzMC45NDU3QzguMzc1NyAxMzAuNzIwNyA3LjYxOTcgMTMwLjQ5MDcgNi44NjM3IDEzMC4yNTU3QzYuMTA3NyAxMzAuMDIwNyA1LjM1MTcgMTI5Ljc4MDcgNC41OTU3IDEyOS41MzU3QzMuODM5NyAxMjkuMjkwNyAzLjA4MzcgMTI5LjA0MDcgMi4zMjc3IDEyOC43ODU3QzEuNTcxNyAxMjguNTMwNyAwLjgxNTcgMTI4LjI3MDcgMC4wNTk3IDEyOC4wMDU3QzAuMDM5NyAxMjcuOTk1NyAwLjAxOTcgMTI3Ljk4NTcgMCAxMjcuOTc1N1YxMDBDMCA4OC45NTQzIDguOTU0MyA4MCAyMCA4MEgxNDBDMTUxLjA0NiA4MCAxNjAgODguOTU0MyAxNjAgMTAwVjEyOEMxNjAgMTM5LjA0NiAxNTEuMDQ2IDE0OCAxNDAgMTQ4SDIwQzguOTU0MyAxNDggMCAxMzkuMDQ2IDAgMTI4VjEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                                  Cliquer pour agrandir
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <RapportsList 
                  evenementId={selectedEvent.id} 
                  evenementTitre={selectedEvent.titre} 
                />
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowEventDetail(false)
                    handleGenerateContent(selectedEvent)
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Générer contenu IA
                </button>
                <button
                  onClick={() => {
                    setShowEventDetail(false)
                    handleEditEvent(selectedEvent)
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  onClick={() => setShowEventDetail(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails d'atelier */}
      {showAtelierDetail && selectedAtelier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">{selectedAtelier.titre}</h2>
                </div>
                <button
                  onClick={() => setShowAtelierDetail(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations principales */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations générales</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                        <p className="text-gray-900 font-medium">{selectedAtelier.titre}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getAtelierStatusColor(selectedAtelier.statut)}`}>
                          {getAtelierStatusLabel(selectedAtelier.statut)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                        <p className="text-gray-900">{selectedAtelier.lieu || 'Non spécifié'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
                        <p className="text-gray-900">
                          {selectedAtelier.capacite_actuelle || 0} / {selectedAtelier.capacite_max} participants
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Dates et horaires</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Début :</span>
                        <span className="text-sm font-medium">{formatDate(selectedAtelier.date_debut)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Fin :</span>
                        <span className="text-sm font-medium">{formatDate(selectedAtelier.date_fin)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Durée :</span>
                        <span className="text-sm font-medium">{getDuration(selectedAtelier.date_debut, selectedAtelier.date_fin)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedAtelier.description || 'Aucune description disponible'}
                    </p>
                  </div>

                  {selectedAtelier.pole && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Pôle</h3>
                      <p className="text-gray-700">{selectedAtelier.pole}</p>
                    </div>
                  )}

                  {selectedAtelier.filliere && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Filière</h3>
                      <p className="text-gray-700">{selectedAtelier.filliere}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {/* TODO: Edit atelier */}}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => setShowAtelierDetail(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 