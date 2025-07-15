'use client'

import React, { useState } from 'react'
import { useCVEnvoyes } from '@/hooks/useCVEnvoyes'
import { useSettings } from '@/hooks/useSettings'
import { 
  Mail, Plus, X, Save, Edit3, Trash2, Eye, Clock, CheckCircle, AlertTriangle,
  Search, Filter, User, Building2, Calendar, Target, Phone, MapPin,
  FileText, Send, MessageSquare, Bell, TrendingUp, Award, ChevronRight,
  ChevronDown, Star, Flag, Download, ExternalLink
} from 'lucide-react'
import DemandesCVPage from '../demandes-cv/page';

export default function CVEnvoyesPage() {
  const {
    cvEnvoyes, cvDetail, suiviEvents, relances, demandes, loading, error,
    loadCVDetail, envoyerCV, changerStatutCV, ajouterEvenementSuivi,
    planifierRelance, supprimerCV
  } = useCVEnvoyes()

  const { filieres, poles } = useSettings()

  const [activeView, setActiveView] = useState<'liste' | 'detail'>('liste')
  const [showForm, setShowForm] = useState(false)
  const [showSuiviForm, setShowSuiviForm] = useState(false)
  const [showRelanceForm, setShowRelanceForm] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [suiviFormData, setSuiviFormData] = useState<any>({})
  const [relanceFormData, setRelanceFormData] = useState<any>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [expandedCV, setExpandedCV] = useState<string | null>(null)
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)
  const [activeTab, setActiveTab] = useState<'envoyes' | 'demandes'>('envoyes');

  const statutsCV = ['envoye', 'recu', 'preselection', 'entretien', 'accepte', 'refuse', 'sans_reponse']
  const methodesEnvoi = ['email', 'main_propre', 'courrier', 'plateforme', 'telephone']
  const typesEvenement = ['envoi', 'reception', 'appel', 'entretien', 'relance', 'decision', 'autre']

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleCVClick = async (cvId: string) => {
    await loadCVDetail(cvId)
    setActiveView('detail')
  }

  const handleEnvoyerCV = async () => {
    if (!formData.demande_id || !formData.nom_stagiaire || !formData.entreprise_nom) {
      showMessage('Veuillez remplir les champs obligatoires', 'error')
      return
    }

    const result = await envoyerCV(formData)
    if (result.success) {
      showMessage('CV envoyé avec succès!')
      setShowForm(false)
      setFormData({})
    } else {
      showMessage(result.error || 'Erreur lors de l\'envoi', 'error')
    }
  }

  const handleAjouterSuivi = async () => {
    if (!suiviFormData.titre_evenement || !suiviFormData.type_evenement) {
      showMessage('Veuillez remplir les champs obligatoires', 'error')
      return
    }

    const result = await ajouterEvenementSuivi(cvDetail.id, suiviFormData)
    if (result.success) {
      showMessage('Événement ajouté!')
      setShowSuiviForm(false)
      setSuiviFormData({})
    } else {
      showMessage(result.error || 'Erreur lors de l\'ajout', 'error')
    }
  }

  const handlePlanifierRelance = async () => {
    if (!relanceFormData.date_relance) {
      showMessage('Veuillez sélectionner une date de relance', 'error')
      return
    }

    const result = await planifierRelance(cvDetail.id, relanceFormData)
    if (result.success) {
      showMessage('Relance planifiée!')
      setShowRelanceForm(false)
      setRelanceFormData({})
    } else {
      showMessage(result.error || 'Erreur lors de la planification', 'error')
    }
  }

  const filteredCVs = cvEnvoyes.filter(cv => {
    const matchesSearch = cv.nom_stagiaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cv.entreprise_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cv.poste_vise.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatut = filterStatut === 'tous' || cv.statut_cv === filterStatut
    return matchesSearch && matchesStatut
  })

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'envoye': return 'bg-blue-100 text-blue-800'
      case 'recu': return 'bg-purple-100 text-purple-800'
      case 'preselection': return 'bg-yellow-100 text-yellow-800'
      case 'entretien': return 'bg-orange-100 text-orange-800'
      case 'accepte': return 'bg-green-100 text-green-800'
      case 'refuse': return 'bg-red-100 text-red-800'
      case 'sans_reponse': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'envoye': return 'Envoyé'
      case 'recu': return 'Reçu'
      case 'preselection': return 'Présélection'
      case 'entretien': return 'Entretien'
      case 'accepte': return 'Accepté'
      case 'refuse': return 'Refusé'
      case 'sans_reponse': return 'Sans réponse'
      default: return statut
    }
  }

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'envoye': return Send
      case 'recu': return CheckCircle
      case 'preselection': return Eye
      case 'entretien': return User
      case 'accepte': return Award
      case 'refuse': return X
      case 'sans_reponse': return Clock
      default: return FileText
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Mail className="w-8 h-8 animate-bounce text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des CV envoyés...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Onglets */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'envoyes' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'}`}
          onClick={() => setActiveTab('envoyes')}
        >
          CV Envoyés
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'demandes' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'}`}
          onClick={() => setActiveTab('demandes')}
        >
          Demandes de CV
        </button>
      </div>

      {/* Affichage conditionnel */}
      {activeTab === 'envoyes' ? (
        <>
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

          {activeView === 'liste' && (
            <>
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">CV Envoyés</h1>
                  <p className="text-gray-600">Suivi des CV envoyés aux entreprises</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({})
                    setShowForm(true)
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Envoyer CV
                </button>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <Mail className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Envoyés</p>
                      <p className="text-2xl font-bold">{cvEnvoyes.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">En attente</p>
                      <p className="text-2xl font-bold">
                        {cvEnvoyes.filter(cv => ['envoye', 'recu', 'sans_reponse'].includes(cv.statut_cv)).length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <User className="w-8 h-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Entretiens</p>
                      <p className="text-2xl font-bold">
                        {cvEnvoyes.filter(cv => cv.statut_cv === 'entretien').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <Award className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Acceptés</p>
                      <p className="text-2xl font-bold">
                        {cvEnvoyes.filter(cv => cv.statut_cv === 'accepte').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtres */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Rechercher par stagiaire, entreprise, poste..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <select
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tous">Tous les statuts</option>
                    {statutsCV.map(statut => (
                      <option key={statut} value={statut}>{getStatutLabel(statut)}</option>
                    ))}
                  </select>
                  <div className="text-sm text-gray-600 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    {filteredCVs.length} CV trouvé{filteredCVs.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Liste des CV */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  {filteredCVs.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm || filterStatut !== 'tous' ? 'Aucun CV trouvé' : 'Aucun CV envoyé'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || filterStatut !== 'tous' 
                          ? 'Aucun CV ne correspond à vos critères'
                          : 'Commencez par envoyer votre premier CV'
                        }
                      </p>
                      {!searchTerm && filterStatut === 'tous' && (
                        <button
                          onClick={() => setShowForm(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Envoyer un CV
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredCVs.map(cv => {
                        const StatutIcon = getStatutIcon(cv.statut_cv)
                        const isExpanded = expandedCV === cv.id
                        
                        return (
                          <div key={cv.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div 
                              className="p-4 hover:bg-gray-50 cursor-pointer"
                              onClick={() => setExpandedCV(isExpanded ? null : cv.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <StatutIcon className="w-5 h-5 text-gray-600" />
                                    <h3 className="text-lg font-medium text-gray-900">
                                      {cv.nom_stagiaire} {cv.prenom_stagiaire}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(cv.statut_cv)}`}>
                                      {getStatutLabel(cv.statut_cv)}
                                    </span>
                                    {cv.jours_depuis_envoi > 7 && cv.statut_cv === 'envoye' && (
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        {cv.jours_depuis_envoi}j
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <Building2 className="w-4 h-4 mr-1" />
                                      {cv.entreprise_nom}
                                    </div>
                                    <div className="flex items-center">
                                      <Target className="w-4 h-4 mr-1" />
                                      {cv.poste_vise}
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      {new Date(cv.date_envoi).toLocaleDateString('fr-FR')}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCVClick(cv.id)
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    title="Voir détails"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                  >
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Détails expandus */}
                            {isExpanded && (
                              <div className="border-t border-gray-200 p-4 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Informations candidat</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      {cv.email_stagiaire && (
                                        <div className="flex items-center">
                                          <Mail className="w-4 h-4 mr-2" />
                                          {cv.email_stagiaire}
                                        </div>
                                      )}
                                      {cv.telephone_stagiaire && (
                                        <div className="flex items-center">
                                          <Phone className="w-4 h-4 mr-2" />
                                          {cv.telephone_stagiaire}
                                        </div>
                                      )}
                                      {cv.filiere_nom && (
                                        <div>Filière: {cv.filiere_nom}</div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Suivi</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      <div>Méthode: {cv.methode_envoi}</div>
                                      <div>Envoyé par: {cv.envoye_par}</div>
                                      {cv.derniere_activite && (
                                        <div>Dernière activité: {cv.derniere_activite}</div>
                                      )}
                                      {cv.nombre_relances > 0 && (
                                        <div>{cv.nombre_relances} relance{cv.nombre_relances > 1 ? 's' : ''}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Actions rapides */}
                                <div className="flex items-center space-x-2">
                                  {cv.statut_cv === 'envoye' && (
                                    <button
                                      onClick={() => changerStatutCV(cv.id, 'recu')}
                                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200"
                                    >
                                      Marquer reçu
                                    </button>
                                  )}
                                  {cv.statut_cv === 'recu' && (
                                    <button
                                      onClick={() => changerStatutCV(cv.id, 'entretien')}
                                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200"
                                    >
                                      Entretien planifié
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleCVClick(cv.id)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                                  >
                                    Voir détails complets
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeView === 'detail' && cvDetail && (
            <div className="space-y-6">
              {/* Header détail */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setActiveView('liste')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {cvDetail.nom_stagiaire} {cvDetail.prenom_stagiaire}
                    </h1>
                    <p className="text-gray-600">{cvDetail.poste_vise} chez {cvDetail.entreprise_nom}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSuiviForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter suivi
                  </button>
                  <button
                    onClick={() => setShowRelanceForm(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Planifier relance
                  </button>
                </div>
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du CV</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Candidat</label>
                        <p className="text-gray-900">{cvDetail.nom_stagiaire} {cvDetail.prenom_stagiaire}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{cvDetail.email_stagiaire || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Entreprise</label>
                        <p className="text-gray-900">{cvDetail.entreprise_nom}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Poste visé</label>
                        <p className="text-gray-900">{cvDetail.poste_vise}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date d'envoi</label>
                        <p className="text-gray-900">{new Date(cvDetail.date_envoi).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Statut actuel</label>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(cvDetail.statut_cv)}`}>
                          {getStatutLabel(cvDetail.statut_cv)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Actions rapides */}
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Actions rapides</h3>
                    <div className="space-y-2">
                      <select
                        value={cvDetail.statut_cv}
                        onChange={(e) => changerStatutCV(cvDetail.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        {statutsCV.map(statut => (
                          <option key={statut} value={statut}>{getStatutLabel(statut)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Statistiques rapides */}
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jours depuis envoi</span>
                        <span className="font-medium">{cvDetail.jours_depuis_envoi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Événements de suivi</span>
                        <span className="font-medium">{suiviEvents.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Relances</span>
                        <span className="font-medium">{relances.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline des événements */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline des événements</h3>
                  {suiviEvents.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">Aucun événement de suivi enregistré</p>
                  ) : (
                    <div className="space-y-4">
                      {suiviEvents.map((event, index) => (
                        <div key={event.id} className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{event.titre_evenement}</h4>
                              <span className="text-sm text-gray-500">
                                {new Date(event.date_evenement).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Type: {event.type_evenement}</span>
                              {event.enregistre_par && <span>Par: {event.enregistre_par}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Formulaire d'envoi de CV */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Envoyer un CV</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informations candidat */}
                  <div className="space-y-4">
<h3 className="font-medium text-gray-900 border-b pb-2">Informations candidat</h3>
                   
                   <div>
                     <label className="block text-sm font-medium mb-2">Demande de CV liée</label>
                     <select
                       value={formData.demande_id || ''}
                       onChange={(e) => {
                         const selectedDemande = demandes.find(d => d.id === e.target.value)
                         setFormData(prev => ({ 
                           ...prev, 
                           demande_id: e.target.value,
                           entreprise_nom: selectedDemande?.nom_entreprise || '',
                           entreprise_contact: selectedDemande?.contact_nom || '',
                           entreprise_email: selectedDemande?.contact_email || '',
                           poste_vise: selectedDemande?.poste_recherche || ''
                         }))
                       }}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     >
                       <option value="">Sélectionner une demande</option>
                       {demandes.map(demande => (
                         <option key={demande.id} value={demande.id}>
                           {demande.nom_entreprise} - {demande.poste_recherche}
                         </option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Nom du stagiaire *</label>
                     <input
                       type="text"
                       value={formData.nom_stagiaire || ''}
                       onChange={(e) => setFormData(prev => ({ ...prev, nom_stagiaire: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       placeholder="Nom"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Prénom</label>
                     <input
                       type="text"
                       value={formData.prenom_stagiaire || ''}
                       onChange={(e) => setFormData(prev => ({ ...prev, prenom_stagiaire: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       placeholder="Prénom"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Email du stagiaire</label>
                     <input
                       type="email"
                       value={formData.email_stagiaire || ''}
                       onChange={(e) => setFormData(prev => ({ ...prev, email_stagiaire: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       placeholder="email@stagiaire.com"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Téléphone</label>
                     <input
                       type="tel"
                       value={formData.telephone_stagiaire || ''}
                       onChange={(e) => setFormData(prev => ({ ...prev, telephone_stagiaire: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       placeholder="06 XX XX XX XX"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium mb-2">Pôle</label>
                       <select
                         value={formData.pole_id || ''}
                         onChange={(e) => setFormData(prev => ({ ...prev, pole_id: e.target.value }))}
                         className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       >
                         <option value="">Tous pôles</option>
                         {poles.filter(p => p.actif).map(pole => (
                           <option key={pole.id} value={pole.id}>{pole.nom}</option>
                         ))}
                       </select>
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium mb-2">Filière</label>
                       <select
                         value={formData.filiere_id || ''}
                         onChange={(e) => setFormData(prev => ({ ...prev, filiere_id: e.target.value }))}
                         className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       >
                         <option value="">Toutes filières</option>
                         {filieres.filter(f => f.actif && (!formData.pole_id || f.pole_id === formData.pole_id)).map(filiere => (
                           <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                         ))}
                       </select>
                     </div>
                   </div>
                 </div>

                 {/* Informations entreprise et envoi */}
                 <div className="space-y-4">
                   <h3 className="font-medium text-gray-900 border-b pb-2">Informations entreprise</h3>
                   
                   <div>
                     <label className="block text-sm font-medium mb-2">Nom de l'entreprise *</label>
                     <input
                       type="text"
                       value={formData.entreprise_nom || ''}
                       onChange={(e) => setFormData(prev => ({ ...prev, entreprise_nom: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       placeholder="Nom de l'entreprise"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Contact entreprise</label>
                     <input
                       type="text"
                       value={formData.entreprise_contact || ''}
                       onChange={(e) => setFormData(prev => ({ ...prev, entreprise_contact: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       placeholder="Nom du contact"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Email entreprise</label>
                     <input
                       type="email"
                       value={formData.entreprise_email || ''}
                       onChange={(e) => setFormData(prev => ({ ...prev, entreprise_email: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       placeholder="contact@entreprise.com"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Poste visé *</label>
                     <input
                       type="text"
                       value={formData.poste_vise || ''}
                       onChange={(e) => setFormData(prev => ({ ...prev, poste_vise: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       placeholder="Intitulé du poste"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium mb-2">Date d'envoi</label>
                       <input
                         type="date"
                         value={formData.date_envoi || new Date().toISOString().split('T')[0]}
                         onChange={(e) => setFormData(prev => ({ ...prev, date_envoi: e.target.value }))}
                         className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       />
                     </div>

                     <div>
                       <label className="block text-sm font-medium mb-2">Méthode d'envoi</label>
                       <select
                         value={formData.methode_envoi || 'email'}
                         onChange={(e) => setFormData(prev => ({ ...prev, methode_envoi: e.target.value }))}
                         className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       >
                         {methodesEnvoi.map(methode => (
                           <option key={methode} value={methode}>
                             {methode === 'email' ? 'Email' :
                              methode === 'main_propre' ? 'Main propre' :
                              methode === 'courrier' ? 'Courrier' :
                              methode === 'plateforme' ? 'Plateforme' : 'Téléphone'}
                           </option>
                         ))}
                       </select>
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Version du CV</label>
                     <input
                       type="text"
                       value={formData.cv_version || ''}
                       onChange={(e) => setFormData(prev => ({ ...prev, cv_version: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       placeholder="Ex: CV_Nom_v2.pdf"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Envoyé par</label>
                     <input
                       type="text"
                       value={formData.envoye_par || 'Équipe COP'}
                       onChange={(e) => setFormData(prev => ({ ...prev, envoye_par: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       placeholder="Nom du responsable"
                     />
                   </div>

                   <div>
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={formData.lettre_motivation || false}
                         onChange={(e) => setFormData(prev => ({ ...prev, lettre_motivation: e.target.checked }))}
                         className="mr-2"
                       />
                       Lettre de motivation incluse
                     </label>
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Date de réponse attendue</label>
                     <input
                       type="date"
                       value={formData.date_reponse_attendue || ''}
                       onChange={(e) => setFormData(prev => ({ ...prev, date_reponse_attendue: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                 </div>
               </div>

               <div className="mt-6">
                 <label className="block text-sm font-medium mb-2">Notes d'envoi</label>
                 <textarea
                   value={formData.notes_envoi || ''}
                   onChange={(e) => setFormData(prev => ({ ...prev, notes_envoi: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   rows={3}
                   placeholder="Notes sur l'envoi, contexte, particularités..."
                 />
               </div>

               {/* Boutons */}
               <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                 <button
                   onClick={() => setShowForm(false)}
                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
                 >
                   Annuler
                 </button>
                 <button
                   onClick={handleEnvoyerCV}
                   className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                 >
                   <Send className="w-4 h-4 mr-2" />
                   Envoyer CV
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Formulaire d'ajout d'événement de suivi */}
         {showSuiviForm && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold">Ajouter un événement de suivi</h2>
                 <button
                   onClick={() => setShowSuiviForm(false)}
                   className="p-1 hover:bg-gray-100 rounded"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>

               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium mb-2">Type d'événement *</label>
                     <select
                       value={suiviFormData.type_evenement || ''}
                       onChange={(e) => setSuiviFormData(prev => ({ ...prev, type_evenement: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     >
                       <option value="">Sélectionner</option>
                       {typesEvenement.map(type => (
                         <option key={type} value={type}>
                           {type === 'envoi' ? 'Envoi' :
                            type === 'reception' ? 'Réception' :
                            type === 'appel' ? 'Appel téléphonique' :
                            type === 'entretien' ? 'Entretien' :
                            type === 'relance' ? 'Relance' :
                            type === 'decision' ? 'Décision' : 'Autre'}
                         </option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Date *</label>
                     <input
                       type="date"
                       value={suiviFormData.date_evenement || new Date().toISOString().split('T')[0]}
                       onChange={(e) => setSuiviFormData(prev => ({ ...prev, date_evenement: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium mb-2">Titre de l'événement *</label>
                   <input
                     type="text"
                     value={suiviFormData.titre_evenement || ''}
                     onChange={(e) => setSuiviFormData(prev => ({ ...prev, titre_evenement: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     placeholder="Ex: Appel de suivi, Entretien programmé..."
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium mb-2">Description</label>
                   <textarea
                     value={suiviFormData.description || ''}
                     onChange={(e) => setSuiviFormData(prev => ({ ...prev, description: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     rows={3}
                     placeholder="Détails de l'événement..."
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium mb-2">Contact entreprise</label>
                     <input
                       type="text"
                       value={suiviFormData.contact_entreprise || ''}
                       onChange={(e) => setSuiviFormData(prev => ({ ...prev, contact_entreprise: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                       placeholder="Nom du contact"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium mb-2">Méthode de contact</label>
                     <select
                       value={suiviFormData.methode_contact || ''}
                       onChange={(e) => setSuiviFormData(prev => ({ ...prev, methode_contact: e.target.value }))}
                       className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     >
                       <option value="">Sélectionner</option>
                       <option value="telephone">Téléphone</option>
                       <option value="email">Email</option>
                       <option value="presential">Présentiel</option>
                       <option value="visio">Visioconférence</option>
                     </select>
                   </div>
                 </div>

                 <div>
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={suiviFormData.resultat_positif || false}
                       onChange={(e) => setSuiviFormData(prev => ({ ...prev, resultat_positif: e.target.checked }))}
                       className="mr-2"
                     />
                     Résultat positif
                   </label>
                 </div>
               </div>

               {/* Boutons */}
               <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                 <button
                   onClick={() => setShowSuiviForm(false)}
                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
                 >
                   Annuler
                 </button>
                 <button
                   onClick={handleAjouterSuivi}
                   className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
                 >
                   <Save className="w-4 h-4 mr-2" />
                   Ajouter
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Formulaire de planification de relance */}
         {showRelanceForm && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg p-6 w-full max-w-md">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold">Planifier une relance</h2>
                 <button
                   onClick={() => setShowRelanceForm(false)}
                   className="p-1 hover:bg-gray-100 rounded"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>

               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium mb-2">Date de relance *</label>
                   <input
                     type="date"
                     value={relanceFormData.date_relance || ''}
                     onChange={(e) => setRelanceFormData(prev => ({ ...prev, date_relance: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium mb-2">Type de relance</label>
                   <select
                     value={relanceFormData.type_relance || 'email'}
                     onChange={(e) => setRelanceFormData(prev => ({ ...prev, type_relance: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="email">Email</option>
                     <option value="telephone">Téléphone</option>
                     <option value="visite">Visite</option>
                     <option value="courrier">Courrier</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium mb-2">Objet de la relance</label>
                   <input
                     type="text"
                     value={relanceFormData.objet_relance || ''}
                     onChange={(e) => setRelanceFormData(prev => ({ ...prev, objet_relance: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     placeholder="Suivi candidature de..."
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium mb-2">Message</label>
                   <textarea
                     value={relanceFormData.message_relance || ''}
                     onChange={(e) => setRelanceFormData(prev => ({ ...prev, message_relance: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     rows={3}
                     placeholder="Message de relance..."
                   />
                 </div>
               </div>

               {/* Boutons */}
               <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                 <button
                   onClick={() => setShowRelanceForm(false)}
                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
                 >
                   Annuler
                 </button>
                 <button
                   onClick={handlePlanifierRelance}
                   className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 flex items-center"
                 >
                   <Bell className="w-4 h-4 mr-2" />
                   Planifier
                 </button>
               </div>
             </div>
           </div>
         )}
       </>
      ) : (
        <DemandesCVPage />
      )}
    </div>
  )
}