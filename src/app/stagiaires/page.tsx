'use client'

import React, { useState } from 'react'
import { useStagiaires } from '@/hooks/useStagiaires'
import { useSettings } from '@/hooks/useSettings'
import { useCandidatures } from '@/hooks/useCandidatures'
import { 
  GraduationCap, Plus, X, Save, Edit3, Trash2, Eye, Clock, CheckCircle, AlertTriangle,
  Search, Filter, User, Mail, Phone, MapPin, Calendar, Target, Award,
  ChevronRight, ChevronDown, Star, Flag, Download, ExternalLink, Users,
  Briefcase, FileText, MessageSquare, TrendingUp, UserCheck, Building2,
  Send, Printer
} from 'lucide-react'

export default function StagiairesPage() {
  const {
    stagiaires, stagiaireDetail, entretiens, candidatures, competences, loading, error,
    loadStagiaireDetail, saveStagiaire, programmerEntretien, ajouterCandidature,
    updateStatutStagiaire, deleteStagiaire
  } = useStagiaires()

  const { filieres, poles } = useSettings()
  const { candidatures: candidaturesStagiaires, updateStatutCandidature, deleteCandidature } = useCandidatures()

  const [activeView, setActiveView] = useState<'liste' | 'detail' | 'candidatures'>('liste')
  const [candidatureFilter, setCandidatureFilter] = useState('tous')
  const [candidatureSearch, setCandidatureSearch] = useState('')
  const [selectedCandidature, setSelectedCandidature] = useState<any>(null)
  const [showCandidatureDetail, setShowCandidatureDetail] = useState(false)
  const [candidatureNotes, setCandidatureNotes] = useState('')
  const [showCvModal, setShowCvModal] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showEntretienForm, setShowEntretienForm] = useState(false)
  const [showCandidatureForm, setShowCandidatureForm] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [entretienFormData, setEntretienFormData] = useState<Record<string, unknown>>({})
  const [candidatureFormData, setCandidatureFormData] = useState<Record<string, unknown>>({})
  const [importData, setImportData] = useState('')
  const [importFiliere, setImportFiliere] = useState('')
  const [importPole, setImportPole] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [filterRecherche, setFilterRecherche] = useState('tous')
  const [expandedStagiaire, setExpandedStagiaire] = useState<string | null>(null)
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)

  const statutsStagiaire = ['actif', 'diplome', 'abandonne', 'suspendu']
  const statutsRecherche = ['en_formation', 'en_recherche', 'en_stage', 'employe', 'inactif']
  const typesEntretien = ['initial', 'suivi', 'bilan', 'orientation', 'crise']
  const niveauxFormation = ['Technicien Spécialisé', 'Technicien', 'Qualification', 'Spécialisation']

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // Ouvrir les détails d'une candidature
  const handleCandidatureDetail = (candidature: any) => {
    console.log('Clic sur candidature:', candidature)
    console.log('État avant:', { showCandidatureDetail, selectedCandidature })
    
    setSelectedCandidature(candidature)
    setCandidatureNotes(candidature.feedback_entreprise || '')
    setShowCandidatureDetail(true)
    
    console.log('Modal ouverte:', true)
    
    // Debug: vérifier l'état après
    setTimeout(() => {
      console.log('État après:', { showCandidatureDetail, selectedCandidature })
    }, 100)
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

  // Ouvrir le CV dans une nouvelle fenêtre
  const handleViewCv = (cvUrl: string) => {
    if (cvUrl) {
      window.open(cvUrl, '_blank')
    } else {
      showMessage('CV non disponible', 'error')
    }
  }

  // Imprimer le CV
  const handlePrintCv = (cvUrl: string) => {
    if (cvUrl) {
      const printWindow = window.open(cvUrl, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    } else {
      showMessage('CV non disponible', 'error')
    }
  }

  const handleStagiaireClick = async (stagiaireId: string) => {
    await loadStagiaireDetail(stagiaireId)
    setActiveView('detail')
  }

  const handleSaveStagiaire = async () => {
    if (!formData.nom || !formData.prenom) {
      showMessage('Veuillez remplir les champs obligatoires', 'error')
      return
    }

    const result = await saveStagiaire(formData)
    if (result.success) {
      showMessage('Stagiaire sauvegardé avec succès!')
      setShowForm(false)
      setFormData({})
    } else {
      showMessage(result.error || 'Erreur lors de la sauvegarde', 'error')
    }
  }

  const handleProgrammerEntretien = async () => {
    if (!entretienFormData.date_entretien || !entretienFormData.conseiller_cop) {
      showMessage('Veuillez remplir les champs obligatoires', 'error')
      return
    }

    const result = await programmerEntretien(stagiaireDetail.id, entretienFormData)
    if (result.success) {
      showMessage('Entretien programmé!')
      setShowEntretienForm(false)
      setEntretienFormData({})
    } else {
      showMessage(result.error || 'Erreur lors de la programmation', 'error')
    }
  }

  const handleAjouterCandidature = async () => {
    if (!candidatureFormData.entreprise_nom || !candidatureFormData.poste) {
      showMessage('Veuillez remplir les champs obligatoires', 'error')
      return
    }

    const result = await ajouterCandidature(stagiaireDetail.id, candidatureFormData)
    if (result.success) {
      showMessage('Candidature ajoutée!')
      setShowCandidatureForm(false)
      setCandidatureFormData({})
    } else {
      showMessage(result.error || 'Erreur lors de l\'ajout', 'error')
    }
  }

  const handleImportStagiaires = async () => {
    if (!importData.trim() || !importFiliere) {
      showMessage('Veuillez remplir les champs obligatoires', 'error')
      return
    }

    try {
      const lignes = importData.trim().split('\n')
      const stagiairesParsed = lignes.map((ligne, index) => {
        const elements = ligne.split('\t') // Séparateur tabulation (Excel/CSV)
        
        if (elements.length < 3) {
          throw new Error(`Ligne ${index + 1}: Format incorrect. Attendu: Nom[TAB]Prénom[TAB]Email[TAB]Téléphone`)
        }

        return {
          nom: elements[0]?.trim(),
          prenom: elements[1]?.trim(),
          email_personnel: elements[2]?.trim(),
          telephone_portable: elements[3]?.trim() || '',
          filiere_id: importFiliere,
          pole_id: importPole,
          niveau_formation: 'Technicien Spécialisé',
          annee_formation: '1ère année',
          statut_stagiaire: 'actif',
          statut_recherche: 'en_formation',
          numero_stagiaire: `ST${new Date().getFullYear()}${String(index + 1).padStart(3, '0')}`
        }
      })

      console.log('📊 Import de', stagiairesParsed.length, 'stagiaires')

      // Sauvegarder chaque stagiaire
      let successes = 0
      let errors = 0

      for (const stagiaireData of stagiairesParsed) {
        const result = await saveStagiaire(stagiaireData)
        if (result.success) {
          successes++
        } else {
          errors++
          console.error('Erreur import:', stagiaireData.nom, result.error)
        }
      }

      showMessage(`Import terminé: ${successes} créés, ${errors} erreurs`)
      setShowImportForm(false)
      setImportData('')
      setImportFiliere('')
      setImportPole('')
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        showMessage('Erreur lors de l\'import: ' + err.message, 'error')
      } else {
        showMessage('Erreur lors de l\'import: Type inconnu', 'error')
      }
    }
  }

  const filteredStagiaires = stagiaires.filter(stagiaire => {
    const matchesSearch = stagiaire.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stagiaire.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stagiaire.email_personnel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stagiaire.numero_stagiaire?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatut = filterStatut === 'tous' || stagiaire.statut_stagiaire === filterStatut
    const matchesRecherche = filterRecherche === 'tous' || stagiaire.statut_recherche === filterRecherche
    return matchesSearch && matchesStatut && matchesRecherche
  })

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-800'
      case 'diplome': return 'bg-blue-100 text-blue-800'
      case 'abandonne': return 'bg-red-100 text-red-800'
      case 'suspendu': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRechercheColor = (statut: string) => {
    switch (statut) {
      case 'en_formation': return 'bg-purple-100 text-purple-800'
      case 'en_recherche': return 'bg-orange-100 text-orange-800'
      case 'en_stage': return 'bg-yellow-100 text-yellow-800'
      case 'employe': return 'bg-green-100 text-green-800'
      case 'inactif': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'actif': return 'Actif'
      case 'diplome': return 'Diplômé'
      case 'abandonne': return 'Abandon'
      case 'suspendu': return 'Suspendu'
      case 'en_formation': return 'En formation'
      case 'en_recherche': return 'En recherche'
      case 'en_stage': return 'En stage'
      case 'employe': return 'Employé'
      case 'inactif': return 'Inactif'
      default: return statut
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-8 h-8 animate-bounce text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des stagiaires...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Stagiaires</h1>
              <p className="text-gray-600">Suivi et accompagnement des stagiaires</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImportForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Import en masse
              </button>
              <button
                onClick={() => {
                  setFormData({})
                  setShowForm(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Stagiaire
              </button>
            </div>
          </div>

          {/* Navigation par onglets */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveView('liste')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'liste'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Liste des stagiaires
              </button>
              <button
                onClick={() => setActiveView('candidatures')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'candidatures'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Candidatures reçues ({candidaturesStagiaires.length})
              </button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <GraduationCap className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Stagiaires</p>
                  <p className="text-2xl font-bold">{stagiaires.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Actifs</p>
                  <p className="text-2xl font-bold">
                    {stagiaires.filter(s => s.statut_stagiaire === 'actif').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">En recherche</p>
                  <p className="text-2xl font-bold">
                    {stagiaires.filter(s => s.statut_recherche === 'en_recherche').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Diplômés</p>
                  <p className="text-2xl font-bold">
                    {stagiaires.filter(s => s.statut_stagiaire === 'diplome').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Briefcase className="w-8 h-8 text-emerald-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Employés</p>
                  <p className="text-2xl font-bold">
                    {stagiaires.filter(s => s.statut_recherche === 'employe').length}
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
                    placeholder="Rechercher par nom, email, numéro..."
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
                {statutsStagiaire.map(statut => (
                  <option key={statut} value={statut}>{getStatutLabel(statut)}</option>
                ))}
              </select>
              <select
                value={filterRecherche}
                onChange={(e) => setFilterRecherche(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Toutes recherches</option>
                {statutsRecherche.map(statut => (
                  <option key={statut} value={statut}>{getStatutLabel(statut)}</option>
                ))}
              </select>
              <div className="text-sm text-gray-600 flex items-center">
                <GraduationCap className="w-4 h-4 mr-2" />
                {filteredStagiaires.length} stagiaire{filteredStagiaires.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Liste des stagiaires */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              {filteredStagiaires.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || filterStatut !== 'tous' || filterRecherche !== 'tous' 
                      ? 'Aucun stagiaire trouvé' 
                      : 'Aucun stagiaire enregistré'
                    }
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterStatut !== 'tous' || filterRecherche !== 'tous' 
                      ? 'Aucun stagiaire ne correspond à vos critères'
                      : 'Commencez par enregistrer votre premier stagiaire'
                    }
                  </p>
                  {!searchTerm && filterStatut === 'tous' && filterRecherche === 'tous' && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Ajouter un stagiaire
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStagiaires.map(stagiaire => {
                    const isExpanded = expandedStagiaire === stagiaire.id
                    
                    return (
                      <div key={stagiaire.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div 
                          className="p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedStagiaire(isExpanded ? null : stagiaire.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <User className="w-5 h-5 text-gray-600" />
                                <h3 className="text-lg font-medium text-gray-900">
                                  {stagiaire.nom} {stagiaire.prenom}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(stagiaire.statut_stagiaire)}`}>
                                  {getStatutLabel(stagiaire.statut_stagiaire)}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRechercheColor(stagiaire.statut_recherche)}`}>
                                  {getStatutLabel(stagiaire.statut_recherche)}
                                </span>
                                {stagiaire.numero_stagiaire && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {stagiaire.numero_stagiaire}
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <GraduationCap className="w-4 h-4 mr-1" />
                                  {stagiaire.filiere_nom || 'Filière non définie'}
                                </div>
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-1" />
                                  {stagiaire.email_personnel || 'Email non renseigné'}
                                </div>
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-1" />
                                  {stagiaire.telephone_portable || 'Téléphone non renseigné'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStagiaireClick(stagiaire.id)
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Voir détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFormData(stagiaire)
                                  setShowForm(true)
                                }}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                title="Modifier"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (window.confirm(`Supprimer le stagiaire "${stagiaire.nom} ${stagiaire.prenom}" ?\n\nCette action ne supprime pas définitivement mais désactive le stagiaire.`)) {
                                    deleteStagiaire(stagiaire.id)
                                    showMessage('Stagiaire supprimé!')
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
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
                                <h4 className="font-medium text-gray-900 mb-2">Formation</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <div>Niveau: {stagiaire.niveau_formation || 'Non défini'}</div>
                                  <div>Année: {stagiaire.annee_formation || 'Non définie'}</div>
                                  <div>Pôle: {stagiaire.pole_nom || 'Non défini'}</div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Activité</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <div>Candidatures: {stagiaire.nombre_candidatures || 0}</div>
                                  <div>CV envoyés: {stagiaire.cv_envoyes_systeme || 0}</div>
                                  {stagiaire.dernier_entretien_date && (
                                    <div>Dernier entretien: {new Date(stagiaire.dernier_entretien_date).toLocaleDateString('fr-FR')}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {stagiaire.objectif_professionnel && (
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-2">Objectif professionnel</h4>
                                <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                                  {stagiaire.objectif_professionnel}
                                </p>
                              </div>
                            )}
                            
                            {/* Actions rapides */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleStagiaireClick(stagiaire.id)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                              >
                                Voir profil complet
                              </button>
                              {stagiaire.statut_recherche === 'en_recherche' && (
                                <button
                                  onClick={() => updateStatutStagiaire(stagiaire.id, stagiaire.statut_stagiaire, 'employe')}
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                                >
                                  Marquer employé
                                </button>
                              )}
                                     </div>
       </div>
     )}

     {/* Modal de détails de candidature - Version simple */}
     {showCandidatureDetail && selectedCandidature && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
         <div className="bg-white rounded-lg w-full max-w-2xl p-6">
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
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de la candidature</h3>
             
             <div className="space-y-4">
               <div>
                 <strong>Entreprise :</strong> {selectedCandidature.entreprise_nom}
               </div>
               <div>
                 <strong>Poste :</strong> {selectedCandidature.poste}
               </div>
               <div>
                 <strong>Type de contrat :</strong> {selectedCandidature.type_contrat || 'Non spécifié'}
               </div>
               <div>
                 <strong>Date :</strong> {selectedCandidature.date_candidature || 
                  new Date(selectedCandidature.created_at).toLocaleDateString('fr-FR')}
               </div>
               <div>
                 <strong>Statut :</strong> {selectedCandidature.statut_candidature || 'En attente'}
               </div>
               
               <div className="pt-4">
                 <button
                   onClick={() => setShowCandidatureDetail(false)}
                   className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                 >
                   Fermer
                 </button>
               </div>
             </div>
           </div>
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

      {activeView === 'candidatures' && (
        <>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Candidatures reçues</h1>
              <p className="text-gray-600">Gestion des candidatures des étudiants via le formulaire</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{candidaturesStagiaires.length}</div>
                <div className="text-sm text-gray-600">Candidatures</div>
              </div>
            </div>
          </div>

          {/* Statistiques des candidatures */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Send className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Envoyées</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {candidaturesStagiaires.filter(c => c.statut_candidature === 'envoye').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Acceptées</p>
                  <p className="text-2xl font-bold text-green-600">
                    {candidaturesStagiaires.filter(c => c.statut_candidature === 'acceptee').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <X className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Refusées</p>
                  <p className="text-2xl font-bold text-red-600">
                    {candidaturesStagiaires.filter(c => c.statut_candidature === 'refusee').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {candidaturesStagiaires.filter(c => !c.statut_candidature || c.statut_candidature === 'en_attente').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Rechercher par entreprise, poste..."
                    value={candidatureSearch}
                    onChange={(e) => setCandidatureSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <select
                value={candidatureFilter}
                onChange={(e) => setCandidatureFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Tous les statuts</option>
                <option value="envoye">Envoyées</option>
                <option value="acceptee">Acceptées</option>
                <option value="refusee">Refusées</option>
                <option value="en_attente">En attente</option>
              </select>
            </div>
          </div>

          {/* Liste des candidatures */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                Candidatures reçues
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {candidaturesStagiaires.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Send className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune candidature reçue pour le moment</p>
                  <p className="text-sm mt-2">Les candidatures apparaîtront ici quand les étudiants utiliseront le formulaire</p>
                </div>
              ) : (
                candidaturesStagiaires
                  .filter(candidature => {
                    const matchesSearch = candidatureSearch === '' || 
                      candidature.entreprise_nom.toLowerCase().includes(candidatureSearch.toLowerCase()) ||
                      candidature.poste.toLowerCase().includes(candidatureSearch.toLowerCase())
                    
                    const matchesFilter = candidatureFilter === 'tous' || 
                      candidature.statut_candidature === candidatureFilter
                    
                    return matchesSearch && matchesFilter
                  })
                  .map((candidature) => (
                    <div key={candidature.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
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
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              candidature.statut_candidature === 'envoye' ? 'bg-blue-100 text-blue-800' :
                              candidature.statut_candidature === 'acceptee' ? 'bg-green-100 text-green-800' :
                              candidature.statut_candidature === 'refusee' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {candidature.statut_candidature === 'envoye' ? 'Envoyée' :
                               candidature.statut_candidature === 'acceptee' ? 'Acceptée' :
                               candidature.statut_candidature === 'refusee' ? 'Refusée' :
                               candidature.statut_candidature || 'En attente'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-medium">Poste :</span> {candidature.poste}
                            </div>
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-medium">Type :</span> {candidature.type_contrat || 'Non spécifié'}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-medium">Date :</span> {candidature.date_candidature || 'Non spécifiée'}
                            </div>
                            <div className="flex items-center">
                              <ExternalLink className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-medium">Source :</span> {candidature.source_offre || 'Site web COP'}
                            </div>
                          </div>
                          
                          {candidature.feedback_entreprise && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center mb-2">
                                <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="font-medium text-sm">Feedback :</span>
                              </div>
                              <p className="text-sm text-gray-600">{candidature.feedback_entreprise}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleCandidatureDetail(candidature)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Détails de la candidature
                          </button>
                          
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
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="envoye">Envoyée</option>
                            <option value="acceptee">Acceptée</option>
                            <option value="refusee">Refusée</option>
                            <option value="en_attente">En attente</option>
                          </select>
                          
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
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </>
      )}

      {activeView === 'detail' && stagiaireDetail && (
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
                  {stagiaireDetail.nom} {stagiaireDetail.prenom}
                </h1>
                <p className="text-gray-600">
                  {stagiaireDetail.filiere_nom} - {stagiaireDetail.niveau_formation}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEntretienForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Programmer entretien
              </button>
              <button
                onClick={() => setShowCandidatureForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter candidature
              </button>
            </div>
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                    <p className="text-gray-900">{stagiaireDetail.nom} {stagiaireDetail.prenom}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{stagiaireDetail.email_personnel || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="text-gray-900">{stagiaireDetail.telephone_portable || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Numéro stagiaire</label>
                   <p className="text-gray-900">{stagiaireDetail.numero_stagiaire || 'Non attribué'}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Filière</label>
                   <p className="text-gray-900">{stagiaireDetail.filiere_nom || 'Non définie'}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Niveau</label>
                   <p className="text-gray-900">{stagiaireDetail.niveau_formation || 'Non défini'}</p>
                 </div>
               </div>
             </div>
           </div>

           <div className="space-y-4">
             {/* Statuts */}
             <div className="bg-white rounded-lg shadow-sm border p-4">
               <h3 className="text-lg font-medium text-gray-900 mb-4">Statuts</h3>
               <div className="space-y-3">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Statut formation</label>
                   <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(stagiaireDetail.statut_stagiaire)}`}>
                     {getStatutLabel(stagiaireDetail.statut_stagiaire)}
                   </span>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Statut recherche</label>
                   <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRechercheColor(stagiaireDetail.statut_recherche)}`}>
                     {getStatutLabel(stagiaireDetail.statut_recherche)}
                   </span>
                 </div>
               </div>
             </div>

             {/* Statistiques */}
             <div className="bg-white rounded-lg shadow-sm border p-4">
               <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
               <div className="space-y-3">
                 <div className="flex justify-between">
                   <span className="text-gray-600">Candidatures</span>
                   <span className="font-medium">{candidatures.length}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Entretiens COP</span>
                   <span className="font-medium">{entretiens.length}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">CV envoyés</span>
                   <span className="font-medium">{stagiaireDetail.cv_envoyes_systeme || 0}</span>
                 </div>
                 {stagiaireDetail.age && (
                   <div className="flex justify-between">
                     <span className="text-gray-600">Âge</span>
                     <span className="font-medium">{stagiaireDetail.age} ans</span>
                   </div>
                 )}
               </div>
             </div>
           </div>
         </div>

         {/* Objectif professionnel */}
         {stagiaireDetail.objectif_professionnel && (
           <div className="bg-white rounded-lg shadow-sm border p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Objectif professionnel</h3>
             <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{stagiaireDetail.objectif_professionnel}</p>
           </div>
         )}

         {/* Candidatures récentes */}
         <div className="bg-white rounded-lg shadow-sm border">
           <div className="p-6">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-medium text-gray-900">Candidatures ({candidatures.length})</h3>
               <button
                 onClick={() => setShowCandidatureForm(true)}
                 className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
               >
                 <Plus className="w-4 h-4 mr-1" />
                 Ajouter
               </button>
             </div>
             
             {candidatures.length === 0 ? (
               <p className="text-gray-600 text-center py-8">Aucune candidature enregistrée</p>
             ) : (
               <div className="space-y-4">
                 {candidatures.slice(0, 5).map((candidature) => (
                   <div key={candidature.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                     <Building2 className="w-5 h-5 text-gray-600 mt-1" />
                     <div className="flex-1">
                       <h4 className="font-medium text-gray-900">{candidature.entreprise_nom}</h4>
                       <p className="text-sm text-gray-600">{candidature.poste}</p>
                       <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                         <span>{new Date(candidature.date_candidature).toLocaleDateString('fr-FR')}</span>
                         <span>{candidature.type_contrat}</span>
                         <span className={`px-2 py-1 rounded-full text-xs ${
                           candidature.statut_candidature === 'accepte' ? 'bg-green-100 text-green-800' :
                           candidature.statut_candidature === 'refuse' ? 'bg-red-100 text-red-800' :
                           'bg-yellow-100 text-yellow-800'
                         }`}>
                           {candidature.statut_candidature}
                         </span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
         </div>

         {/* Entretiens COP */}
         <div className="bg-white rounded-lg shadow-sm border">
           <div className="p-6">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-medium text-gray-900">Entretiens COP ({entretiens.length})</h3>
               <button
                 onClick={() => setShowEntretienForm(true)}
                 className="text-green-600 hover:text-green-800 text-sm flex items-center"
               >
                 <Plus className="w-4 h-4 mr-1" />
                 Programmer
               </button>
             </div>
             
             {entretiens.length === 0 ? (
               <p className="text-gray-600 text-center py-8">Aucun entretien programmé</p>
             ) : (
               <div className="space-y-4">
                 {entretiens.slice(0, 5).map((entretien) => (
                   <div key={entretien.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                     <MessageSquare className="w-5 h-5 text-gray-600 mt-1" />
                     <div className="flex-1">
                       <div className="flex items-center justify-between">
                         <h4 className="font-medium text-gray-900">
                           {entretien.type_entretien === 'initial' ? 'Entretien initial' :
                            entretien.type_entretien === 'suivi' ? 'Entretien de suivi' :
                            entretien.type_entretien === 'bilan' ? 'Entretien bilan' :
                            entretien.type_entretien === 'orientation' ? 'Entretien d\'orientation' :
                            'Entretien de crise'}
                         </h4>
                         <span className="text-sm text-gray-500">
                           {new Date(entretien.date_entretien).toLocaleDateString('fr-FR')}
                         </span>
                       </div>
                       <p className="text-sm text-gray-600">Avec {entretien.conseiller_cop}</p>
                       {entretien.objectifs_entretien && (
                         <p className="text-sm text-gray-600 mt-1">{entretien.objectifs_entretien}</p>
                       )}
                       <div className="mt-1">
                         <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                           entretien.statut_entretien === 'realise' ? 'bg-green-100 text-green-800' :
                           entretien.statut_entretien === 'planifie' ? 'bg-blue-100 text-blue-800' :
                           entretien.statut_entretien === 'reporte' ? 'bg-yellow-100 text-yellow-800' :
                           'bg-red-100 text-red-800'
                         }`}>
                           {entretien.statut_entretien}
                         </span>
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

     {/* Formulaire de création/édition de stagiaire */}
     {showForm && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold">
               {formData.id ? 'Modifier le stagiaire' : 'Nouveau stagiaire'}
             </h2>
             <button
               onClick={() => setShowForm(false)}
               className="p-1 hover:bg-gray-100 rounded"
             >
               <X className="w-5 h-5" />
             </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Informations personnelles */}
             <div className="space-y-4">
               <h3 className="font-medium text-gray-900 border-b pb-2">Informations personnelles</h3>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium mb-2">Nom *</label>
                   <input
                     type="text"
                     value={formData.nom || ''}
                     onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     placeholder="Nom de famille"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium mb-2">Prénom *</label>
                   <input
                     type="text"
                     value={formData.prenom || ''}
                     onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     placeholder="Prénom"
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">Email personnel</label>
                 <input
                   type="email"
                   value={formData.email_personnel || ''}
                   onChange={(e) => setFormData(prev => ({ ...prev, email_personnel: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   placeholder="email@stagiaire.com"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">Téléphone portable</label>
                 <input
                   type="tel"
                   value={formData.telephone_portable || ''}
                   onChange={(e) => setFormData(prev => ({ ...prev, telephone_portable: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   placeholder="06 XX XX XX XX"
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium mb-2">Date de naissance</label>
                   <input
                     type="date"
                     value={formData.date_naissance || ''}
                     onChange={(e) => setFormData(prev => ({ ...prev, date_naissance: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium mb-2">CIN</label>
                   <input
                     type="text"
                     value={formData.cin || ''}
                     onChange={(e) => setFormData(prev => ({ ...prev, cin: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                     placeholder="CIN"
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">Adresse complète</label>
                 <textarea
                   value={formData.adresse_complete || ''}
                   onChange={(e) => setFormData(prev => ({ ...prev, adresse_complete: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   rows={2}
                   placeholder="Adresse complète"
                 />
               </div>
             </div>

             {/* Informations formation */}
             <div className="space-y-4">
               <h3 className="font-medium text-gray-900 border-b pb-2">Formation</h3>
               
               <div>
                 <label className="block text-sm font-medium mb-2">Numéro stagiaire</label>
                 <input
                   type="text"
                   value={formData.numero_stagiaire || ''}
                   onChange={(e) => setFormData(prev => ({ ...prev, numero_stagiaire: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   placeholder="Ex: ST2024001"
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
                     <option value="">Sélectionner un pôle</option>
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
                     <option value="">Sélectionner une filière</option>
                     {filieres.filter(f => f.actif && (!formData.pole_id || f.pole_id === formData.pole_id)).map(filiere => (
                       <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                     ))}
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium mb-2">Niveau de formation</label>
                   <select
                     value={formData.niveau_formation || ''}
                     onChange={(e) => setFormData(prev => ({ ...prev, niveau_formation: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="">Sélectionner</option>
                     {niveauxFormation.map(niveau => (
                       <option key={niveau} value={niveau}>{niveau}</option>
                     ))}
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium mb-2">Année de formation</label>
                   <select
                     value={formData.annee_formation || ''}
                     onChange={(e) => setFormData(prev => ({ ...prev, annee_formation: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="">Sélectionner</option>
                     <option value="1ère année">1ère année</option>
                     <option value="2ème année">2ème année</option>
                     <option value="3ème année">3ème année</option>
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium mb-2">Statut formation</label>
                   <select
                     value={formData.statut_stagiaire || 'actif'}
                     onChange={(e) => setFormData(prev => ({ ...prev, statut_stagiaire: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   >
                     {statutsStagiaire.map(statut => (
                       <option key={statut} value={statut}>{getStatutLabel(statut)}</option>
                     ))}
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium mb-2">Statut recherche</label>
                   <select
                     value={formData.statut_recherche || 'en_formation'}
                     onChange={(e) => setFormData(prev => ({ ...prev, statut_recherche: e.target.value }))}
                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   >
                     {statutsRecherche.map(statut => (
                       <option key={statut} value={statut}>{getStatutLabel(statut)}</option>
                     ))}
                   </select>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">Conseiller principal</label>
                 <input
                   type="text"
                   value={formData.conseiller_principal_nom || ''}
                   onChange={(e) => setFormData(prev => ({ ...prev, conseiller_principal_nom: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   placeholder="Nom du conseiller COP"
                 />
               </div>
             </div>
           </div>

           <div className="mt-6">
             <label className="block text-sm font-medium mb-2">Objectif professionnel</label>
             <textarea
               value={formData.objectif_professionnel || ''}
               onChange={(e) => setFormData(prev => ({ ...prev, objectif_professionnel: e.target.value }))}
               className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
               rows={3}
               placeholder="Décrivez l'objectif professionnel du stagiaire..."
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
               onClick={handleSaveStagiaire}
               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
             >
               <Save className="w-4 h-4 mr-2" />
               {formData.id ? 'Modifier' : 'Créer'}
             </button>
           </div>
         </div>
       </div>
     )}

     {/* Formulaire d'import en masse */}
     {showImportForm && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold">Import en masse des stagiaires</h2>
             <button
               onClick={() => setShowImportForm(false)}
               className="p-1 hover:bg-gray-100 rounded"
             >
               <X className="w-5 h-5" />
             </button>
           </div>

           <div className="space-y-6">
             {/* Instructions */}
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
               <h3 className="font-medium text-blue-900 mb-2">📋 Format d'import requis</h3>
               <div className="text-sm text-blue-800 space-y-2">
                 <p><strong>Chaque ligne :</strong> Nom[TAB]Prénom[TAB]Email[TAB]Téléphone</p>
                 <p><strong>Exemple :</strong></p>
                 <code className="block bg-white p-2 rounded text-xs font-mono">
                   El Mansouri	Ahmed	ahmed@email.com	0612345678<br/>
                   Benali	Fatima	fatima@email.com	0687654321<br/>
                   Alami	Youssef	youssef@email.com	0698765432
                 </code>
                 <p><strong>💡 Astuce :</strong> Copiez directement depuis Excel/Google Sheets</p>
               </div>
             </div>

             {/* Configuration */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-2">Pôle *</label>
                 <select
                   value={importPole}
                   onChange={(e) => setImportPole(e.target.value)}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="">Sélectionner un pôle</option>
                   {poles.filter(p => p.actif).map(pole => (
                     <option key={pole.id} value={pole.id}>{pole.nom}</option>
                   ))}
                 </select>
               </div>
               
               <div>
                 <label className="block text-sm font-medium mb-2">Filière *</label>
                 <select
                   value={importFiliere}
                   onChange={(e) => setImportFiliere(e.target.value)}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="">Sélectionner une filière</option>
                   {filieres.filter(f => f.actif && (!importPole || f.pole_id === importPole)).map(filiere => (
                     <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                   ))}
                 </select>
               </div>
             </div>

             {/* Zone de saisie */}
             <div>
               <label className="block text-sm font-medium mb-2">
                 Données des stagiaires *
                 <span className="text-gray-500 text-xs ml-2">
                   (Une ligne par stagiaire, séparés par des tabulations)
                 </span>
               </label>
               <textarea
                 value={importData}
                 onChange={(e) => setImportData(e.target.value)}
                 className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                 rows={10}
                 placeholder="El Mansouri	Ahmed	ahmed@email.com	0612345678
Benali	Fatima	fatima@email.com	0687654321
Alami	Youssef	youssef@email.com	0698765432"
               />
               <div className="text-xs text-gray-500 mt-1">
                 {importData.trim() ? `${importData.trim().split('\n').length} ligne(s) détectée(s)` : 'Aucune donnée'}
               </div>
             </div>

             {/* Paramètres par défaut */}
             <div className="bg-gray-50 p-4 rounded-lg">
               <h4 className="font-medium text-gray-900 mb-2">Paramètres par défaut assignés</h4>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                 <div>
                   <span className="font-medium">Niveau:</span> Technicien Spécialisé
                 </div>
                 <div>
                   <span className="font-medium">Année:</span> 1ère année
                 </div>
                 <div>
                   <span className="font-medium">Statut:</span> Actif
                 </div>
                 <div>
                   <span className="font-medium">Recherche:</span> En formation
                 </div>
               </div>
             </div>
           </div>

           {/* Boutons */}
           <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
             <button
               onClick={() => setShowImportForm(false)}
               className="px-4 py-2 text-gray-600 hover:text-gray-800"
             >
               Annuler
             </button>
             <button
               onClick={handleImportStagiaires}
               disabled={!importData.trim() || !importFiliere}
               className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
             >
               <Download className="w-4 h-4 mr-2" />
               Importer {importData.trim() ? `(${importData.trim().split('\n').length} stagiaires)` : ''}
             </button>
           </div>
         </div>
       </div>
     )}

     {/* Formulaire d'entretien */}
     {showEntretienForm && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold">Programmer un entretien</h2>
             <button
               onClick={() => setShowEntretienForm(false)}
               className="p-1 hover:bg-gray-100 rounded"
             >
               <X className="w-5 h-5" />
             </button>
           </div>

           <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-2">Date *</label>
                 <input
                   type="date"
                   value={entretienFormData.date_entretien || ''}
                   onChange={(e) => setEntretienFormData(prev => ({ ...prev, date_entretien: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">Type d'entretien</label>
                 <select
                   value={entretienFormData.type_entretien || 'suivi'}
                   onChange={(e) => setEntretienFormData(prev => ({ ...prev, type_entretien: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 >
                   {typesEntretien.map(type => (
                     <option key={type} value={type}>
                       {type === 'initial' ? 'Initial' :
                        type === 'suivi' ? 'Suivi' :
                        type === 'bilan' ? 'Bilan' :
                        type === 'orientation' ? 'Orientation' : 'Crise'}
                     </option>
                   ))}
                 </select>
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium mb-2">Conseiller COP *</label>
<input
                 type="text"
                 value={entretienFormData.conseiller_cop || ''}
                 onChange={(e) => setEntretienFormData(prev => ({ ...prev, conseiller_cop: e.target.value }))}
                 className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 placeholder="Nom du conseiller"
               />
             </div>

             <div>
               <label className="block text-sm font-medium mb-2">Objectifs de l'entretien</label>
               <textarea
                 value={entretienFormData.objectifs_entretien || ''}
                 onChange={(e) => setEntretienFormData(prev => ({ ...prev, objectifs_entretien: e.target.value }))}
                 className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 rows={3}
                 placeholder="Objectifs et points à aborder..."
               />
             </div>
           </div>

           <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
             <button
               onClick={() => setShowEntretienForm(false)}
               className="px-4 py-2 text-gray-600 hover:text-gray-800"
             >
               Annuler
             </button>
             <button
               onClick={handleProgrammerEntretien}
               className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
             >
               <Save className="w-4 h-4 mr-2" />
               Programmer
             </button>
           </div>
         </div>
       </div>
     )}

     {/* Formulaire de candidature */}
     {showCandidatureForm && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold">Ajouter une candidature</h2>
             <button
               onClick={() => setShowCandidatureForm(false)}
               className="p-1 hover:bg-gray-100 rounded"
             >
               <X className="w-5 h-5" />
             </button>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium mb-2">Entreprise *</label>
               <input
                 type="text"
                 value={candidatureFormData.entreprise_nom || ''}
                 onChange={(e) => setCandidatureFormData(prev => ({ ...prev, entreprise_nom: e.target.value }))}
                 className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 placeholder="Nom de l'entreprise"
               />
             </div>

             <div>
               <label className="block text-sm font-medium mb-2">Poste *</label>
               <input
                 type="text"
                 value={candidatureFormData.poste || ''}
                 onChange={(e) => setCandidatureFormData(prev => ({ ...prev, poste: e.target.value }))}
                 className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 placeholder="Intitulé du poste"
               />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-2">Type de contrat</label>
                 <select
                   value={candidatureFormData.type_contrat || ''}
                   onChange={(e) => setCandidatureFormData(prev => ({ ...prev, type_contrat: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="">Sélectionner</option>
                   <option value="Stage">Stage</option>
                   <option value="CDI">CDI</option>
                   <option value="CDD">CDD</option>
                   <option value="Alternance">Alternance</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">Source</label>
                 <select
                   value={candidatureFormData.source_offre || 'cop'}
                   onChange={(e) => setCandidatureFormData(prev => ({ ...prev, source_offre: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="cop">COP</option>
                   <option value="stagiaire">Stagiaire</option>
                   <option value="site_emploi">Site emploi</option>
                   <option value="reseau">Réseau</option>
                   <option value="spontanee">Spontanée</option>
                 </select>
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium mb-2">Date de candidature</label>
               <input
                 type="date"
                 value={candidatureFormData.date_candidature || new Date().toISOString().split('T')[0]}
                 onChange={(e) => setCandidatureFormData(prev => ({ ...prev, date_candidature: e.target.value }))}
                 className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
               />
             </div>
           </div>

           <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
             <button
               onClick={() => setShowCandidatureForm(false)}
               className="px-4 py-2 text-gray-600 hover:text-gray-800"
             >
               Annuler
             </button>
             <button
               onClick={handleAjouterCandidature}
               className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center"
             >
               <Save className="w-4 h-4 mr-2" />
               Ajouter
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 )
}