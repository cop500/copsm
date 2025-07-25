// ========================================
// src/components/DemandesCVModule.tsx - Module Demandes CV COMPLET
// ========================================

'use client'

import React, { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { 
  FileText, Plus, X, Save, Edit3, Trash2, Eye, Clock, AlertTriangle,
  Building2, User, Mail, Phone, MapPin, Calendar, Target, Flag,
  Search, Filter, ChevronRight, CheckCircle, XCircle, Loader2
} from 'lucide-react'

export const DemandesCVModule = () => {
  const { filieres, poles } = useSettings()
  const [demandes, setDemandes] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [filterUrgence, setFilterUrgence] = useState('tous')
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)

  const typesContrat = ['Stage', 'CDI', 'CDD', 'Alternance', 'Freelance', 'Interim']
  const niveauxUrgence = ['normale', 'urgent', 'tres_urgent']
  const niveauxRequis = ['Technicien Spécialisé', 'Technicien', 'Qualification', 'Spécialisation']

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // Charger les demandes
  const loadDemandes = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('demandes_cv')
        .select(`
          *,
          filieres(nom, code, color),
          poles(nom, code, couleur)
        `)
        .order('date_demande', { ascending: false })
      
      if (error) throw error
      setDemandes(data || [])
    } catch (err: any) {
      console.error('Erreur chargement demandes:', err)
      showMessage('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Sauvegarder une demande
  const handleSave = async () => {
    console.log('🔥 SAUVEGARDE DEMANDE!')
    console.log('📝 Données:', formData)
    
    if (!formData.nom_entreprise || !formData.poste_recherche || !formData.type_contrat) {
      showMessage('Veuillez remplir les champs obligatoires', 'error')
      return
    }

    try {
      const dataToSave = {
        nom_entreprise: formData.nom_entreprise,
        contact_nom: formData.contact_nom,
        contact_email: formData.contact_email,
        contact_telephone: formData.contact_telephone,
        poste_recherche: formData.poste_recherche,
        filiere_id: formData.filiere_id,
        pole_id: formData.pole_id,
        niveau_requis: formData.niveau_requis,
        type_contrat: formData.type_contrat,
        nombre_cv_souhaite: formData.nombre_cv_souhaite || 1,
        competences_requises: formData.competences_requises,
        description_poste: formData.description_poste,
        lieu_travail: formData.lieu_travail,
        salaire_propose: formData.salaire_propose,
        date_limite: formData.date_limite,
        urgence: formData.urgence || 'normale',
        statut: formData.statut || 'nouvelle',
        nom_traitant: formData.nom_traitant,
        notes_internes: formData.notes_internes,
        source_demande: formData.source_demande || 'direct',
        priorite: formData.priorite || 3
      }

      if (formData.id) {
        // Modification
        const { data, error } = await supabase
          .from('demandes_cv')
          .update(dataToSave)
          .eq('id', formData.id)
          .select()

        if (error) throw error
      } else {
        // Création
        const { data, error } = await supabase
          .from('demandes_cv')
          .insert([dataToSave])
          .select()

        if (error) throw error
      }

      showMessage('Demande sauvegardée avec succès!')
      setShowForm(false)
      setFormData({})
      await loadDemandes()
    } catch (err: any) {
      console.error('💥 Erreur:', err)
      showMessage('Erreur: ' + err.message, 'error')
    }
  }

  // Supprimer une demande
  const handleDelete = async (id: string, nomEntreprise: string) => {
    if (!confirm(`Supprimer la demande de "${nomEntreprise}" ?`)) return

    try {
      const { error } = await supabase
        .from('demandes_cv')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      showMessage('Demande supprimée!')
      await loadDemandes()
    } catch (err: any) {
      showMessage('Erreur: ' + err.message, 'error')
    }
  }

  // Changer le statut d'une demande
  const changerStatut = async (id: string, nouveauStatut: string) => {
    try {
      const { error } = await supabase
        .from('demandes_cv')
        .update({ statut: nouveauStatut })
        .eq('id', id)

      if (error) throw error
      
      showMessage(`Statut changé vers "${nouveauStatut}"`)
      await loadDemandes()
    } catch (err: any) {
      showMessage('Erreur: ' + err.message, 'error')
    }
  }

  // Charger au démarrage
  useEffect(() => {
    loadDemandes()
  }, [])

  // Filtrer les demandes
  const filteredDemandes = demandes.filter(d => {
    const matchesSearch = d.nom_entreprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.poste_recherche.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.contact_nom?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatut = filterStatut === 'tous' || d.statut === filterStatut
    const matchesUrgence = filterUrgence === 'tous' || d.urgence === filterUrgence
    return matchesSearch && matchesStatut && matchesUrgence
  })

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'nouvelle': return 'bg-blue-100 text-blue-800'
      case 'en_traitement': return 'bg-yellow-100 text-yellow-800'
      case 'traitee': return 'bg-green-100 text-green-800'
      case 'fermee': return 'bg-gray-100 text-gray-800'
      case 'annulee': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgenceColor = (urgence: string) => {
    switch (urgence) {
      case 'tres_urgent': return 'bg-red-100 text-red-800'
      case 'urgent': return 'bg-orange-100 text-orange-800'
      case 'normale': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'nouvelle': return 'Nouvelle'
      case 'en_traitement': return 'En traitement'
      case 'traitee': return 'Traitée'
      case 'fermee': return 'Fermée'
      case 'annulee': return 'Annulée'
      default: return statut
    }
  }

  const getUrgenceLabel = (urgence: string) => {
    switch (urgence) {
      case 'tres_urgent': return 'Très urgent'
      case 'urgent': return 'Urgent'
      case 'normale': return 'Normal'
      default: return urgence
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
          <h1 className="text-2xl font-bold text-gray-900">Demandes de CV</h1>
          <p className="text-gray-600">Gérez les demandes de CV des entreprises</p>
        </div>
        <button
          onClick={() => {
            setFormData({})
            setShowForm(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Demande
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="tous">Tous les statuts</option>
            <option value="nouvelle">Nouvelles</option>
            <option value="en_traitement">En traitement</option>
            <option value="traitee">Traitées</option>
            <option value="fermee">Fermées</option>
            <option value="annulee">Annulées</option>
          </select>
          <select
            value={filterUrgence}
            onChange={(e) => setFilterUrgence(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="tous">Toutes urgences</option>
            <option value="tres_urgent">Très urgent</option>
            <option value="urgent">Urgent</option>
            <option value="normale">Normal</option>
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            {filteredDemandes.length} demande{filteredDemandes.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{demandes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 text-sm">📝</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nouvelles</p>
              <p className="text-2xl font-bold">{demandes.filter(d => d.statut === 'nouvelle').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">En traitement</p>
              <p className="text-2xl font-bold">{demandes.filter(d => d.statut === 'en_traitement').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Traitées</p>
              <p className="text-2xl font-bold">{demandes.filter(d => d.statut === 'traitee').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Urgentes</p>
              <p className="text-2xl font-bold">{demandes.filter(d => d.urgence === 'tres_urgent' || d.urgence === 'urgent').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Demandes récentes</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Chargement des demandes...</p>
            </div>
          ) : filteredDemandes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande trouvée</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatut !== 'tous' || filterUrgence !== 'tous' 
                  ? 'Aucune demande ne correspond à vos filtres'
                  : 'Créez votre première demande de CV'
                }
              </p>
              {!searchTerm && filterStatut === 'tous' && filterUrgence === 'tous' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Créer une demande
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDemandes.map(demande => (
                <div key={demande.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{demande.nom_entreprise}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(demande.statut)}`}>
                          {getStatutLabel(demande.statut)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgenceColor(demande.urgence)}`}>
                          {getUrgenceLabel(demande.urgence)}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {demande.type_contrat}
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-blue-600 mb-2">{demande.poste_recherche}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                        {demande.contact_nom && (
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {demande.contact_nom}
                          </div>
                        )}
                        {demande.contact_email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {demande.contact_email}
                          </div>
                        )}
                        {demande.lieu_travail && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {demande.lieu_travail}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(demande.date_demande).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          {demande.nombre_cv_souhaite} CV souhaités
                        </div>
                        {demande.date_limite && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Limite: {new Date(demande.date_limite).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                      
                      {demande.competences_requises && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Compétences:</strong> {demande.competences_requises}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Actions rapides statut */}
                      {demande.statut === 'nouvelle' && (
                        <button
                          onClick={() => changerStatut(demande.id, 'en_traitement')}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                          title="Prendre en charge"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      {demande.statut === 'en_traitement' && (
                        <button
                          onClick={() => changerStatut(demande.id, 'traitee')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Marquer comme traitée"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setFormData(demande)
                          setShowForm(true)
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(demande.id, demande.nom_entreprise)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
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
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {formData.id ? 'Modifier la demande' : 'Nouvelle demande de CV'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations entreprise */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 border-b pb-2">Informations entreprise</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Nom de l'entreprise *</label>
                  <input
                    type="text"
                    value={formData.nom_entreprise || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom_entreprise: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom de l'entreprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Contact principal</label>
                  <input
                    type="text"
                    value={formData.contact_nom || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_nom: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom du contact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="email@entreprise.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.contact_telephone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_telephone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="06 XX XX XX XX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Lieu de travail</label>
                  <input
                    type="text"
                    value={formData.lieu_travail || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, lieu_travail: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Ville ou adresse"
                  />
                </div>
              </div>

              {/* Informations poste */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 border-b pb-2">Détails du poste</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Poste recherché *</label>
                  <input
                    type="text"
                    value={formData.poste_recherche || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, poste_recherche: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Intitulé du poste"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type de contrat *</label>
                  <select
                    value={formData.type_contrat || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, type_contrat: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    {typesContrat.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
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

                <div>
                  <label className="block text-sm font-medium mb-2">Niveau requis</label>
                  <select
                    value={formData.niveau_requis || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, niveau_requis: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous niveaux</option>
                    {niveauxRequis.map(niveau => (
                      <option key={niveau} value={niveau}>{niveau}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre de CV</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.nombre_cv_souhaite || 1}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre_cv_souhaite: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Urgence</label>
                    <select
                      value={formData.urgence || 'normale'}
                      onChange={(e) => setFormData(prev => ({ ...prev, urgence: e.target.value }))}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    ><option value="normale">Normal</option>
                     <option value="urgent">Urgent</option>
                     <option value="tres_urgent">Très urgent</option>
                   </select>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">Date limite</label>
                 <input
                   type="date"
                   value={formData.date_limite || ''}
                   onChange={(e) => setFormData(prev => ({ ...prev, date_limite: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 />
               </div>
             </div>
           </div>

           {/* Informations supplémentaires */}
           <div className="mt-6 space-y-4">
             <h3 className="font-medium text-gray-900 border-b pb-2">Informations supplémentaires</h3>
             
             <div>
               <label className="block text-sm font-medium mb-2">Description du poste</label>
               <textarea
                 value={formData.description_poste || ''}
                 onChange={(e) => setFormData(prev => ({ ...prev, description_poste: e.target.value }))}
                 className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 rows={3}
                 placeholder="Description détaillée du poste..."
               />
             </div>

             <div>
               <label className="block text-sm font-medium mb-2">Compétences requises</label>
               <textarea
                 value={formData.competences_requises || ''}
                 onChange={(e) => setFormData(prev => ({ ...prev, competences_requises: e.target.value }))}
                 className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 rows={2}
                 placeholder="Compétences techniques et soft skills..."
               />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-2">Salaire proposé</label>
                 <input
                   type="text"
                   value={formData.salaire_propose || ''}
                   onChange={(e) => setFormData(prev => ({ ...prev, salaire_propose: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   placeholder="Ex: 3000-4000 MAD, À négocier..."
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium mb-2">Responsable traitement</label>
                 <input
                   type="text"
                   value={formData.nom_traitant || ''}
                   onChange={(e) => setFormData(prev => ({ ...prev, nom_traitant: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   placeholder="Nom du responsable COP"
                 />
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium mb-2">Notes internes</label>
               <textarea
                 value={formData.notes_internes || ''}
                 onChange={(e) => setFormData(prev => ({ ...prev, notes_internes: e.target.value }))}
                 className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 rows={2}
                 placeholder="Notes pour l'équipe COP..."
               />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-2">Source de la demande</label>
                 <select
                   value={formData.source_demande || 'direct'}
                   onChange={(e) => setFormData(prev => ({ ...prev, source_demande: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="direct">Contact direct</option>
                   <option value="email">Email</option>
                   <option value="telephone">Téléphone</option>
                   <option value="partenaire">Partenaire</option>
                   <option value="site_web">Site web</option>
                   <option value="visite">Visite entreprise</option>
                 </select>
               </div>
               
               <div>
                 <label className="block text-sm font-medium mb-2">Statut</label>
                 <select
                   value={formData.statut || 'nouvelle'}
                   onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                   className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="nouvelle">Nouvelle</option>
                   <option value="en_traitement">En traitement</option>
                   <option value="traitee">Traitée</option>
                   <option value="fermee">Fermée</option>
                   <option value="annulee">Annulée</option>
                 </select>
               </div>
             </div>
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
               onClick={handleSave}
               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
             >
               <Save className="w-4 h-4 mr-2" />
               {formData.id ? 'Modifier' : 'Créer'}
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 )
}