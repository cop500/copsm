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

  // Vérifier si l'utilisateur actuel est admin (temporairement désactivé pour les tests)
  const isAdmin = true // Temporairement true pour les tests
  const currentUserRole = getUserRole(profile?.id || '')

  // Temporairement commenté pour les tests
  // if (!isAdmin) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="bg-white p-8 rounded-lg shadow-lg text-center">
  //         <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
  //         <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
  //         <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette page.</p>
  //       </div>
  //     </div>
  //   )
  // }

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
    totalPermissions: permissions.length,
    activePermissions: permissions.filter(p => !p.expires_at || new Date(p.expires_at) > new Date()).length,
    totalSubmissions: submissions.length,
    newSubmissions: submissions.filter(s => s.statut === 'nouveau').length,
    processedSubmissions: submissions.filter(s => s.statut === 'traite').length
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

  const handleRevokePermission = async (permissionId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir révoquer cette permission ?')) return

    const result = await revokePermission(permissionId)
    if (!result.success) {
      alert('Erreur: ' + result.error)
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
            <button
              onClick={() => {
                loadPermissions()
                loadSubmissions()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">Erreur: {error}</p>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Permissions actives</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePermissions}</p>
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

        {/* Onglets */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium">
                Gestion des permissions
              </button>
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                Soumissions de CV
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Section Permissions */}
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
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              {/* Liste des permissions */}
              <div className="space-y-4">
                {filteredPermissions.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune permission trouvée</p>
                  </div>
                ) : (
                  filteredPermissions.map(permission => (
                    <div key={permission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {permission.user?.prenom} {permission.user?.nom}
                          </p>
                          <p className="text-sm text-gray-600">{permission.user?.email}</p>
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRoleColor(permission.role)}`}>
                          {getRoleLabel(permission.role)}
                        </span>
                        
                        <div className="text-sm text-gray-600">
                          <p>Accordé le {new Date(permission.granted_at).toLocaleDateString('fr-FR')}</p>
                          {permission.expires_at && (
                            <p>Expire le {new Date(permission.expires_at).toLocaleDateString('fr-FR')}</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokePermission(permission.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Révoquer la permission"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal pour accorder une permission */}
        {showGrantForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Accorder une permission</h3>
                  <button
                    onClick={() => setShowGrantForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <EyeOff className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
                    <input
                      type="text"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      placeholder="ID utilisateur ou email"
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
