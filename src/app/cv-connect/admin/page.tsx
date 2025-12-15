'use client'

import React, { useState, useEffect } from 'react'
import { useCVConnect } from '@/hooks/useCVConnect'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  Trash2, Clock, CheckCircle, Search, RefreshCw,
  FileText, Archive, Download, Eye, X, Filter
} from 'lucide-react'
import { CVConnectFolders } from '@/components/CVConnectFolders'

export default function CVConnectAdminPage() {
  const { profile } = useAuth()
  const {
    submissions,
    loading,
    error,
    updateSubmissionStatus,
    loadSubmissions
  } = useCVConnect()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPole, setFilterPole] = useState('')
  const [filterFiliere, setFilterFiliere] = useState('')
  const [poles, setPoles] = useState<any[]>([])
  const [filieres, setFilieres] = useState<any[]>([])
  const [selectedCV, setSelectedCV] = useState<{ url: string; filename: string } | null>(null)
  const [showCVViewer, setShowCVViewer] = useState(false)

  // Charger les pôles et filières
  useEffect(() => {
    const loadPolesFilieres = async () => {
      try {
        const [polesRes, filieresRes] = await Promise.all([
          fetch('/api/poles'),
          fetch('/api/filieres')
        ])
        
        if (polesRes.ok) {
          const polesData = await polesRes.json()
          setPoles(polesData || [])
        }
        
        if (filieresRes.ok) {
          const filieresData = await filieresRes.json()
          setFilieres(filieresData || [])
        }
      } catch (err) {
        console.error('Erreur chargement pôles/filières:', err)
      }
    }
    
    loadPolesFilieres()
  }, [])

  // Vérifier si l'utilisateur actuel est admin
  const isAdmin = profile?.role === 'business_developer'

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  // Filtrer les soumissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = !searchTerm || 
      submission.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.pole?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.filiere?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !filterStatus || submission.statut === filterStatus
    const matchesPole = !filterPole || submission.pole_id === filterPole
    const matchesFiliere = !filterFiliere || submission.filiere_id === filterFiliere
    
    return matchesSearch && matchesStatus && matchesPole && matchesFiliere
  })
  
  // Filtrer les filières selon le pôle sélectionné
  const filteredFilieresForPole = filterPole 
    ? filieres.filter(f => f.pole_id === filterPole)
    : filieres

  // Statistiques
  const stats = {
    totalSubmissions: submissions.length,
    newSubmissions: submissions.filter(s => s.statut === 'nouveau').length,
    processedSubmissions: submissions.filter(s => s.statut === 'traite').length,
    archivedSubmissions: submissions.filter(s => s.statut === 'archive').length
  }

  const handleDeleteSubmission = async (submissionId: string, fileName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le CV "${fileName}" ? Cette action est irréversible.`)) return

    try {
      // Supprimer de la base de données
      const { error: dbError } = await supabase
        .from('cv_connect_submissions')
        .delete()
        .eq('id', submissionId)

      if (dbError) {
        throw new Error(dbError.message)
      }

      // Recharger les soumissions
      await loadSubmissions()
      alert('CV supprimé avec succès')
    } catch (error: any) {
      alert('Erreur lors de la suppression: ' + error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nouveau': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'traite': return 'bg-green-100 text-green-800 border-green-200'
      case 'archive': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données CV Connect...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                CV Connect - Administration
              </h1>
              <p className="text-gray-600 mt-2">Gestion des soumissions de CV</p>
            </div>
            <button
              onClick={loadSubmissions}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>

          {error && (
            <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Erreur:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total soumissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nouvelles soumissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Traitées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.processedSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <Archive className="w-8 h-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archivées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.archivedSubmissions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Soumissions de CV */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Soumissions de CV
              </h2>
            </div>

            {/* Filtres pour les soumissions */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-700">Filtres</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nom, prénom, email..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="nouveau">Nouveau</option>
                    <option value="traite">Traité</option>
                    <option value="archive">Archivé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pôle</label>
                  <select
                    value={filterPole}
                    onChange={(e) => {
                      setFilterPole(e.target.value)
                      setFilterFiliere('') // Reset filière quand on change de pôle
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
                  <select
                    value={filterFiliere}
                    onChange={(e) => setFilterFiliere(e.target.value)}
                    disabled={!filterPole}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      !filterPole ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      {filterPole ? 'Toutes les filières' : 'Sélectionnez d\'abord un pôle'}
                    </option>
                    {filteredFilieresForPole.map((filiere) => (
                      <option key={filiere.id} value={filiere.id}>
                        {filiere.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setFilterStatus('')
                      setFilterPole('')
                      setFilterFiliere('')
                    }}
                    className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>

            {/* Interface en dossiers par Pôle/Filière */}
            <div className="bg-transparent">
              <CVConnectFolders
                submissions={filteredSubmissions}
                loading={loading}
                onViewCV={(url, filename) => {
                  setSelectedCV({ url, filename })
                  setShowCVViewer(true)
                }}
                onDownloadCV={(url, filename) => {
                  window.open(url, '_blank')
                }}
                onDeleteCV={handleDeleteSubmission}
                onUpdateStatus={updateSubmissionStatus}
                searchTerm={searchTerm}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de visualisation du CV */}
      {showCVViewer && selectedCV && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{selectedCV.filename}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedCV.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </a>
                <button
                  onClick={() => {
                    setShowCVViewer(false)
                    setSelectedCV(null)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenu du PDF */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`${selectedCV.url}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0"
                title="Visualiseur de CV"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
