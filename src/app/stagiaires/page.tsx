'use client'

import React, { useState } from 'react'
import { useCandidatures } from '@/hooks/useCandidatures'
import { 
  X, Save, Trash2, Eye, Clock, CheckCircle, AlertTriangle,
  Search, Filter, User, Mail, Phone, MapPin, Calendar, Target, Award,
  ChevronRight, ChevronDown, Star, Flag, Download, ExternalLink, Users,
  Briefcase, FileText, MessageSquare, TrendingUp, UserCheck, Building2,
  Send, Printer
} from 'lucide-react'

export default function StagiairesPage() {
  const { candidatures: candidaturesStagiaires, updateStatutCandidature, deleteCandidature } = useCandidatures()
  
  // Debug: vérifier les candidatures
  console.log('Candidatures chargées:', candidaturesStagiaires)

  const [candidatureFilter, setCandidatureFilter] = useState('tous')
  const [candidatureSearch, setCandidatureSearch] = useState('')
  const [selectedCandidature, setSelectedCandidature] = useState<any>(null)
  const [showCandidatureDetail, setShowCandidatureDetail] = useState(false)
  const [candidatureNotes, setCandidatureNotes] = useState('')
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // Ouvrir les détails d'une candidature
  const handleCandidatureDetail = (candidature: any) => {
    console.log('Clic sur candidature:', candidature)
    setSelectedCandidature(candidature)
    setCandidatureNotes(candidature.feedback_entreprise || '')
    setShowCandidatureDetail(true)
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
          <p className="text-gray-600">Gestion des candidatures des stagiaires via le formulaire de candidature</p>
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

      {/* Modal de détails de candidature */}
      {showCandidatureDetail && selectedCandidature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-6">
                {/* Informations principales */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de la candidature</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        selectedCandidature.statut_candidature === 'envoye' ? 'bg-blue-100 text-blue-800' :
                        selectedCandidature.statut_candidature === 'acceptee' ? 'bg-green-100 text-green-800' :
                        selectedCandidature.statut_candidature === 'refusee' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedCandidature.statut_candidature === 'envoye' ? 'Envoyée' :
                         selectedCandidature.statut_candidature === 'acceptee' ? 'Acceptée' :
                         selectedCandidature.statut_candidature === 'refusee' ? 'Refusée' :
                         selectedCandidature.statut_candidature || 'En attente'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informations du candidat */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du candidat</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                      <p className="text-gray-900">{selectedCandidature.nom_candidat} {selectedCandidature.prenom_candidat}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{selectedCandidature.email_candidat}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <p className="text-gray-900">{selectedCandidature.telephone_candidat || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CV</label>
                      {selectedCandidature.cv_url ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewCv(selectedCandidature.cv_url)}
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            Voir le CV
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = selectedCandidature.cv_url
                              link.download = `CV_${selectedCandidature.nom_candidat}_${selectedCandidature.prenom_candidat}.pdf`
                              link.click()
                            }}
                            className="text-green-600 hover:text-green-800 text-sm underline"
                          >
                            Télécharger
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">CV non disponible</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes et feedback */}
                <div>
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
                <div className="flex justify-end space-x-3 pt-4 border-t">
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
        </div>
      )}
    </div>
  )
}