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
  X
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

export default function InterfaceConseiller() {
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
  const [conseillerConnecte, setConseillerConnecte] = useState<string>('')
  const [showConseillerSelect, setShowConseillerSelect] = useState(true)
  const [notes, setNotes] = useState<string>('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Liste des conseillers disponibles avec leurs vrais IDs de la base de données
  const [conseillers, setConseillers] = useState<Array<{id: string, nom: string, role: string}>>([])
  const [conseillersLoading, setConseillersLoading] = useState(true)
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

  // Charger les IDs des conseillers depuis la base de données
  const loadConseillers = async () => {
    try {
      setConseillersLoading(true)
      const response = await fetch('/api/assistance-stagiaires')
      const result = await response.json()
      
      if (result.success && result.conseillers) {
        const conseillersAutorises = ['ABDELHAMID INAJJAREN', 'SIHAM EL OMARI', 'IMANE IDRISSI', 'SARA HANZAZE']
        const conseillersFiltres = result.conseillers.filter((conseiller: any) => {
          const nomComplet = `${conseiller.prenom} ${conseiller.nom}`.toUpperCase()
          return conseillersAutorises.some(autorise => 
            nomComplet.includes(autorise.toUpperCase()) || 
            autorise.toUpperCase().includes(nomComplet)
          )
        })
        
        const conseillersAvecIds = conseillersFiltres
          .filter((conseiller: any) => {
            // Filtrer les conseillers avec des IDs valides
            if (!conseiller.id || conseiller.id === 'undefined' || conseiller.id.trim() === '') {
              console.warn('Conseiller sans ID valide ignoré:', conseiller)
              return false
            }
            // Vérifier que c'est un UUID valide
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(conseiller.id.trim())) {
              console.warn('Conseiller avec ID non-UUID ignoré:', conseiller.id, conseiller)
              return false
            }
            return true
          })
          .map((conseiller: any) => ({
            id: conseiller.id.trim(),
            nom: `${conseiller.prenom} ${conseiller.nom}`.toUpperCase(),
            role: conseiller.role === 'conseiller_cop' 
              ? (conseiller.prenom?.toUpperCase().includes('SARA') ? 'Conseillère d\'orientation' : 'Conseiller d\'orientation')
              : 'Conseillère Carrière'
          }))
        
        console.log('Conseillers chargés:', conseillersAvecIds)
        setConseillers(conseillersAvecIds)
        
        // Vérifier que le conseiller connecté existe toujours dans la liste
        if (conseillerConnecte && conseillerConnecte.trim() !== '') {
          const conseillerExiste = conseillersAvecIds.some((c: {id: string, nom: string, role: string}) => c.id === conseillerConnecte.trim())
          if (!conseillerExiste) {
            console.warn('Conseiller connecté non trouvé dans la liste, déconnexion forcée')
            setConseillerConnecte('')
            setShowConseillerSelect(true)
            localStorage.removeItem('conseillerConnecte')
          }
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des conseillers:', err)
    } finally {
      setConseillersLoading(false)
    }
  }

  // Charger les demandes
  const loadDemandes = async () => {
    if (!conseillerConnecte || conseillerConnecte.trim() === '' || conseillerConnecte === 'undefined') {
      console.warn('Conseiller non connecté, impossible de charger les demandes')
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch('/api/assistance-stagiaires')
      const result = await response.json()
      
      if (result.success) {
        // Filtrer les demandes : celles assignées à ce conseiller OU celles en attente (non assignées)
        const demandesFiltrees = (result.data || []).filter((demande: DemandeAssistance) => {
          // Afficher les demandes assignées à ce conseiller
          if (demande.conseiller_id === conseillerConnecte) {
            return true
          }
          // Afficher aussi les demandes en attente (non assignées) pour que le conseiller puisse les prendre
          if (demande.statut === 'en_attente' && (!demande.conseiller_id || demande.conseiller_id.trim() === '')) {
            return true
          }
          return false
        })
        console.log('Demandes chargées:', {
          total: result.data?.length || 0,
          filtrees: demandesFiltrees.length,
          conseillerConnecte
        })
        setDemandes(demandesFiltrees)
      } else {
        setError('Erreur lors du chargement des demandes')
      }
    } catch (err) {
      setError('Erreur de connexion')
      console.error('Erreur lors du chargement des demandes:', err)
    } finally {
      setLoading(false)
    }
  }

  // Charger les conseillers au démarrage
  useEffect(() => {
    loadConseillers()
    loadPolesFilieres()
  }, [])

  useEffect(() => {
    if (conseillerConnecte) {
      loadDemandes()
    }
  }, [conseillerConnecte])

  // Fonction pour se connecter en tant que conseiller
  const handleConseillerLogin = (conseillerId: string) => {
    console.log('handleConseillerLogin appelé avec:', conseillerId)
    if (!conseillerId || conseillerId.trim() === '' || conseillerId === 'undefined') {
      console.error('ID conseiller invalide:', conseillerId)
      setActionError('Erreur: ID conseiller invalide')
      return
    }
    const idTrimmed = conseillerId.trim()
    console.log('Conseiller ID validé:', idTrimmed)
    setConseillerConnecte(idTrimmed)
    setShowConseillerSelect(false)
    localStorage.setItem('conseillerConnecte', idTrimmed)
    console.log('Conseiller connecté et sauvegardé:', idTrimmed)
  }

  // Vérifier si un conseiller est déjà connecté
  useEffect(() => {
    const conseillerSauvegarde = localStorage.getItem('conseillerConnecte')
    if (conseillerSauvegarde && conseillerSauvegarde.trim() !== '' && conseillerSauvegarde !== 'undefined') {
      const idTrimmed = conseillerSauvegarde.trim()
      // Vérifier que c'est un UUID valide (format basique)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(idTrimmed)) {
        setConseillerConnecte(idTrimmed)
        setShowConseillerSelect(false)
        console.log('Conseiller restauré depuis localStorage:', idTrimmed)
      } else {
        console.error('ID conseiller invalide dans localStorage:', idTrimmed)
        localStorage.removeItem('conseillerConnecte')
        setConseillerConnecte('')
        setShowConseillerSelect(true)
      }
    } else {
      // Nettoyer localStorage si la valeur est invalide
      localStorage.removeItem('conseillerConnecte')
      setConseillerConnecte('')
      setShowConseillerSelect(true)
    }
  }, [])

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
      
      // Si l'action est "prendre", vérifier que le conseiller est connecté
      if (action === 'prendre') {
        // Vérifier que conseillerConnecte existe et est valide
        if (!conseillerConnecte || conseillerConnecte === 'undefined' || conseillerConnecte.trim() === '') {
          console.error('Conseiller non connecté:', conseillerConnecte)
          setActionError('Erreur: Aucun conseiller sélectionné. Veuillez vous reconnecter.')
          setActionLoading(false)
          return
        }
        
        // Vérifier que c'est un UUID valide
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        const conseillerIdTrimmed = conseillerConnecte.trim()
        if (!uuidRegex.test(conseillerIdTrimmed)) {
          console.error('Format UUID invalide pour conseiller:', conseillerIdTrimmed)
          setActionError('Erreur: ID conseiller invalide. Veuillez vous reconnecter.')
          setActionLoading(false)
          return
        }
        
        // Vérifier que le conseiller existe dans la liste des conseillers chargés
        const conseillerExiste = conseillers.some((c: {id: string, nom: string, role: string}) => c.id === conseillerIdTrimmed)
        if (!conseillerExiste) {
          console.error('Conseiller non trouvé dans la liste:', conseillerIdTrimmed, 'Liste:', conseillers)
          setActionError('Erreur: Conseiller non trouvé. Veuillez vous reconnecter.')
          setActionLoading(false)
          return
        }
      }
      
      // Préparer les données de mise à jour
      const updateData: any = {
        statut: action === 'prendre' ? 'en_cours' : action === 'terminer' ? 'terminee' : data?.statut,
        ...data
      }
      
      // Si l'action est "prendre", ajouter le conseiller_id
      if (action === 'prendre') {
        const conseillerIdTrimmed = conseillerConnecte.trim()
        // Double vérification avant d'ajouter
        if (conseillerIdTrimmed && conseillerIdTrimmed !== 'undefined' && conseillerIdTrimmed !== '') {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (uuidRegex.test(conseillerIdTrimmed)) {
            updateData.conseiller_id = conseillerIdTrimmed
            console.log('✅ Conseiller ID validé et ajouté à updateData:', conseillerIdTrimmed)
          } else {
            console.error('❌ Format UUID invalide après validation:', conseillerIdTrimmed)
            setActionError('Erreur: Format ID conseiller invalide. Veuillez vous reconnecter.')
            setActionLoading(false)
            return
          }
        } else {
          console.error('❌ Conseiller ID invalide après validation:', conseillerIdTrimmed)
          setActionError('Erreur: ID conseiller invalide. Veuillez vous reconnecter.')
          setActionLoading(false)
          return
        }
      }
      
      // Vérifier que updateData.conseiller_id existe si l'action est "prendre"
      if (action === 'prendre' && !updateData.conseiller_id) {
        console.error('❌ conseiller_id manquant dans updateData après validation')
        setActionError('Erreur: Impossible de déterminer l\'ID du conseiller. Veuillez vous reconnecter.')
        setActionLoading(false)
        return
      }
      
      const bodyJson = JSON.stringify(updateData)
      console.log('📤 Envoi requête PUT:', { 
        url: `/api/assistance-stagiaires/${demandeId}`,
        demandeId, 
        action, 
        updateData, 
        bodyJson,
        conseillerConnecte,
        hasConseillerId: !!updateData.conseiller_id,
        conseillerIdValue: updateData.conseiller_id
      })
      
      // Vérifier que le JSON ne contient pas "undefined"
      if (bodyJson.includes('"undefined"') || bodyJson.includes('undefined')) {
        console.error('❌ Le JSON contient "undefined":', bodyJson)
        setActionError('Erreur: Données invalides détectées. Veuillez vous reconnecter.')
        setActionLoading(false)
        return
      }
      
      const response = await fetch(`/api/assistance-stagiaires/${demandeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bodyJson
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

  // Interface de sélection du conseiller
  if (showConseillerSelect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🆘 Interface Conseiller
              </h1>
              <p className="text-gray-600">
                Sélectionnez votre profil pour accéder à vos demandes d'assistance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {conseillersLoading ? (
                <div className="col-span-full flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Chargement des conseillers...</span>
                </div>
              ) : (
                conseillers.map((conseiller) => (
                  <button
                    key={conseiller.id}
                    onClick={() => handleConseillerLogin(conseiller.id)}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {conseiller.nom}
                        </h3>
                        <p className="text-gray-600">{conseiller.role}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/assistance-stagiaires"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const conseillerActuel = conseillers.find((c: {id: string, nom: string, role: string}) => c.id === conseillerConnecte)
  
  // Log pour déboguer
  console.log('🔍 État actuel:', {
    conseillerConnecte,
    conseillerActuel,
    conseillersCount: conseillers.length,
    showConseillerSelect
  })

  // Vérifier que le conseiller est bien connecté avant d'afficher l'interface
  if (!conseillerConnecte || conseillerConnecte.trim() === '' || conseillerConnecte === 'undefined') {
    console.warn('⚠️ Conseiller non connecté, affichage de la sélection')
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🆘 Interface Conseiller
              </h1>
              <p className="text-gray-600">
                Veuillez sélectionner votre profil pour accéder à vos demandes d'assistance
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {conseillersLoading ? (
                <div className="col-span-full flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Chargement des conseillers...</span>
                </div>
              ) : (
                conseillers.map((conseiller) => (
                  <button
                    key={conseiller.id}
                    onClick={() => handleConseillerLogin(conseiller.id)}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {conseiller.nom}
                        </h3>
                        <p className="text-gray-600">{conseiller.role}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
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
                🆘 Interface Conseiller - {conseillerActuel?.nom || 'Non connecté'}
              </h1>
              <p className="text-gray-600">
                Gérez vos demandes d'assistance assignées
              </p>
              {conseillerConnecte && (
                <p className="text-xs text-gray-400 mt-1">
                  ID: {conseillerConnecte.substring(0, 8)}...
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  localStorage.removeItem('conseillerConnecte')
                  setConseillerConnecte('')
                  setShowConseillerSelect(true)
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Changer de conseiller
              </button>
              <Link
                href="/assistance-stagiaires"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Retour à l'accueil
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
                          const response = await fetch(`/api/assistance-stagiaires/${selectedDemande.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ notes })
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
