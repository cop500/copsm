'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
import { 
  Users, Calendar, MapPin, Clock, Eye, Trash2, Mail, Download,
  ChevronDown, ChevronRight, UserCheck, UserX, AlertCircle,
  CheckCircle, XCircle, Filter, Search, BarChart3, Loader2
} from 'lucide-react'

interface Inscription {
  id: string
  atelier_id: string
  stagiaire_nom: string
  stagiaire_email: string
  stagiaire_telephone?: string
  pole: string
  filliere: string
  date_inscription: string
  statut: 'confirme' | 'en_attente' | 'annule'
}

interface AtelierWithInscriptions {
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
  inscriptions: Inscription[]
}

export default function AtelierInscriptionsManager() {
  const { poles, filieres } = useSettings()
  const [ateliers, setAteliers] = useState<AtelierWithInscriptions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAtelier, setExpandedAtelier] = useState<string | null>(null)
  const [selectedInscription, setSelectedInscription] = useState<Inscription | null>(null)
  const [showInscriptionDetail, setShowInscriptionDetail] = useState(false)
  
  // Filtres
  const [filterPole, setFilterPole] = useState('')
  const [filterFiliere, setFilterFiliere] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Charger les ateliers avec leurs inscriptions
  const loadAteliersWithInscriptions = async () => {
    try {
      setLoading(true)
      
      // Charger les ateliers
      const { data: ateliersData, error: ateliersError } = await supabase
        .from('ateliers')
        .select('*')
        .order('date_debut', { ascending: false })

      if (ateliersError) throw ateliersError

      // Charger les inscriptions pour chaque atelier
      const ateliersWithInscriptions = await Promise.all(
        ateliersData.map(async (atelier) => {
          const { data: inscriptionsData, error: inscriptionsError } = await supabase
            .from('inscriptions_ateliers')
            .select('*')
            .eq('atelier_id', atelier.id)
            .order('date_inscription', { ascending: false })

          if (inscriptionsError) throw inscriptionsError

          return {
            ...atelier,
            inscriptions: inscriptionsData || []
          }
        })
      )

      setAteliers(ateliersWithInscriptions)
    } catch (err: any) {
      setError(err.message)
      console.error('Erreur chargement ateliers:', err)
    } finally {
      setLoading(false)
    }
  }

  // Désinscrire un participant
  const handleDesinscription = async (inscriptionId: string, atelierId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désinscrire ce participant ?')) {
      return
    }

    try {
      // Supprimer l'inscription
      const { error: deleteError } = await supabase
        .from('inscriptions_ateliers')
        .delete()
        .eq('id', inscriptionId)

      if (deleteError) throw deleteError

      // Mettre à jour la capacité actuelle de l'atelier
      const atelier = ateliers.find(a => a.id === atelierId)
      if (atelier) {
        const { error: updateError } = await supabase
          .from('ateliers')
          .update({ capacite_actuelle: atelier.capacite_actuelle - 1 })
          .eq('id', atelierId)

        if (updateError) throw updateError
      }

      // Recharger les données
      await loadAteliersWithInscriptions()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Exporter les inscriptions d'un atelier
  const handleExportInscriptions = (atelier: AtelierWithInscriptions) => {
    const csvContent = [
      ['Nom', 'Email', 'Pôle', 'Filière', 'Date d\'inscription', 'Statut'],
      ...atelier.inscriptions.map(inscription => [
        inscription.nom,
        inscription.email,
        inscription.pole,
        inscription.filliere,
        new Date(inscription.date_inscription).toLocaleDateString('fr-FR'),
        inscription.statut
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inscriptions_${atelier.titre.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Filtrer les ateliers
  const filteredAteliers = ateliers.filter(atelier => {
    const matchesSearch = atelier.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atelier.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPole = !filterPole || atelier.pole === filterPole
    const matchesFiliere = !filterFiliere || atelier.filliere === filterFiliere
    const matchesStatut = !filterStatut || atelier.statut === filterStatut

    return matchesSearch && matchesPole && matchesFiliere && matchesStatut
  })

  // Statistiques
  const stats = {
    totalAteliers: ateliers.length,
    totalInscriptions: ateliers.reduce((sum, atelier) => sum + atelier.inscriptions.length, 0),
    ateliersComplets: ateliers.filter(a => a.capacite_actuelle >= a.capacite_max).length,
    inscriptionsEnAttente: ateliers.reduce((sum, atelier) => 
      sum + atelier.inscriptions.filter(i => i.statut === 'en_attente').length, 0
    )
  }

  useEffect(() => {
    loadAteliersWithInscriptions()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement des inscriptions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">Erreur: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Gestion des inscriptions aux ateliers
          </h2>
          <button
            onClick={loadAteliersWithInscriptions}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <BarChart3 className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total Ateliers</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalAteliers}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Total Inscriptions</p>
                <p className="text-2xl font-bold text-green-700">{stats.totalInscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">En Attente</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.inscriptionsEnAttente}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-900">Ateliers Complets</p>
                <p className="text-2xl font-bold text-red-700">{stats.ateliersComplets}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un atelier..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pôle</label>
            <select
              value={filterPole}
              onChange={(e) => setFilterPole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les pôles</option>
              {poles.filter(p => p.actif).map(pole => (
                <option key={pole.id} value={pole.nom}>{pole.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
            <select
              value={filterFiliere}
              onChange={(e) => setFilterFiliere(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les filières</option>
              {filieres.filter(f => f.actif).map(filiere => (
                <option key={filiere.id} value={filiere.nom}>{filiere.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="planifie">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterPole('')
                setFilterFiliere('')
                setFilterStatut('')
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des ateliers */}
      <div className="space-y-4">
        {filteredAteliers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun atelier trouvé avec les filtres actuels</p>
          </div>
        ) : (
          filteredAteliers.map(atelier => (
            <div key={atelier.id} className="bg-white rounded-lg shadow-sm border">
              {/* En-tête de l'atelier */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedAtelier(expandedAtelier === atelier.id ? null : atelier.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {expandedAtelier === atelier.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    
                    <div>
                      <h3 className="font-medium text-gray-900">{atelier.titre}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(atelier.date_debut).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(atelier.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {atelier.lieu}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {atelier.inscriptions.length} / {atelier.capacite_max}
                      </p>
                      <p className="text-xs text-gray-500">inscriptions</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportInscriptions(atelier)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Exporter les inscriptions"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détail des inscriptions */}
              {expandedAtelier === atelier.id && (
                <div className="border-t border-gray-200 p-4">
                  {atelier.inscriptions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Aucune inscription pour cet atelier</p>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 mb-3">Liste des participants</h4>
                      
                      {atelier.inscriptions.map(inscription => (
                        <div key={inscription.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-6">
                            {/* Informations principales */}
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 text-lg">{inscription.stagiaire_nom}</p>
                              <p className="text-sm text-gray-600">{inscription.stagiaire_email}</p>
                              {inscription.stagiaire_telephone && (
                                <p className="text-xs text-gray-500">📞 {inscription.stagiaire_telephone}</p>
                              )}
                            </div>
                            
                            {/* Pôle et filière */}
                            <div className="text-sm text-gray-700 min-w-0">
                              <p className="font-medium">🎯 {inscription.pole}</p>
                              <p className="text-gray-600">{inscription.filliere}</p>
                            </div>
                            
                            {/* Date d'inscription */}
                            <div className="text-sm text-gray-600 min-w-0">
                              <p className="font-medium">📅 Inscrit le</p>
                              <p>{new Date(inscription.date_inscription).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Statut */}
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              inscription.statut === 'confirme' ? 'bg-green-100 text-green-800 border border-green-200' :
                              inscription.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {inscription.statut === 'confirme' ? '✅ Confirmée' :
                               inscription.statut === 'en_attente' ? '⏳ En attente' : '❌ Annulée'}
                            </span>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedInscription(inscription)
                                  setShowInscriptionDetail(true)
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDesinscription(inscription.id, atelier.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Désinscrire"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de détails d'inscription */}
      {showInscriptionDetail && selectedInscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Détails de l'inscription</h3>
                <button
                  onClick={() => {
                    setShowInscriptionDetail(false)
                    setSelectedInscription(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nom complet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedInscription.stagiaire_nom}</p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{selectedInscription.stagiaire_email}</p>
                </div>

                {/* Téléphone */}
                {selectedInscription.stagiaire_telephone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <p className="text-gray-900">{selectedInscription.stagiaire_telephone}</p>
                  </div>
                )}

                {/* Pôle et filière */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pôle</label>
                    <p className="text-gray-900">{selectedInscription.pole}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
                    <p className="text-gray-900">{selectedInscription.filliere}</p>
                  </div>
                </div>

                {/* Date d'inscription */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'inscription</label>
                  <p className="text-gray-900">
                    {new Date(selectedInscription.date_inscription).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedInscription.statut === 'confirme' ? 'bg-green-100 text-green-800 border border-green-200' :
                    selectedInscription.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                    'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {selectedInscription.statut === 'confirme' ? '✅ Confirmée' :
                     selectedInscription.statut === 'en_attente' ? '⏳ En attente' : '❌ Annulée'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowInscriptionDetail(false)
                    setSelectedInscription(null)
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
                
                <button
                  onClick={() => {
                    handleDesinscription(selectedInscription.id, selectedInscription.atelier_id)
                    setShowInscriptionDetail(false)
                    setSelectedInscription(null)
                  }}
                  className="flex-1 px-4 py-2 text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                >
                  Désinscrire
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 