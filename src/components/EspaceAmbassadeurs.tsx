'use client'

import React, { useState, useMemo } from 'react'
import { useActionsAmbassadeurs, ActionAmbassadeur } from '@/hooks/useActionsAmbassadeurs'
import { 
  Users, Calendar, MapPin, User, Building2, 
  Filter, Search, Download, Eye, Edit3, Trash2,
  TrendingUp, BarChart3, PieChart, Activity,
  Loader2, AlertCircle, CheckCircle, XCircle
} from 'lucide-react'

const volets = [
  { value: 'information_communication', label: 'Information/Communication', color: 'bg-blue-100 text-blue-800' },
  { value: 'accompagnement_projets', label: 'Accompagnement Projets', color: 'bg-green-100 text-green-800' },
  { value: 'assistance_carriere', label: 'Assistance Carrière', color: 'bg-purple-100 text-purple-800' },
  { value: 'assistance_filiere', label: 'Assistance Filière', color: 'bg-orange-100 text-orange-800' }
]

// Fonction pour obtenir le label du volet
const getVoletLabel = (volet: string) => {
  return volets.find(v => v.value === volet)?.label || volet;
}

export const EspaceAmbassadeurs: React.FC = () => {
  const { actions, loading, error, deleteAction } = useActionsAmbassadeurs()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('tous')
  const [showStats, setShowStats] = useState(true)
  const [selectedAction, setSelectedAction] = useState<ActionAmbassadeur | null>(null)
  const [showActionDetail, setShowActionDetail] = useState(false)

  const stats = useMemo(() => {
    const totalActions = actions.length
    const totalParticipants = actions.reduce((sum, action) => sum + action.nombre_participants, 0)
    
    const actionsByVolet = actions.reduce((acc, action) => {
      const volet = action.volet_action
      acc[volet] = (acc[volet] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const actionsByMonth = actions.reduce((acc, action) => {
      const month = new Date(action.date_action).toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const averageParticipants = totalActions > 0 ? Math.round(totalParticipants / totalActions) : 0

    return {
      totalActions,
      totalParticipants,
      averageParticipants,
      actionsByVolet,
      actionsByMonth
    }
  }, [actions])

  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      const matchesSearch = 
        action.nom_prenom_stagiaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.responsable_action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.lieu_realisation.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtre par volet supprimé

      const matchesDate = (() => {
        if (dateFilter === 'tous') return true
        
        const actionDate = new Date(action.date_action)
        const now = new Date()
        
        switch (dateFilter) {
          case 'ce_mois':
            return actionDate.getMonth() === now.getMonth() && actionDate.getFullYear() === now.getFullYear()
          case 'derniers_3_mois':
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
            return actionDate >= threeMonthsAgo
          case 'cette_annee':
            return actionDate.getFullYear() === now.getFullYear()
          default:
            return true
        }
      })()

      return matchesSearch && matchesDate
    })
  }, [actions, searchTerm, dateFilter])

  const handleViewAction = (action: ActionAmbassadeur) => {
    setSelectedAction(action)
    setShowActionDetail(true)
  }

  const handleDeleteAction = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) return
    
    const result = await deleteAction(id)
    if (!result.success) {
      alert(`Erreur: ${result.error}`)
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Nom du Stagiaire',
      'Équipe Participante', 
      'Responsable',
      'Lieu',
      'Date',
      'Participants',
      'Date de Création'
    ]

    const csvContent = [
      headers.join(','),
      ...filteredActions.map(action => [
        `"${action.nom_prenom_stagiaire}"`,
        `"${action.equipe_participante || ''}"`,
        `"${action.responsable_action}"`,
        `"${action.lieu_realisation}"`,
        `"${new Date(action.date_action).toLocaleDateString('fr-FR')}"`,
        action.nombre_participants,
        `"${new Date(action.created_at).toLocaleDateString('fr-FR')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `actions_ambassadeurs_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Chargement des actions ambassadeurs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Erreur lors du chargement des données</p>
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Moyenne Participants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageParticipants}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actions ce Mois</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(stats.actionsByMonth).reduce((sum, count) => sum + count, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lien vers le formulaire public */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Formulaire Public</h3>
              <p className="text-gray-600">Les stagiaires ambassadeurs peuvent soumettre leurs actions via ce lien</p>
            </div>
          </div>
          <a
            href="/ambassadeurs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
          >
            <Eye className="w-4 h-4" />
            Ouvrir le Formulaire
          </a>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, responsable ou lieu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="tous">Toutes les dates</option>
              <option value="ce_mois">Ce mois</option>
              <option value="derniers_3_mois">3 derniers mois</option>
              <option value="cette_annee">Cette année</option>
            </select>

            <button
              onClick={exportToCSV}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Liste des actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Actions Ambassadeurs ({filteredActions.length})
            </h3>
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showStats ? 'Masquer' : 'Afficher'} les statistiques
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredActions.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune action trouvée
              </h3>
              <p className="text-gray-600">
                {actions.length === 0 
                  ? 'Aucune action de stagiaire ambassadeur n\'a été enregistrée.'
                  : 'Aucune action ne correspond aux critères de recherche.'
                }
              </p>
            </div>
          ) : (
            filteredActions.map(action => (
              <div key={action.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {action.nom_prenom_stagiaire}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{action.responsable_action}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{action.lieu_realisation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(action.date_action).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{action.nombre_participants} participant(s)</span>
                      </div>
                    </div>

                    {action.equipe_participante && (
                      <p className="mt-2 text-sm text-gray-600">
                        <strong>Équipe:</strong> {action.equipe_participante}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewAction(action)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAction(action.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de détail de l'action */}
      {showActionDetail && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Détails de l'Action</h2>
              <button
                onClick={() => setShowActionDetail(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Stagiaire Ambassadeur</label>
                  <p className="text-gray-900">{selectedAction.nom_prenom_stagiaire}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Responsable</label>
                  <p className="text-gray-900">{selectedAction.responsable_action}</p>
                </div>
                {/* Volet supprimé */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Participants</label>
                  <p className="text-gray-900">{selectedAction.nombre_participants}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Lieu</label>
                  <p className="text-gray-900">{selectedAction.lieu_realisation}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Date</label>
                  <p className="text-gray-900">{new Date(selectedAction.date_action).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              {selectedAction.equipe_participante && (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Équipe Participante</label>
                  <p className="text-gray-900">{selectedAction.equipe_participante}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Créé le: {new Date(selectedAction.created_at).toLocaleDateString('fr-FR')}</span>
                  <span>Modifié le: {new Date(selectedAction.updated_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
