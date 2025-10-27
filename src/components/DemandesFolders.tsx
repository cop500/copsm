'use client'

import React, { useState } from 'react'
import { 
  Archive, ArchiveRestore, Building2, Users, Calendar, 
  ChevronRight, ChevronDown, FileText, Eye, Edit3, 
  Trash2, CheckCircle, AlertTriangle, Clock, XCircle,
  MapPin, Phone, Mail, Briefcase, TrendingUp
} from 'lucide-react'

interface DemandeEntreprise {
  id: string
  entreprise_nom: string
  secteur: string
  entreprise_ville: string
  contact_nom: string
  contact_email: string
  contact_tel: string
  profils: any[]
  evenement_type?: string
  evenement_date?: string
  fichier_url?: string
  type_demande: string
  statut: string
  created_at: string
  updated_at?: string
  candidatures_count?: number
  candidatures?: any[]
}

interface Candidature {
  id: string
  entreprise_nom: string
  poste: string
  type_contrat?: string
  date_candidature?: string
  statut_candidature?: string
  cv_url?: string
  nom?: string
  prenom?: string
  email?: string
  telephone?: string
  created_at: string
}

interface DemandesFoldersProps {
  demandes: DemandeEntreprise[]
  loading: boolean
  onSelectDemande: (demande: DemandeEntreprise) => void
  onUpdateStatut: (candidatureId: string, newStatut: string, notes?: string) => Promise<{success: boolean}>
  onDeleteCandidature: (candidatureId: string) => Promise<{success: boolean}>
}

export const DemandesFolders: React.FC<DemandesFoldersProps> = ({
  demandes,
  loading,
  onSelectDemande,
  onUpdateStatut,
  onDeleteCandidature
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null)
  const [showCandidatureDetail, setShowCandidatureDetail] = useState(false)
  const [candidatureNotes, setCandidatureNotes] = useState('')

  const toggleFolder = (demandeId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(demandeId)) {
      newExpanded.delete(demandeId)
    } else {
      newExpanded.add(demandeId)
    }
    setExpandedFolders(newExpanded)
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'termine': return 'bg-green-100 text-green-800 border-green-200'
      case 'annule': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente'
      case 'en_cours': return 'En cours'
      case 'termine': return 'Terminé'
      case 'annule': return 'Annulé'
      default: return statut
    }
  }

  const getCandidatureStatutColor = (statut: string) => {
    switch (statut) {
      case 'envoye': return 'bg-blue-100 text-blue-800'
      case 'en_etude': return 'bg-yellow-100 text-yellow-800'
      case 'invite_entretien': return 'bg-purple-100 text-purple-800'
      case 'entretien_programme': return 'bg-indigo-100 text-indigo-800'
      case 'entretien_realise': return 'bg-orange-100 text-orange-800'
      case 'acceptee': return 'bg-green-100 text-green-800'
      case 'refusee': return 'bg-red-100 text-red-800'
      case 'en_attente': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCandidatureStatutLabel = (statut: string) => {
    switch (statut) {
      case 'envoye': return 'Envoyé'
      case 'en_etude': return 'En étude'
      case 'invite_entretien': return 'Invité entretien'
      case 'entretien_programme': return 'Entretien programmé'
      case 'entretien_realise': return 'Entretien réalisé'
      case 'acceptee': return 'Accepté'
      case 'refusee': return 'Refusé'
      case 'en_attente': return 'En attente'
      default: return statut
    }
  }

  const handleViewCandidature = (candidature: Candidature) => {
    setSelectedCandidature(candidature)
    setCandidatureNotes(candidature.feedback_entreprise || '')
    setShowCandidatureDetail(true)
  }

  const handleUpdateStatut = async (candidatureId: string, newStatut: string) => {
    const result = await onUpdateStatut(candidatureId, newStatut, candidatureNotes)
    if (result.success) {
      setShowCandidatureDetail(false)
      setSelectedCandidature(null)
    }
  }

  const handleDeleteCandidature = async (candidatureId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette candidature ?')) {
      const result = await onDeleteCandidature(candidatureId)
      if (result.success) {
        setShowCandidatureDetail(false)
        setSelectedCandidature(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des demandes...</p>
        </div>
      </div>
    )
  }

  if (demandes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune demande d'entreprise
          </h3>
          <p className="text-gray-600">
            Les demandes d'entreprises apparaîtront ici une fois qu'elles seront soumises.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Liste des dossiers de demandes */}
      {demandes.map((demande) => {
        const isExpanded = expandedFolders.has(demande.id)
        const candidaturesCount = demande.candidatures_count || 0
        
        return (
          <div key={demande.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Header du dossier */}
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleFolder(demande.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    {isExpanded ? (
                      <ArchiveRestore className="w-6 h-6 text-white" />
                    ) : (
                      <Archive className="w-6 h-6 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {demande.entreprise_nom}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatutColor(demande.statut)}`}>
                        {getStatutLabel(demande.statut)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{demande.entreprise_ville}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{demande.secteur}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{candidaturesCount} candidature{candidaturesCount > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(demande.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectDemande(demande)
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Voir détails de la demande"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Contenu du dossier (candidatures) */}
            {isExpanded && (
              <div className="border-t border-gray-200 p-6">
                {candidaturesCount === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">Aucune candidature reçue pour cette demande</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                      Candidatures reçues ({candidaturesCount})
                    </h4>
                    
                    {demande.candidatures?.map((candidature) => (
                      <div key={candidature.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {candidature.nom} {candidature.prenom}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {candidature.email}
                                </p>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCandidatureStatutColor(candidature.statut_candidature || 'envoye')}`}>
                                {getCandidatureStatutLabel(candidature.statut_candidature || 'envoye')}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Briefcase className="w-4 h-4" />
                                <span>{candidature.poste}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(candidature.created_at).toLocaleDateString('fr-FR')}</span>
                              </div>
                              {candidature.telephone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-4 h-4" />
                                  <span>{candidature.telephone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewCandidature(candidature)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCandidature(candidature.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Modal de détail de candidature */}
      {showCandidatureDetail && selectedCandidature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails de la candidature
                </h2>
                <button
                  onClick={() => setShowCandidatureDetail(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations du candidat */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du candidat</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                    <p className="text-gray-900">{selectedCandidature.poste}</p>
                  </div>
                </div>
              </div>

              {/* CV */}
              {selectedCandidature.cv_url && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">CV</h3>
                  <a
                    href={selectedCandidature.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Voir le CV
                  </a>
                </div>
              )}

              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <textarea
                  value={candidatureNotes}
                  onChange={(e) => setCandidatureNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Ajoutez des notes sur cette candidature..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <select
                    onChange={(e) => handleUpdateStatut(selectedCandidature.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedCandidature.statut_candidature || 'envoye'}
                  >
                    <option value="envoye">Envoyé</option>
                    <option value="en_etude">En étude</option>
                    <option value="invite_entretien">Invité entretien</option>
                    <option value="entretien_programme">Entretien programmé</option>
                    <option value="entretien_realise">Entretien réalisé</option>
                    <option value="acceptee">Accepté</option>
                    <option value="refusee">Refusé</option>
                    <option value="en_attente">En attente</option>
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowCandidatureDetail(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => handleUpdateStatut(selectedCandidature.id, selectedCandidature.statut_candidature || 'envoye')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
