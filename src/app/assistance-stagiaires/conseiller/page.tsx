'use client'

import { useState, useEffect, useCallback } from 'react'
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
  X
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getRoleLabel } from '@/utils/constants'
import { getAssistanceAuthHeaders } from '@/lib/assistanceAuthClient'

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
  pole_id?: string
  filiere_id?: string
  notes?: string
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
  developpement: 'Développement personnel',
  paraformations: 'Activités Paraformations'
}

const statuts = {
  en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  terminee: { label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle }
}

const CONSEILLER_ROLES = new Set(['conseiller_cop', 'conseillere_carriere'])

export default function InterfaceConseiller() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const conseillerId = profile?.id || ''
  const isConseiller = profile?.role ? CONSEILLER_ROLES.has(profile.role) : false

  const [demandes, setDemandes] = useState<DemandeAssistance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    statut: '',
    type_assistance: '',
    pole: '',
    filiere: '',
    date_debut: '',
    date_fin: ''
  })
  const [selectedDemande, setSelectedDemande] = useState<DemandeAssistance | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [notes, setNotes] = useState<string>('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [poles, setPoles] = useState<any[]>([])
  const [filieres, setFilieres] = useState<any[]>([])

  useEffect(() => {
    if (authLoading) return
    if (!profile) {
      router.replace('/login')
      return
    }
    if (!isConseiller) {
      router.replace('/dashboard-full')
    }
  }, [authLoading, profile, isConseiller, router])

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

  const loadDemandes = useCallback(async () => {
    if (!conseillerId) return

    try {
      setLoading(true)
      setError('')
      const headers = await getAssistanceAuthHeaders()
      const response = await fetch('/api/assistance-stagiaires', { headers })
      const result = await response.json()

      if (response.status === 401 || response.status === 403) {
        setError(result.error || 'Accès non autorisé')
        return
      }

      if (result.success) {
        setDemandes(result.data || [])
      } else {
        setError(result.error || 'Erreur lors du chargement des demandes')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [conseillerId])

  useEffect(() => {
    loadPolesFilieres()
  }, [])

  useEffect(() => {
    if (conseillerId && isConseiller) {
      loadDemandes()
    }
  }, [conseillerId, isConseiller, loadDemandes])

  // Filtrer les demandes
  const filteredDemandes = demandes.filter(demande => {
    const matchesSearch = searchTerm === '' || 
      demande.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.telephone.includes(searchTerm)
    
    const matchesStatut = filters.statut === '' || demande.statut === filters.statut
    const matchesType = filters.type_assistance === '' || demande.type_assistance === filters.type_assistance
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
    
    return matchesSearch && matchesStatut && matchesType && matchesPole && matchesFiliere && matchesDate()
  })

  // Actions sur les demandes
  const handleAction = async (demandeId: string, action: string, data?: any) => {
    try {
      setActionLoading(true)
      setActionError('') // Réinitialiser l'erreur d'action
      
      // Validation des paramètres
      if (!demandeId || demandeId === 'undefined') {
        setActionError('Erreur: ID de la demande manquant')
        setActionLoading(false)
        return
      }
      
      const updateData: Record<string, unknown> = {
        statut: action === 'prendre' ? 'en_cours' : action === 'terminer' ? 'terminee' : data?.statut,
        ...data,
      }

      const headers = await getAssistanceAuthHeaders(true)
      const response = await fetch(`/api/assistance-stagiaires/${demandeId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        await loadDemandes() // Recharger les demandes
        setShowModal(false)
        setSelectedDemande(null)
        setActionError('') // S'assurer qu'il n'y a pas d'erreur
      } else {
        const errorMessage = result.error || 'Erreur lors de la mise à jour de la demande'
        setActionError(errorMessage)
        console.error('Erreur lors de la mise à jour:', result)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion'
      setActionError(errorMessage)
      console.error('Erreur lors de l\'action:', err)
    } finally {
      setActionLoading(false)
    }
  }

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

  const conseillerNom = profile
    ? `${profile.prenom || ''} ${profile.nom || ''}`.trim().toUpperCase()
    : ''
  const conseillerRoleLabel = profile?.role
    ? getRoleLabel(profile.role, profile.prenom)
    : ''

  if (authLoading || !profile || !isConseiller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🆘 Interface Conseiller — {conseillerNom}
              </h1>
              <p className="text-gray-600">
                {conseillerRoleLabel} — vos demandes d&apos;assistance assignées uniquement
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/stagiaires?tab=assistance-conseiller"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Retour
              </Link>
            </div>
          </div>
        </div>

        {/* Affichage des erreurs d'action */}
        {actionError && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700 font-medium">{actionError}</p>
              </div>
              <button
                onClick={() => setActionError('')}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
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

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total demandes</p>
                <p className="text-2xl font-bold text-gray-900">{demandes.length}</p>
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
                <p className="text-2xl font-bold text-yellow-600">
                  {demandes.filter(d => d.statut === 'en_attente').length}
                </p>
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
                <p className="text-2xl font-bold text-blue-600">
                  {demandes.filter(d => d.statut === 'en_cours').length}
                </p>
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
                <p className="text-2xl font-bold text-green-600">
                  {demandes.filter(d => d.statut === 'terminee').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Liste des demandes */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Demandes d'assistance ({filteredDemandes.length})
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
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statuts[demande.statut].color}`}>
                          {getStatutIcon(demande.statut)}
                          {statuts[demande.statut].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(demande.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDemande(demande)
                              setNotes(demande.notes || '')
                              setShowModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </button>
                          
                          {demande.statut === 'en_attente' && (
                            <button
                              onClick={() => handleAction(demande.id, 'prendre')}
                              disabled={actionLoading}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              Prendre
                            </button>
                          )}
                          
                          {demande.statut === 'en_cours' && (
                            <button
                              onClick={() => handleAction(demande.id, 'terminer')}
                              disabled={actionLoading}
                              className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Terminer
                            </button>
                          )}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes du conseiller</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ajoutez vos notes ici..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={4}
                    />
                    <button
                      onClick={async () => {
                        if (!selectedDemande) return
                        setSavingNotes(true)
                        try {
                          const noteHeaders = await getAssistanceAuthHeaders(true)
                          const response = await fetch(`/api/assistance-stagiaires/${selectedDemande.id}`, {
                            method: 'PUT',
                            headers: noteHeaders,
                            body: JSON.stringify({ notes }),
                          })
                          
                          if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}))
                            console.error('Erreur réponse API:', response.status, errorData)
                            alert(`Erreur lors de la sauvegarde: ${errorData.error || response.statusText || 'Erreur inconnue'}`)
                            setSavingNotes(false)
                            return
                          }
                          
                          const result = await response.json()
                          if (result.success) {
                            // Mettre à jour la demande locale
                            setSelectedDemande({ ...selectedDemande, notes })
                            // Mettre à jour dans la liste
                            setDemandes(demandes.map(d => d.id === selectedDemande.id ? { ...d, notes } : d))
                            alert('Notes sauvegardées avec succès')
                          } else {
                            console.error('Erreur dans result:', result)
                            alert(`Erreur lors de la sauvegarde: ${result.error || 'Erreur inconnue'}`)
                          }
                        } catch (error: any) {
                          console.error('Erreur sauvegarde notes:', error)
                          alert(`Erreur lors de la sauvegarde: ${error.message || 'Erreur de connexion'}`)
                        } finally {
                          setSavingNotes(false)
                        }
                      }}
                      disabled={savingNotes}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingNotes ? 'Sauvegarde...' : 'Enregistrer les notes'}
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setSelectedDemande(null)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Fermer
                  </button>
                  
                  {selectedDemande.statut === 'en_attente' && (
                    <button
                      onClick={() => handleAction(selectedDemande.id, 'prendre')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Prendre en charge
                    </button>
                  )}
                  
                  {selectedDemande.statut === 'en_cours' && (
                    <button
                      onClick={() => handleAction(selectedDemande.id, 'terminer')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marquer comme terminée
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
