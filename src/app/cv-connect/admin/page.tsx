'use client'

import React, { useState } from 'react'
import { useCVConnect } from '@/hooks/useCVConnect'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  Trash2, Clock, CheckCircle, Search, RefreshCw,
  FileText, Archive, Download
} from 'lucide-react'

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
    
    return matchesSearch && matchesStatus
  })

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom, prénom, email, pôle, filière..."
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

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterStatus('')
                  }}
                  className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* Liste des soumissions */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune soumission</h3>
                  <p className="text-gray-500">Les stagiaires n'ont pas encore déposé de CV.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stagiaire
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pôle / Filière
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CV
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSubmissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {submission.nom} {submission.prenom}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{submission.email}</div>
                            {submission.telephone && (
                              <div className="text-sm text-gray-500">{submission.telephone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{submission.pole?.nom}</div>
                            <div className="text-sm text-gray-500">{submission.filiere?.nom}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              href={submission.cv_google_drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Download className="w-4 h-4" />
                              {submission.cv_filename}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={submission.statut}
                              onChange={(e) => updateSubmissionStatus(submission.id, e.target.value as any)}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.statut)}`}
                            >
                              <option value="nouveau">Nouveau</option>
                              <option value="traite">Traité</option>
                              <option value="archive">Archivé</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteSubmission(submission.id, submission.cv_filename)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer le CV"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
