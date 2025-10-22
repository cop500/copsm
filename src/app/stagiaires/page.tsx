'use client'

import React, { useState } from 'react'
import { useCandidatures } from '@/hooks/useCandidatures'
import { useSettings } from '@/hooks/useSettings'
import { useRole } from '@/hooks/useRole'
import { useAuth } from '@/hooks/useAuth'
import { 
  X, Save, Trash2, Eye, Clock, CheckCircle, AlertTriangle,
  Search, Filter, User, Mail, Phone, MapPin, Calendar, Target, Award,
  ChevronRight, ChevronDown, Star, Flag, Download, ExternalLink, Users,
  Briefcase, FileText, MessageSquare, TrendingUp, UserCheck, Building2,
  Send, Printer, CalendarDays, PhoneCall, Mail as MailIcon, Star as StarIcon,
  EyeOff, CheckSquare, XSquare, Clock as ClockIcon, Users as UsersIcon,
  FileDown, Share2, MoreHorizontal, Edit, Archive, RefreshCw,
  ZoomIn, ZoomOut, RotateCw, Maximize, Minimize, FileText as FileTextIcon,
  Upload, HelpCircle, Settings
} from 'lucide-react'
import Link from 'next/link'

// Types pour les nouveaux statuts
type CandidatureStatus = 
  | 'envoye' 
  | 'en_etude' 
  | 'invite_entretien' 
  | 'entretien_programme' 
  | 'entretien_realise' 
  | 'acceptee' 
  | 'refusee' 
  | 'en_attente'

interface CandidatureAction {
  id: string
  type: 'status_change' | 'note_added' | 'interview_scheduled' | 'contact_made'
  description: string
  date: string
  user?: string
}

