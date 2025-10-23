'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  Phone,
  Mail,
  Eye,
  Edit,
  Check,
  X,
  BarChart3,
  Users,
  TrendingUp,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

interface DemandeAssistance {
  id: string
  nom: string
  prenom: string
  telephone: string
  type_assistance: string
  statut: 'en_attente' | 'en_cours' | 'terminee'
  created_at: string
  updated_at: string
  conseiller_id: string
  poles?: {
    nom: string
    code: string
  }
  filieres?: {
    nom: string
    code: string
  }
  profiles?: {
    nom: string
    prenom: string
    email: string
    role: string
  }
}

const typesAssistance = {
  orientation: 'Orientation',
  strategie: 'Stratégie de recherche d\'emploi',
  entretiens: 'Préparation aux entretiens',
  developpement: 'Développement personnel'
}

const statuts = {
  en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  terminee: { label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle }
}

export default function InterfaceAdmin() {
  const [demandes, setDemandes] = useState<DemandeAssistance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    statut: '',
    type_assistance: '',
    conseiller: '',
    pole: '',
    filiere: '',
    date_debut: '',
    date_fin: ''
  })
  const [selectedDemande, setSelectedDemande] = useState<DemandeAssistance | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [poles, setPoles] = useState<any[]>([])
  const [filieres, setFilieres] = useState<any[]>([])

  // Charger les pôles et filières
  const loadPolesFilieres = async () => {
    try {
      const [polesRes, filieresRes] = await Promise.all([
        fetch('/api/settings?type=poles'),
        fetch('/api/settings?type=filieres')
      ])
      
      const polesData = await polesRes.json()
      const filieresData = await filieresRes.json()
      
      if (polesData.success) setPoles(polesData.data || [])
      if (filieresData.success) setFilieres(filieresData.data || [])
    } catch (err) {
      console.error('Erreur chargement pôles/filières:', err)
    }
  }

  // Charger toutes les demandes (vue admin)
  const loadDemandes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/assistance-stagiaires')
      const result = await response.json()
      
      if (result.success) {
        setDemandes(result.data || [])
      } else {
        setError('Erreur lors du chargement des demandes')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDemandes()
    loadPolesFilieres()
  }, [])

  // Fonction pour supprimer une demande (admin uniquement)
  const handleDeleteDemande = async (demandeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.')) {
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/assistance-stagiaires/${demandeId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        await loadDemandes() // Recharger les demandes
        setError('')
      } else {
        setError(result.error || 'Erreur lors de la suppression')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setActionLoading(false)
    }
  }

  // Filtrer les demandes
  const filteredDemandes = demandes.filter(demande => {
    const matchesSearch = searchTerm === '' || 
      demande.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.telephone.includes(searchTerm)
    
    const matchesStatut = filters.statut === '' || demande.statut === filters.statut
    const matchesType = filters.type_assistance === '' || demande.type_assistance === filters.type_assistance
    const matchesConseiller = filters.conseiller === '' || 
      (demande.profiles?.prenom + ' ' + demande.profiles?.nom).toLowerCase().includes(filters.conseiller.toLowerCase())
    const matchesPole = filters.pole === '' || demande.pole_id === filters.pole
    const matchesFiliere = filters.filiere === '' || demande.filiere_id === filters.filiere
    
    const matchesDate = () => {
      if (!filters.date_debut && !filters.date_fin) return true
      const demandeDate = new Date(demande.created_at)
      const dateDebut = filters.date_debut ? new Date(filters.date_debut) : null
      const dateFin = filters.date_fin ? new Date(filters.date_fin) : null
      
      if (dateDebut && demandeDate < dateDebut) return false
      if (dateFin && demandeDate > dateFin) return false
      return true
    }
    
    return matchesSearch && matchesStatut && matchesType && matchesConseiller && matchesPole && matchesFiliere && matchesDate()
  })

  const getStatutIcon = (statut: string) => {
    const IconComponent = statuts[statut as keyof typeof statuts]?.icon || Clock
    return <IconComponent className="w-4 h-4" />
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

  // Statistiques
  const stats = {
    total: demandes.length,
    en_attente: demandes.filter(d => d.statut === 'en_attente').length,
    en_cours: demandes.filter(d => d.statut === 'en_cours').length,
    terminees: demandes.filter(d => d.statut === 'terminee').length,
    par_type: {
      orientation: demandes.filter(d => d.type_assistance === 'orientation').length,
      strategie: demandes.filter(d => d.type_assistance === 'strategie').length,
      entretiens: demandes.filter(d => d.type_assistance === 'entretiens').length,
      developpement: demandes.filter(d => d.type_assistance === 'developpement').length
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📊 Tableau de Bord Admin - Assistance Stagiaires
              </h1>
              <p className="text-gray-600">
                Vue d'ensemble de toutes les demandes d'assistance
              </p>
            </div>
            <Link
              href="/assistance-stagiaires"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total demandes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.en_attente}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.en_cours}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.terminees}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques par type */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orientation</p>
                <p className="text-2xl font-bold text-purple-600">{stats.par_type.orientation}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stratégie emploi</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.par_type.strategie}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entretiens</p>
                <p className="text-2xl font-bold text-orange-600">{stats.par_type.entretiens}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Développement</p>
                <p className="text-2xl font-bold text-pink-600">{stats.par_type.developpement}</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-full">
                <User className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
            {/* Recherche */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filtre statut */}
            <div>
              <select
                value={filters.statut}
                onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
              </select>
            </div>

            {/* Filtre type */}
            <div>
              <select
                value={filters.type_assistance}
                onChange={(e) => setFilters(prev => ({ ...prev, type_assistance: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="orientation">Orientation</option>
                <option value="strategie">Stratégie emploi</option>
                <option value="entretiens">Préparation entretiens</option>
                <option value="developpement">Développement personnel</option>
              </select>
            </div>

            {/* Filtre conseiller */}
            <div>
              <input
                type="text"
                placeholder="Filtrer par conseiller..."
                value={filters.conseiller}
                onChange={(e) => setFilters(prev => ({ ...prev, conseiller: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtre pôle */}
            <div>
              <select
                value={filters.pole}
                onChange={(e) => setFilters(prev => ({ ...prev, pole: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les pôles</option>
                {poles.map(pole => (
                  <option key={pole.id} value={pole.id}>{pole.nom}</option>
                ))}
              </select>
            </div>

            {/* Filtre filière */}
            <div>
              <select
                value={filters.filiere}
                onChange={(e) => setFilters(prev => ({ ...prev, filiere: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes les filières</option>
                {filieres.map(filiere => (
                  <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                ))}
              </select>
            </div>

            {/* Bouton actualiser */}
            <div>
              <button
                onClick={loadDemandes}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des demandes */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Toutes les demandes d'assistance ({filteredDemandes.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des demandes...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadDemandes}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : filteredDemandes.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune demande trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stagiaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pôle / Filière
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type d'assistance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conseiller assigné
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de création
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDemandes.map((demande) => (
                    <tr key={demande.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {demande.prenom} {demande.nom}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {demande.telephone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {demande.poles?.nom || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {demande.filieres?.nom || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {typesAssistance[demande.type_assistance as keyof typeof typesAssistance]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {demande.profiles ? 
                            `${demande.profiles.prenom} ${demande.profiles.nom}` : 
                            'Non assigné'
                          }
                        </div>
                        <div className="text-sm text-gray-500">
                          {demande.profiles?.role || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statuts[demande.statut].color}`}>
                          {getStatutIcon(demande.statut)}
                          {statuts[demande.statut].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(demande.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedDemande(demande)
                              setShowModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </button>
                          <button
                            onClick={() => handleDeleteDemande(demande.id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50"
                            title="Supprimer cette demande (Admin uniquement)"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de détail */}
        {showModal && selectedDemande && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Détails de la demande
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setSelectedDemande(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDemande.nom}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Prénom</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDemande.prenom}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedDemande.telephone}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pôle</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDemande.poles?.nom || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Filière</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDemande.filieres?.nom || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type d'assistance</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {typesAssistance[selectedDemande.type_assistance as keyof typeof typesAssistance]}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Conseiller assigné</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedDemande.profiles ? 
                        `${selectedDemande.profiles.prenom} ${selectedDemande.profiles.nom} (${selectedDemande.profiles.role})` : 
                        'Non assigné'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statuts[selectedDemande.statut].color}`}>
                      {getStatutIcon(selectedDemande.statut)}
                      {statuts[selectedDemande.statut].label}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de création</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedDemande.created_at)}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setSelectedDemande(null)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
