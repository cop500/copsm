'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
import { useAuth } from '@/hooks/useAuth'
import { Upload, Send, CheckCircle, FileText, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface DemandeEntreprise {
  id: string
  nom_entreprise: string
  poste_recherche: string
  contact_nom: string
  contact_email: string
  type_contrat: string
  filiere_id: string
  pole_id: string
  niveau_requis: string
  competences_requises: string
  description_poste: string
  lieu_travail: string
  salaire_propose: string
  date_limite: string
  urgence: string
  statut: string
  created_at: string
  updated_at: string
  profils?: Array<{
    poste_intitule: string
    [key: string]: any
  }>
  all_profils?: Array<{
    poste_intitule: string
    [key: string]: any
  }>
}

interface Candidature {
  id?: string
  demande_cv_id: string
  nom: string
  prenom: string
  filiere_id: string
  pole_id: string
  email: string
  telephone: string
  cv_file?: File
  cv_url?: string
  lettre_motivation?: string
  statut: string
  created_at: string
  updated_at: string
  demande?: DemandeEntreprise
  filiere?: {
    id: string
    nom: string
  }
  pole?: {
    id: string
    nom: string
  }
}

export default function CandidaturePage() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('candidatures')
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([])
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDemande, setSelectedDemande] = useState<DemandeEntreprise | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    filiere_id: '',
    pole_id: '',
    lettre_motivation: ''
  })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const { poles, filieres } = useSettings()

  // Vérifier si l'utilisateur est admin
  const isAdmin = profile?.role === 'business_developer' || profile?.role === 'manager_cop'

  useEffect(() => {
    loadDemandes()
    loadCandidatures()
  }, [])

  // Si l'utilisateur n'est pas admin et essaie d'accéder à CV Connect, rediriger vers candidatures
  useEffect(() => {
    if (!isAdmin && activeTab === 'cv-connect') {
      setActiveTab('candidatures')
    }
  }, [isAdmin, activeTab])

  const loadDemandes = async () => {
    try {
      const { data, error } = await supabase
        .from('demandes_cv')
        .select(`
          *,
          profils:demandes_cv_profils(*),
          all_profils:demandes_cv_profils(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDemandes(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error)
    }
  }

  const loadCandidatures = async () => {
    try {
      const { data, error } = await supabase
        .from('candidatures')
        .select(`
          *,
          demande:demandes_cv(*),
          filiere:filieres(*),
          pole:poles(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCandidatures(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des candidatures:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrorMessage('Veuillez sélectionner un fichier PDF')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Le fichier ne doit pas dépasser 5MB')
        return
      }
      setCvFile(file)
      setErrorMessage('')
    }
  }

  const uploadCV = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'cvs')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Erreur lors de l\'upload du CV')
    }

    const data = await response.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDemande || !cvFile) return

    setSending(true)
    setErrorMessage('')

    try {
      // Upload du CV
      setUploading(true)
      const cvUrl = await uploadCV(cvFile)
      setUploading(false)

      // Envoi de la candidature
      const { error } = await supabase
        .from('candidatures')
        .insert({
          demande_cv_id: selectedDemande.id,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone,
          filiere_id: formData.filiere_id,
          pole_id: formData.pole_id,
          cv_url: cvUrl,
          lettre_motivation: formData.lettre_motivation,
          statut: 'envoyee'
        })

      if (error) throw error

      setSuccessMessage('Votre candidature a été envoyée avec succès !')
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        filiere_id: '',
        pole_id: '',
        lettre_motivation: ''
      })
      setCvFile(null)
      setShowForm(false)
      setSelectedDemande(null)
      
      // Recharger les candidatures
      loadCandidatures()

    } catch (error: any) {
      setErrorMessage(error.message || 'Erreur lors de l\'envoi de la candidature')
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'envoyee': return 'bg-blue-100 text-blue-800'
      case 'en_cours_etude': return 'bg-yellow-100 text-yellow-800'
      case 'invitee_entretien': return 'bg-purple-100 text-purple-800'
      case 'entretien_programme': return 'bg-indigo-100 text-indigo-800'
      case 'entretien_realise': return 'bg-orange-100 text-orange-800'
      case 'acceptee': return 'bg-green-100 text-green-800'
      case 'refusee': return 'bg-red-100 text-red-800'
      case 'en_attente': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'envoyee': return 'Envoyée'
      case 'en_cours_etude': return 'En cours d\'étude'
      case 'invitee_entretien': return 'Invitée en entretien'
      case 'entretien_programme': return 'Entretien programmé'
      case 'entretien_realise': return 'Entretien réalisé'
      case 'acceptee': return 'Acceptée'
      case 'refusee': return 'Refusée'
      case 'en_attente': return 'En attente'
      default: return statut
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des candidatures...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Candidatures</h1>
            <p className="mt-2 text-gray-600">
              Gestion des demandes d'emploi et des CV des stagiaires
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
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
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'candidatures' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Envoyée</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {candidatures.filter(c => c.statut === 'envoyee').length}
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">En cours d'étude</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {candidatures.filter(c => c.statut === 'en_cours_etude').length}
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Invitée en entretien</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {candidatures.filter(c => c.statut === 'invitee_entretien').length}
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Entretien programmé</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {candidatures.filter(c => c.statut === 'entretien_programme').length}
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Entretien réalisé</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {candidatures.filter(c => c.statut === 'entretien_realise').length}
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Acceptée</p>
                  <p className="text-2xl font-bold text-green-600">
                    {candidatures.filter(c => c.statut === 'acceptee').length}
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Refusée</p>
                  <p className="text-2xl font-bold text-red-600">
                    {candidatures.filter(c => c.statut === 'refusee').length}
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {candidatures.filter(c => c.statut === 'en_attente').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Total count */}
            <div className="text-right mb-6">
              <span className="text-3xl font-bold text-gray-900">{candidatures.length} Candidatures</span>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Rechercher par entreprise, poste, nom..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Tous les statuts</option>
                  <option>Envoyée</option>
                  <option>En cours d'étude</option>
                  <option>Acceptée</option>
                  <option>Refusée</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Toutes dates</option>
                  <option>Aujourd'hui</option>
                  <option>Cette semaine</option>
                  <option>Ce mois</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Filtrer par entreprise</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Tous les pôles</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Toutes les filières</option>
                </select>
              </div>
            </div>

            {/* Candidatures List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Candidatures reçues ({candidatures.length})
                  </h2>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Temps réel actif
                    </span>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                      Actualiser
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                      Actions en lot
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {candidatures.map((candidature) => (
                  <div key={candidature.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <input type="checkbox" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {candidature.demande?.poste_recherche || 'Poste non spécifié'}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatutColor(candidature.statut)}`}>
                              {getStatutLabel(candidature.statut)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Reçue le {new Date(candidature.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Poste:</strong> {candidature.demande?.poste_recherche}</p>
                              <p><strong>Candidat :</strong> {candidature.prenom} {candidature.nom}</p>
                            </div>
                            <div>
                              <p><strong>Email :</strong> {candidature.email}</p>
                              <p><strong>Type :</strong> {candidature.demande?.type_contrat || 'Non spécifié'}</p>
                            </div>
                          </div>
                          {candidature.cv_url && (
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Actions CV :</p>
                              <div className="flex space-x-4">
                                <a
                                  href={candidature.cv_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                >
                                  <Upload className="w-4 h-4 mr-1" />
                                  Voir le CV
                                </a>
                                <a
                                  href={candidature.cv_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Ouvrir
                                </a>
                                <a
                                  href={candidature.cv_url}
                                  download
                                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Télécharger
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                          Détails
                        </button>
                        <select
                          value={candidature.statut}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="envoyee">Envoyée</option>
                          <option value="en_cours_etude">En cours d'étude</option>
                          <option value="invitee_entretien">Invitée en entretien</option>
                          <option value="entretien_programme">Entretien programmé</option>
                          <option value="entretien_realise">Entretien réalisé</option>
                          <option value="acceptee">Acceptée</option>
                          <option value="refusee">Refusée</option>
                          <option value="en_attente">En attente</option>
                        </select>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CV Connect Tab - Visible seulement pour les admins */}
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
      </div>
    </div>
  )
}