export default function StagiairesPage() {
  const { candidatures: candidaturesStagiaires, updateStatutCandidature, deleteCandidature, loadCandidatures, refreshCandidatures, newCandidatureCount, clearNewCandidatureCount, isRealtimeConnected } = useCandidatures()
  const { poles, filieres, loading: settingsLoading } = useSettings()
  const { isDirecteur } = useRole()
  const { profile } = useAuth()
  
  // Vérifier si l'utilisateur est business_developer (admin)
  const isAdmin = profile?.role === 'business_developer'
  
  // État pour l'onglet actif
  const [activeTab, setActiveTab] = useState('candidatures')
  
  // Si l'utilisateur n'est pas admin et essaie d'accéder à CV Connect ou Assistance Admin, rediriger vers candidatures
  React.useEffect(() => {
    if (!isAdmin && (activeTab === 'cv-connect' || activeTab === 'assistance-admin')) {
      setActiveTab('candidatures')
    }
  }, [isAdmin, activeTab])
  
  // États pour les filtres et actions
  const [candidatureFilter, setCandidatureFilter] = useState('tous')
  const [candidatureSearch, setCandidatureSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('tous')
  const [entrepriseFilter, setEntrepriseFilter] = useState('')
  const [poleFilter, setPoleFilter] = useState('')
  const [filiereFilter, setFiliereFilter] = useState('')
  const [selectedCandidature, setSelectedCandidature] = useState<any>(null)
  const [showCandidatureDetail, setShowCandidatureDetail] = useState(false)
  const [candidatureNotes, setCandidatureNotes] = useState('')
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [interviewData, setInterviewData] = useState({
    date: '',
    time: '',
    type: 'telephone',
    notes: ''
  })
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)
  const [selectedCandidatures, setSelectedCandidatures] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  // États pour le visualiseur PDF
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfTitle, setPdfTitle] = useState('')
  const [pdfScale, setPdfScale] = useState(1.0)
  const [pdfRotation, setPdfRotation] = useState(0)

  // Configuration des statuts
  const statusConfig = {
    envoye: { label: 'Envoyée', color: 'bg-blue-100 text-blue-800', icon: Send },
    en_etude: { label: 'En cours d\'étude', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
    invite_entretien: { label: 'Invitée en entretien', color: 'bg-purple-100 text-purple-800', icon: CalendarDays },
    entretien_programme: { label: 'Entretien programmé', color: 'bg-indigo-100 text-indigo-800', icon: Clock },
    entretien_realise: { label: 'Entretien réalisé', color: 'bg-orange-100 text-orange-800', icon: CheckCircle },
    acceptee: { label: 'Acceptée', color: 'bg-green-100 text-green-800', icon: CheckSquare },
    refusee: { label: 'Refusée', color: 'bg-red-100 text-red-800', icon: XSquare },
    en_attente: { label: 'En attente', color: 'bg-gray-100 text-gray-800', icon: ClockIcon }
  }

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // Ouvrir les détails d'une candidature
  const handleCandidatureDetail = (candidature: any) => {
    console.log('Clic sur candidature:', candidature)
    console.log('showCandidatureDetail avant:', showCandidatureDetail)
    setSelectedCandidature(candidature)
    setCandidatureNotes(candidature.feedback_entreprise || '')
    setShowCandidatureDetail(true)
    console.log('showCandidatureDetail après:', true)
  }

  // Mettre à jour les notes d'une candidature
  const handleUpdateCandidatureNotes = async () => {
    if (!selectedCandidature) return

    const result = await updateStatutCandidature(
      selectedCandidature.id, 
      selectedCandidature.statut_candidature || 'envoye',
      candidatureNotes
    )
    
    if (result.success) {
      showMessage('Notes mises à jour avec succès')
      setShowCandidatureDetail(false)
    } else {
      showMessage(result.error || 'Erreur lors de la mise à jour', 'error')
    }
  }

  // Ouvrir le visualiseur PDF
  const handleViewPdf = (cvUrl: string, candidatName: string, entrepriseName: string) => {
    if (cvUrl) {
      setPdfUrl(cvUrl)
      setPdfTitle(`CV - ${candidatName} - ${entrepriseName}`)
      setPdfScale(1.0)
      setPdfRotation(0)
      setShowPdfViewer(true)
    } else {
      showMessage('CV non disponible', 'error')
    }
  }

  // Ouvrir le CV dans une nouvelle fenêtre
  const handleViewCv = (cvUrl: string) => {
    if (cvUrl) {
      window.open(cvUrl, '_blank')
    } else {
      showMessage('CV non disponible', 'error')
    }
  }

  // Télécharger le CV avec nom personnalisé
  const handleDownloadCv = (cvUrl: string, candidatName: string, entrepriseName: string) => {
    if (cvUrl) {
      const link = document.createElement('a')
      link.href = cvUrl
      link.download = `CV_${candidatName.replace(/\s+/g, '_')}_${entrepriseName.replace(/\s+/g, '_')}.pdf`
      link.click()
      showMessage('CV téléchargé avec succès')
    } else {
      showMessage('CV non disponible', 'error')
    }
  }

  // Actions rapides
  const handleQuickAction = async (candidatureId: string, action: string) => {
    try {
      let newStatus: CandidatureStatus = 'envoye'
      let message = ''

      switch (action) {
        case 'invite_entretien':
          newStatus = 'invite_entretien'
          message = 'Candidat invité en entretien'
          break
        case 'programmer_entretien':
          setSelectedCandidature(candidaturesStagiaires.find(c => c.id === candidatureId))
          setShowInterviewModal(true)
          return
        case 'accepter':
          newStatus = 'acceptee'
          message = 'Candidature acceptée'
          break
        case 'refuser':
          newStatus = 'refusee'
          message = 'Candidature refusée'
          break
        case 'en_etude':
          newStatus = 'en_etude'
          message = 'Candidature en cours d\'étude'
          break
        case 'contacter':
          // Ouvrir email client
          const candidature = candidaturesStagiaires.find(c => c.id === candidatureId)
          if (candidature?.email) {
            window.open(`mailto:${candidature.email}?subject=Réponse à votre candidature - ${candidature.entreprise_nom}`, '_blank')
          }
          return
      }

      const result = await updateStatutCandidature(candidatureId, newStatus)
        if (result.success) {
        showMessage(message)
        } else {
        showMessage(result.error || 'Erreur lors de la mise à jour', 'error')
      }
    } catch (error) {
      showMessage('Erreur lors de l\'action', 'error')
    }
  }

  // Programmer un entretien
  const handleScheduleInterview = async () => {
    if (!selectedCandidature || !interviewData.date || !interviewData.time) {
      showMessage('Veuillez remplir tous les champs', 'error')
      return
    }

    try {
      const result = await updateStatutCandidature(
        selectedCandidature.id,
        'entretien_programme',
        `Entretien programmé le ${interviewData.date} à ${interviewData.time} (${interviewData.type}). ${interviewData.notes}`
      )
      
      if (result.success) {
        showMessage('Entretien programmé avec succès')
        setShowInterviewModal(false)
        setInterviewData({ date: '', time: '', type: 'telephone', notes: '' })
      } else {
        showMessage(result.error || 'Erreur lors de la programmation', 'error')
      }
    } catch (error) {
      showMessage('Erreur lors de la programmation', 'error')
    }
  }

  // Actions en lot
  const handleBulkAction = async (action: string) => {
    if (selectedCandidatures.length === 0) {
      showMessage('Aucune candidature sélectionnée', 'error')
      return
    }

    try {
      let newStatus: CandidatureStatus = 'envoye'
      let message = ''

      switch (action) {
        case 'accepter':
          newStatus = 'acceptee'
          message = `${selectedCandidatures.length} candidature(s) acceptée(s)`
          break
        case 'refuser':
          newStatus = 'refusee'
          message = `${selectedCandidatures.length} candidature(s) refusée(s)`
          break
        case 'en_etude':
          newStatus = 'en_etude'
          message = `${selectedCandidatures.length} candidature(s) en cours d'étude`
          break
      }

      // Mettre à jour toutes les candidatures sélectionnées
      for (const candidatureId of selectedCandidatures) {
        await updateStatutCandidature(candidatureId, newStatus)
      }

      showMessage(message)
      setSelectedCandidatures([])
      setShowBulkActions(false)
    } catch (error) {
      showMessage('Erreur lors de l\'action en lot', 'error')
    }
  }

  // Filtrage des candidatures
  const filteredCandidatures = candidaturesStagiaires.filter(candidature => {
    const matchesSearch = candidatureSearch === '' || 
      candidature.entreprise_nom.toLowerCase().includes(candidatureSearch.toLowerCase()) ||
      candidature.poste.toLowerCase().includes(candidatureSearch.toLowerCase()) ||
      candidature.nom?.toLowerCase().includes(candidatureSearch.toLowerCase()) ||
      candidature.prenom?.toLowerCase().includes(candidatureSearch.toLowerCase())
    
    const matchesFilter = candidatureFilter === 'tous' || 
      candidature.statut_candidature === candidatureFilter

    const matchesEntreprise = entrepriseFilter === '' ||
      candidature.entreprise_nom.toLowerCase().includes(entrepriseFilter.toLowerCase())

    const matchesDate = (() => {
      if (dateFilter === 'tous') return true
      const candidatureDate = new Date(candidature.created_at)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - candidatureDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (dateFilter) {
        case 'aujourd_hui': return diffDays === 0
        case 'cette_semaine': return diffDays <= 7
        case 'ce_mois': return diffDays <= 30
        default: return true
      }
    })()

    const matchesPole = poleFilter === '' || candidature.pole_id === poleFilter
    const matchesFiliere = filiereFilter === '' || candidature.filiere_id === filiereFilter

    return matchesSearch && matchesFilter && matchesEntreprise && matchesDate && matchesPole && matchesFiliere
  })

  // Filtres pour les filières selon le pôle sélectionné
  const filteredFilieres = filieres.filter(f => f.pole_id === poleFilter)

  // Statistiques
  const getStatusCount = (status: CandidatureStatus) => 
    candidaturesStagiaires.filter(c => c.statut_candidature === status).length


  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Messages */}
      {message && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-md flex items-center z-50 ${
          message.type === 'error' 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          <CheckCircle className="w-4 h-4 mr-2" />
          {message.text}
        </div>
      )}

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
          <h1 className="text-2xl font-bold text-gray-900">📥 Candidatures reçues</h1>
          <p className="text-gray-600">Gestion avancée des candidatures avec workflow automatisé</p>
            </div>
            <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{candidaturesStagiaires.length}</div>
            <div className="text-sm text-gray-600">Candidatures</div>
          </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('candidatures')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'candidatures'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>Candidatures reçues</span>
                </div>
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('cv-connect')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'cv-connect'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>CV Connect</span>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Nouveau
                    </span>
                  </div>
                </button>
              )}

              {/* Onglet Assistance Conseiller */}
              <button
                onClick={() => setActiveTab('assistance-conseiller')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assistance-conseiller'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5" />
                  <span>Assistance Conseiller</span>
                </div>
              </button>

              {/* Onglet Assistance Admin - Visible seulement pour les admins */}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('assistance-admin')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'assistance-admin'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Assistance Admin</span>
                  </div>
                </button>
              )}
            </nav>
          </div>

        {/* Tab Content */}
        {activeTab === 'candidatures' && (
          <div>
            {/* Statistiques des candidatures */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon
          return (
            <div key={status} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Icon className="w-6 h-6 text-gray-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-600">{config.label}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {getStatusCount(status as CandidatureStatus)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
                </div>

      {/* Actions en lot */}
      {selectedCandidatures.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedCandidatures.length} candidature(s) sélectionnée(s)
              </span>
              </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('en_etude')}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
              >
                En étude
              </button>
              <button
                onClick={() => handleBulkAction('accepter')}
                className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
              >
                Accepter
              </button>
              <button
                onClick={() => handleBulkAction('refuser')}
                className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
              >
                Refuser
              </button>
              <button
                onClick={() => setSelectedCandidatures([])}
                className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200"
              >
                Annuler
              </button>
            </div>
                </div>
              </div>
      )}

      {/* Filtres et recherche */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                placeholder="Rechercher par entreprise, poste, nom..."
                value={candidatureSearch}
                onChange={(e) => setCandidatureSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
          
          <div>
              <select
              value={candidatureFilter}
              onChange={(e) => setCandidatureFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Tous les statuts</option>
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
                ))}
              </select>
          </div>

          <div>
              <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="tous">Toutes dates</option>
              <option value="aujourd_hui">Aujourd'hui</option>
              <option value="cette_semaine">Cette semaine</option>
              <option value="ce_mois">Ce mois</option>
            </select>
          </div>

          <div>
            <input
              type="text"
              placeholder="Filtrer par entreprise"
              value={entrepriseFilter}
              onChange={(e) => setEntrepriseFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={poleFilter}
              onChange={(e) => {
                setPoleFilter(e.target.value)
                setFiliereFilter('') // Réinitialiser le filtre filière
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les pôles</option>
              {poles.map((pole) => (
                <option key={pole.id} value={pole.id}>
                  {pole.nom}
                </option>
                ))}
              </select>
          </div>

          <div>
            <select
              value={filiereFilter}
              onChange={(e) => setFiliereFilter(e.target.value)}
              disabled={!poleFilter}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="">Toutes les filières</option>
              {filteredFilieres.map((filiere) => (
                <option key={filiere.id} value={filiere.id}>
                  {filiere.nom}
                </option>
              ))}
            </select>
              </div>
            </div>
          </div>

      {/* Liste des candidatures */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              Candidatures reçues ({filteredCandidatures.length})
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className="text-xs text-gray-500">
                {isRealtimeConnected ? 'Temps réel actif' : 'Actualisation auto (30s)'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                refreshCandidatures()
                clearNewCandidatureCount()
              }}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 flex items-center gap-1 relative"
              title="Actualiser les candidatures"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
              {newCandidatureCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {newCandidatureCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              Actions en lot
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredCandidatures.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Send className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune candidature trouvée</p>
              <p className="text-sm mt-2">Ajustez vos filtres pour voir plus de résultats</p>
                </div>
              ) : (
            filteredCandidatures.map((candidature) => {
              const statusInfo = statusConfig[candidature.statut_candidature as CandidatureStatus] || statusConfig.envoye
              const StatusIcon = statusInfo.icon
              const candidatName = `${candidature.nom} ${candidature.prenom}`
                    
                    return (
                <div key={candidature.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                            <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <input
                          type="checkbox"
                          checked={selectedCandidatures.includes(candidature.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCandidatures([...selectedCandidatures, candidature.id])
                            } else {
                              setSelectedCandidatures(selectedCandidatures.filter(id => id !== candidature.id))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {candidature.entreprise_nom}
                                </h3>
                          <p className="text-sm text-gray-500">
                            Reçue le {new Date(candidature.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                                </span>
                              </div>
                              
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">Poste :</span> {candidature.poste}
                                </div>
                                <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">Candidat :</span> {candidatName}
                                </div>
                                <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">Email :</span> {candidature.email}
                                </div>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">Type :</span> {candidature.type_contrat || 'Non spécifié'}
                              </div>
                            </div>
                            
                      {candidature.feedback_entreprise && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center mb-2">
                            <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium text-sm">Notes :</span>
                          </div>
                          <p className="text-sm text-gray-600">{candidature.feedback_entreprise}</p>
                        </div>
                      )}

                      {/* Actions CV */}
                      {candidature.cv_url && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center mb-2">
                            <FileTextIcon className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="font-medium text-sm text-blue-900">Actions CV :</span>
                          </div>
                          <div className="flex space-x-2">
                              <button
                              onClick={() => handleViewPdf(
                                candidature.cv_url,
                                `${candidature.nom} ${candidature.prenom}`,
                                candidature.entreprise_nom
                              )}
                              className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Voir le CV
                              </button>
                              <button
                              onClick={() => handleViewCv(candidature.cv_url)}
                              className="text-green-600 hover:text-green-800 text-sm underline flex items-center"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Ouvrir
                              </button>
                              <button
                              onClick={() => handleDownloadCv(
                                candidature.cv_url,
                                `${candidature.nom} ${candidature.prenom}`,
                                candidature.entreprise_nom
                              )}
                              className="text-purple-600 hover:text-purple-800 text-sm underline flex items-center"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Télécharger
                              </button>
                            </div>
                          </div>
                      )}
                            </div>
                            
                    <div className="flex flex-col items-end space-y-2 ml-4">
                            {/* Actions rapides */}
                      <div className="flex items-center space-x-1">
                              <button
                          onClick={() => handleQuickAction(candidature.id, 'invite_entretien')}
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors"
                          title="Inviter en entretien"
                              >
                          <CalendarDays className="w-4 h-4" />
                              </button>
                        
                                <button
                          onClick={() => handleQuickAction(candidature.id, 'programmer_entretien')}
                          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Programmer entretien"
                                >
                          <Clock className="w-4 h-4" />
                                </button>
                        
              <button
                          onClick={() => handleQuickAction(candidature.id, 'contacter')}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Contacter"
              >
                          <MailIcon className="w-4 h-4" />
              </button>
              </div>

                      <div className="flex items-center space-x-1">
              <button
                          onClick={() => handleQuickAction(candidature.id, 'accepter')}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                          title="Accepter"
              >
                          <CheckSquare className="w-4 h-4" />
              </button>
                        
              <button
                          onClick={() => handleQuickAction(candidature.id, 'refuser')}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          title="Refuser"
              >
                          <XSquare className="w-4 h-4" />
              </button>
          </div>

                      {/* Actions principales */}
                      <div className="flex items-center space-x-2">
               <button
                          onClick={() => handleCandidatureDetail(candidature)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
               >
                          Détails
               </button>
                        
                        {!isDirecteur ? (
                          <select
                            value={candidature.statut_candidature || 'envoye'}
                            onChange={async (e) => {
                              const result = await updateStatutCandidature(candidature.id, e.target.value)
                              if (result.success) {
                                showMessage('Statut mis à jour avec succès')
                              } else {
                                showMessage(result.error || 'Erreur lors de la mise à jour', 'error')
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            {Object.entries(statusConfig).map(([status, config]) => (
                              <option key={status} value={status}>{config.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {statusConfig[candidature.statut_candidature || 'envoye']?.label || 'Envoyé'}
                          </span>
                        )}
                        
               {!isDirecteur && (
                 <button
                   onClick={async () => {
                     if (window.confirm('Êtes-vous sûr de vouloir supprimer cette candidature ?')) {
                       const result = await deleteCandidature(candidature.id)
                       if (result.success) {
                         showMessage('Candidature supprimée avec succès')
                       } else {
                         showMessage(result.error || 'Erreur lors de la suppression', 'error')
                       }
                     }
                   }}
                   className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                   title="Supprimer"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               )}
             </div>
                       </div>
                       </div>
                     </div>
              )
            })
             )}
           </div>
         </div>

      {/* Modal de détails de candidature */}
      {showCandidatureDetail && selectedCandidature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Détails de la candidature</h2>
                  <p className="text-gray-600 mt-1">
                    {selectedCandidature.entreprise_nom} - {selectedCandidature.poste}
                  </p>
                </div>
             <button
                  onClick={() => setShowCandidatureDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
             >
                  <X className="w-6 h-6" />
             </button>
                 </div>
               </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations de la candidature */}
               <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de la candidature</h3>
                  <div className="space-y-3">
               <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                      <p className="text-gray-900">{selectedCandidature.entreprise_nom}</p>
               </div>
                 <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                      <p className="text-gray-900">{selectedCandidature.poste}</p>
                 </div>
                 <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
                      <p className="text-gray-900">{selectedCandidature.type_contrat || 'Non spécifié'}</p>
                 </div>
               <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de candidature</label>
                      <p className="text-gray-900">
                        {selectedCandidature.date_candidature || 
                         new Date(selectedCandidature.created_at).toLocaleDateString('fr-FR')}
                      </p>
               </div>
               <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                      <p className="text-gray-900">{selectedCandidature.source_offre || 'Site web COP'}</p>
               </div>
                 <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        statusConfig[selectedCandidature.statut_candidature as CandidatureStatus]?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {statusConfig[selectedCandidature.statut_candidature as CandidatureStatus]?.label || 'En attente'}
                      </span>
                 </div>
                 </div>
               </div>

                {/* Informations du candidat */}
                 <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du candidat</h3>
                  <div className="space-y-3">
                 <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                      <p className="text-gray-900">{selectedCandidature.nom} {selectedCandidature.prenom}</p>
                 </div>
                 <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{selectedCandidature.email}</p>
                 </div>
                 <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <p className="text-gray-900">{selectedCandidature.telephone || 'Non renseigné'}</p>
                 </div>
               <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CV</label>
                      {selectedCandidature.cv_url ? (
                        <div className="flex space-x-2">
             <button
                            onClick={() => handleViewPdf(
                              selectedCandidature.cv_url, 
                              `${selectedCandidature.nom} ${selectedCandidature.prenom}`,
                              selectedCandidature.entreprise_nom
                            )}
                            className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Voir le CV
             </button>
             <button
                            onClick={() => handleViewCv(selectedCandidature.cv_url)}
                            className="text-green-600 hover:text-green-800 text-sm underline flex items-center"
             >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Ouvrir
             </button>
             <button
                            onClick={() => handleDownloadCv(
                              selectedCandidature.cv_url,
                              `${selectedCandidature.nom} ${selectedCandidature.prenom}`,
                              selectedCandidature.entreprise_nom
                            )}
                            className="text-purple-600 hover:text-purple-800 text-sm underline flex items-center"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Télécharger
             </button>
           </div>
                      ) : (
                        <p className="text-gray-500 text-sm">CV non disponible</p>
                      )}
               </div>
             </div>
               </div>
             </div>

              {/* Notes et feedback */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes et feedback</h3>
             <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes internes</label>
               <textarea
                    value={candidatureNotes}
                    onChange={(e) => setCandidatureNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Ajoutez vos notes sur cette candidature..."
                  />
               </div>
             </div>

              {/* Actions */}
           <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
             <button
                  onClick={() => setShowCandidatureDetail(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
             >
                  Fermer
             </button>
             <button
                  onClick={handleUpdateCandidatureNotes}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
             >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder les notes
             </button>
              </div>
           </div>
         </div>
       </div>
     )}

      {/* Modal de programmation d'entretien */}
      {showInterviewModal && selectedCandidature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold">Programmer un entretien</h2>
             <button
                  onClick={() => setShowInterviewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
             >
               <X className="w-5 h-5" />
             </button>
              </div>
           </div>

            <div className="p-6">
           <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Candidat</label>
                  <p className="text-gray-900">{selectedCandidature.nom} {selectedCandidature.prenom}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entreprise</label>
                  <p className="text-gray-900">{selectedCandidature.entreprise_nom} - {selectedCandidature.poste}</p>
                </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                 <input
                   type="date"
                      value={interviewData.date}
                      onChange={(e) => setInterviewData({...interviewData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure *</label>
                    <input
                      type="time"
                      value={interviewData.time}
                      onChange={(e) => setInterviewData({...interviewData, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type d'entretien</label>
                 <select
                    value={interviewData.type}
                    onChange={(e) => setInterviewData({...interviewData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="telephone">Téléphone</option>
                    <option value="video">Vidéo</option>
                    <option value="presentiel">Présentiel</option>
                 </select>
             </div>

             <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
               <textarea
                    value={interviewData.notes}
                    onChange={(e) => setInterviewData({...interviewData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                 rows={3}
                    placeholder="Notes sur l'entretien..."
               />
             </div>
           </div>

           <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
             <button
                  onClick={() => setShowInterviewModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
             >
               Annuler
             </button>
             <button
                  onClick={handleScheduleInterview}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
             >
                  <CalendarDays className="w-4 h-4 mr-2" />
               Programmer
             </button>
              </div>
           </div>
         </div>
       </div>
     )}

      {/* Modal visualiseur PDF */}
      {showPdfViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header du visualiseur */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-3">
                <FileTextIcon className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{pdfTitle}</h2>
                  <p className="text-sm text-gray-600">Visualiseur PDF intégré</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Contrôles de zoom */}
                <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-lg px-2 py-1">
             <button
                    onClick={() => setPdfScale(Math.max(0.5, pdfScale - 0.1))}
               className="p-1 hover:bg-gray-100 rounded"
                    title="Zoom arrière"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium min-w-[60px] text-center">
                    {Math.round(pdfScale * 100)}%
                  </span>
                  <button
                    onClick={() => setPdfScale(Math.min(3, pdfScale + 0.1))}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Zoom avant"
                  >
                    <ZoomIn className="w-4 h-4" />
             </button>
           </div>

                {/* Contrôles de rotation */}
                <button
                  onClick={() => setPdfRotation((pdfRotation + 90) % 360)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Rotation"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Bouton plein écran */}
                <button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <Maximize className="w-4 h-4" />
                </button>

                {/* Bouton fermer */}
                <button
                  onClick={() => setShowPdfViewer(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
               </div>
             </div>

            {/* Contenu PDF */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=${pdfScale * 100}`}
                className="w-full h-full border-0"
                title="Visualiseur PDF"
                style={{
                  transform: `rotate(${pdfRotation}deg)`,
                  transformOrigin: 'center center'
                }}
              />
           </div>

            {/* Footer avec actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Utilisez les contrôles ci-dessus pour naviguer dans le document
              </div>
              <div className="flex items-center space-x-2">
             <button
                  onClick={() => handleDownloadCv(pdfUrl, pdfTitle, '')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
             >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
             </button>
             <button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
             >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir dans un nouvel onglet
             </button>
              </div>
           </div>
         </div>
       </div>
     )}

          </div>
        )}

        {/* CV Connect Tab - Visible seulement pour les business_developer (admin) */}
        {activeTab === 'cv-connect' && isAdmin && (
          <div className="space-y-6">
            {/* CV Connect Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">CV Connect</h2>
                  <p className="text-gray-600">Gestion automatisée des CV des stagiaires</p>
                </div>
              </div>
            </div>

            {/* CV Connect Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gestion des permissions */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Users className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Gestion des permissions</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Accordez des permissions aux utilisateurs pour qu'ils puissent consulter les CV des stagiaires.
                </p>
                <Link
                  href="/cv-connect/admin"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Accéder à l'administration
                </Link>
              </div>

              {/* Formulaire public */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Upload className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Formulaire public</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Lien public pour que les stagiaires puissent déposer leur CV.
                </p>
                <Link
                  href="/cv-connect/public"
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Voir le formulaire
                </Link>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Comment utiliser CV Connect ?</h3>
              <div className="space-y-2 text-blue-800">
                <p>1. <strong>Administration :</strong> Gérez les permissions des utilisateurs qui peuvent consulter les CV</p>
                <p>2. <strong>Formulaire public :</strong> Partagez le lien avec les stagiaires pour qu'ils déposent leur CV</p>
                <p>3. <strong>Automatisation :</strong> Les CV sont automatiquement organisés par pôle et filière sur Google Drive</p>
              </div>
            </div>
          </div>
        )}

        {/* Assistance Conseiller Tab */}
        {activeTab === 'assistance-conseiller' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <HelpCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Interface Conseiller</h2>
                  <p className="text-gray-600">Gérez les demandes d'assistance qui vous sont assignées</p>
                </div>
              </div>
            </div>

            {/* Interface Conseiller */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Gestion des demandes d'assistance</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Accédez à votre interface personnalisée pour consulter et traiter les demandes d'assistance des stagiaires.
              </p>
              <Link
                href="/assistance-stagiaires/conseiller"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Accéder à mon interface
              </Link>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Comment utiliser l'interface conseiller ?</h3>
              <div className="space-y-2 text-blue-800">
                <p>1. <strong>Sélectionnez votre profil :</strong> Choisissez votre nom dans la liste des conseillers</p>
                <p>2. <strong>Consultez vos demandes :</strong> Visualisez toutes les demandes qui vous sont assignées</p>
                <p>3. <strong>Traitez les demandes :</strong> Prenez en charge, ajoutez des commentaires et marquez comme terminées</p>
              </div>
            </div>
          </div>
        )}

        {/* Assistance Admin Tab - Visible seulement pour les admins */}
        {activeTab === 'assistance-admin' && isAdmin && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Tableau de bord Administrateur</h2>
                  <p className="text-gray-600">Supervisez l'ensemble du système d'assistance aux stagiaires</p>
                </div>
              </div>
            </div>

            {/* Interface Admin */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Statistiques et supervision</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Accédez au tableau de bord administrateur pour consulter les statistiques globales et superviser toutes les demandes d'assistance.
              </p>
              <Link
                href="/assistance-stagiaires/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Accéder au tableau de bord
              </Link>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Fonctionnalités administrateur</h3>
              <div className="space-y-2 text-blue-800">
                <p>1. <strong>Statistiques globales :</strong> Consultez les indicateurs de performance du système</p>
                <p>2. <strong>Supervision :</strong> Visualisez toutes les demandes et leur statut</p>
                <p>3. <strong>Analyse :</strong> Suivez l'évolution des demandes par type et conseiller</p>
              </div>
            </div>
          </div>
        )}

   </div>
 )
}