'use client'

import React, { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, Plus, Search, Filter, Grid, List, 
  Clock, CheckCircle, AlertTriangle, XCircle,
  TrendingUp, Users, MapPin, FileText, Zap, Edit3
} from 'lucide-react'
import { NewEventForm } from './NewEventForm'
import { EventCard } from './EventCard'
import AIContentGenerator from './AIContentGenerator'
import { RapportsList } from './RapportsList'

export const ModernEvenementsModule = () => {
  const { eventTypes } = useSettings()
  const [showForm, setShowForm] = useState(false)
  const [evenements, setEvenements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [typeFilter, setTypeFilter] = useState('tous')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [showEventDetail, setShowEventDetail] = useState(false)
  const [eventDetailTab, setEventDetailTab] = useState<'details' | 'rapports'>('details')

  // Charger les événements
  const loadEvenements = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('evenements')
        .select(`
          *,
          event_types(nom, couleur)
        `)
        .order('date_debut', { ascending: false })

      if (error) throw error
      setEvenements(data || [])
    } catch (err: any) {
      console.error('Erreur chargement:', err)
      showMessage('Erreur lors du chargement des événements', 'error')
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
    // Ouvrir le modal de détails
    setShowEventDetail(true)
  }

  // Gérer la génération de contenu IA
  const handleContentGenerated = (content: string) => {
    setGeneratedContent(content)
    showMessage('Contenu généré avec succès !')
    setShowAIGenerator(false)
    // Le modal de contenu généré s'affichera automatiquement grâce à la condition {generatedContent && ...}
  }

  // Fermer le modal de contenu généré
  const closeGeneratedContent = () => {
    setGeneratedContent('')
  }

  // Réinitialiser tous les états des modals (en cas de problème)
  const resetModalStates = () => {
    setShowAIGenerator(false)
    setGeneratedContent('')
    setShowEventDetail(false)
    setSelectedEvent(null)
  }

  // Ouvrir le générateur IA pour un événement spécifique
  const handleGenerateContent = (event: any) => {
    setSelectedEvent(event)
    setShowAIGenerator(true)
  }

  // Filtrer les événements
  const filteredEvenements = evenements.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.lieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'tous' || event.statut === statusFilter
    const matchesType = typeFilter === 'tous' || event.type_evenement_id === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Statistiques
  const getStatusCount = (status: string) => 
    evenements.filter(e => e.statut === status).length

  const getTypeCount = (typeId: string) => 
    evenements.filter(e => e.type_evenement_id === typeId).length

  // Charger au démarrage
  useEffect(() => {
    loadEvenements()
  }, [])

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            Gestion des Événements
          </h1>
          <p className="text-gray-600 mt-2">
            Organisez et gérez vos événements d'insertion professionnelle
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedEvent(null)
              setShowForm(true)
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nouvel Événement
          </button>
          {(showAIGenerator || generatedContent || showEventDetail) && (
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

      {/* Statistiques */}
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
              {eventTypes.filter(t => t.actif).map(type => (
                <option key={type.id} value={type.id}>
                  {type.nom}
                </option>
              ))}
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
            {filteredEvenements.length} événement(s) trouvé(s)
          </div>
        </div>
      </div>

      {/* Liste des événements */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des événements...</p>
          </div>
        </div>
      ) : filteredEvenements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement trouvé</h3>
            <p className="text-gray-600 mb-6">
              {evenements.length === 0 
                ? 'Créez votre premier événement pour commencer'
                : 'Ajustez vos filtres pour voir plus de résultats'
              }
            </p>
            {evenements.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer un événement
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
          {filteredEvenements.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onView={handleViewEvent}
              onGenerateContent={handleGenerateContent}
            />
          ))}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Contenu généré par IA
                </h2>
                <button
                  onClick={closeGeneratedContent}
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
                  onClick={() => setGeneratedContent('')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
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
                        <div className="grid grid-cols-2 gap-2">
                          {selectedEvent.photos_urls.map((photo: string, index: number) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Photo ${index + 1} - ${selectedEvent.titre}`}
                              className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(photo, '_blank')}
                            />
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
    </div>
  )
} 