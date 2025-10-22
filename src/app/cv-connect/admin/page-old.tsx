'use client'

import React, { useState } from 'react'
import { useCVConnect } from '@/hooks/useCVConnect'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { 
  Users, Shield, UserPlus, Trash2, Clock, CheckCircle, 
  AlertCircle, Search, Filter, Download, RefreshCw,
  Eye, EyeOff, Settings, FileText, Calendar
} from 'lucide-react'
import type { CVConnectRole } from '@/types'

export default function CVConnectAdminPage() {
  const { profile } = useAuth()
  const { poles, filieres } = useSettings()
  const {
    permissions,
    submissions,
    loading,
    error,
    hasCVConnectAccess,
    getUserRole,
    grantPermission,
    revokePermission,
    updateSubmissionStatus,
    loadPermissions,
    loadSubmissions
  } = useCVConnect()

  const [showGrantForm, setShowGrantForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRole, setSelectedRole] = useState<CVConnectRole>('lecteur')
  const [expiresAt, setExpiresAt] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [activeTab, setActiveTab] = useState<'submissions'>('submissions')

  // Vérifier si l'utilisateur actuel est admin (temporairement désactivé pour les tests)
  const isAdmin = true // Temporairement true pour les tests
  const currentUserRole = getUserRole(profile?.id || '')

  // Filtrer les permissions
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = !searchTerm || 
      permission.user?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.user?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = !filterRole || permission.role === filterRole
    
    return matchesSearch && matchesRole
  })

  // Filtrer les soumissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = !searchTerm || 
      submission.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase())
    
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

  const handleGrantPermission = async () => {
    if (!selectedUser || !profile?.id) return

    const result = await grantPermission(
      selectedUser,
      selectedRole,
      profile.id,
      expiresAt || undefined
    )

    if (result.success) {
      setShowGrantForm(false)
      setSelectedUser('')
      setSelectedRole('lecteur')
      setExpiresAt('')
    } else {
      alert('Erreur: ' + result.error)
    }
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

  const getRoleColor = (role: CVConnectRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'gestionnaire': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'lecteur': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleLabel = (role: CVConnectRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'gestionnaire': return 'Gestionnaire'
      case 'lecteur': return 'Lecteur'
      default: return role
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
              <p className="text-gray-600 mt-2">Gestion des permissions et soumissions de CV</p>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <Archive className="w-8 h-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archivées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.archivedSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-green-600" />
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
        </div>

        {/* Section Soumissions de CV */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            {/* Section Permissions */}
            {activeTab === 'permissions' && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Permissions CV Connect
                  </h2>
                  <button
                    onClick={() => setShowGrantForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Accorder une permission
                  </button>
                </div>

                {/* Filtres */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Tous les rôles</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="gestionnaire">Gestionnaire</option>
                      <option value="lecteur">Lecteur</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setFilterRole('')
                      }}
                      className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>

                {/* Liste des permissions */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {filteredPermissions.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune permission</h3>
                      <p className="text-gray-500">Commencez par accorder une permission à un utilisateur.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Utilisateur
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rôle
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Accordé par
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date d'accord
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Expire le
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredPermissions.map((permission) => (
                            <tr key={permission.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {permission.user?.nom} {permission.user?.prenom}
                                </div>
                                <div className="text-sm text-gray-500">{permission.user?.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(permission.role)}`}>
                                  {getRoleLabel(permission.role)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {permission.granted_by_user?.nom} {permission.granted_by_user?.prenom}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(permission.granted_at).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {permission.expires_at ? new Date(permission.expires_at).toLocaleDateString('fr-FR') : 'Jamais'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleRevokePermission(permission.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-4 h-4" />
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
            )}

            {/* Section Soumissions de CV */}
            {activeTab === 'submissions' && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Soumissions de CV
                  </h2>
                  <button
                    onClick={loadSubmissions}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Actualiser
                  </button>
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
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    submission.statut === 'nouveau' 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : submission.statut === 'traite'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  <option value="nouveau">Nouveau</option>
                                  <option value="traite">Traité</option>
                                  <option value="archive">Archivé</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal pour accorder une permission */}
        {showGrantForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Accorder une permission</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email de l'utilisateur</label>
                    <input
                      type="email"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      placeholder="exemple@domaine.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as CVConnectRole)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="lecteur">Lecteur</option>
                      <option value="gestionnaire">Gestionnaire</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration (optionnel)</label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowGrantForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleGrantPermission}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Accorder
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
