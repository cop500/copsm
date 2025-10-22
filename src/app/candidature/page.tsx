'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
import { 
  User, Mail, Phone, MapPin, FileText, Upload, 
  Building2, Briefcase, Calendar, Send, CheckCircle,
  AlertCircle, Loader2, Search, Filter
} from 'lucide-react'

interface DemandeEntreprise {
  id: string
  entreprise_nom: string
  secteur: string
  entreprise_ville: string
  contact_nom: string
  contact_email: string
  profils: Array<{
    pole_id: string
    filiere_id: string
    poste_intitule: string
    poste_description: string
    competences: string
    type_contrat: string
    salaire: string
    duree: string
  }>
  created_at: string
}

interface FormData {
  nom: string
  prenom: string
  email: string
  telephone: string
  ville: string
  demande_id: string
  profil_selectionne: string
  cv_file: File | null
  lettre_motivation: string
}

export default function CandidaturePage() {
  const { poles, filieres } = useSettings()
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPole, setSelectedPole] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')

  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    ville: '',
    demande_id: '',
    profil_selectionne: '',
    cv_file: null,
    lettre_motivation: ''
  })

  // Charger les demandes d'entreprises
  const loadDemandes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('demandes_entreprises')
        .select('*')
        .eq('type_demande', 'cv')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDemandes(data || [])
    } catch (err: any) {
      console.error('Erreur chargement demandes:', err)
      setError('Erreur lors du chargement des offres')
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les demandes
  const filteredDemandes = demandes.filter(demande => {
    const matchesSearch = !searchTerm || 
      demande.entreprise_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.secteur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.profils.some(profil => 
        profil.poste_intitule.toLowerCase().includes(searchTerm.toLowerCase())
      )

    const matchesPole = !selectedPole || 
      demande.profils.some(profil => profil.pole_id === selectedPole)

    const matchesFiliere = !selectedFiliere || 
      demande.profils.some(profil => profil.filiere_id === selectedFiliere)

    return matchesSearch && matchesPole && matchesFiliere
  })

  // Obtenir les filières pour un pôle
  const getFilieresForPole = (poleId: string) => {
    return filieres.filter(f => f.pole_id === poleId)
  }

  // Obtenir le nom d'un pôle
  const getPoleName = (poleId: string) => {
    return poles.find(p => p.id === poleId)?.nom || 'Pôle inconnu'
  }

  // Obtenir le nom d'une filière
  const getFiliereName = (filiereId: string) => {
    return filieres.find(f => f.id === filiereId)?.nom || 'Filière inconnue'
  }

  // Gérer la sélection d'une demande
  const handleSelectDemande = (demande: DemandeEntreprise, profilIndex: number) => {
    setFormData(prev => ({
      ...prev,
      demande_id: demande.id,
      profil_selectionne: `${demande.id}_${profilIndex}`
    }))
  }

  // Gérer le changement de fichier CV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, cv_file: file }))
  }

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.cv_file) {
      setError('Veuillez sélectionner un fichier CV')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // 1. Upload du CV
      const filePath = `candidatures/${Date.now()}_${formData.cv_file.name}`
      const { error: uploadError } = await supabase.storage
        .from('fichiers')
        .upload(filePath, formData.cv_file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('fichiers')
        .getPublicUrl(filePath)

      // 2. Récupérer les détails de la demande et du profil
      const [demandeId, profilIndex] = formData.profil_selectionne.split('_')
      const demande = demandes.find(d => d.id === demandeId)
      const profil = demande?.profils[parseInt(profilIndex)]

      if (!demande || !profil) {
        throw new Error('Demande ou profil introuvable')
      }

      // 3. Insérer la candidature
      const { error: insertError } = await supabase
        .from('candidatures_stagiaires')
        .insert([{
          demande_cv_id: demandeId,
          entreprise_nom: demande.entreprise_nom,
          poste: profil.poste_intitule,
          type_contrat: profil.type_contrat,
          date_candidature: new Date().toISOString().split('T')[0],
          source_offre: 'Site web',
          statut_candidature: 'envoye',
          cv_url: publicUrlData.publicUrl,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone,
          feedback_entreprise: formData.lettre_motivation
        }])

      if (insertError) throw insertError

      setSuccess(true)
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        ville: '',
        demande_id: '',
        profil_selectionne: '',
        cv_file: null,
        lettre_motivation: ''
      })

    } catch (err: any) {
      console.error('Erreur soumission candidature:', err)
      setError('Erreur lors de l\'envoi de votre candidature: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadDemandes()
  }, [])

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Candidature envoyée !</h2>
          <p className="text-gray-600 mb-6">
            Votre candidature a été transmise avec succès à l'entreprise. 
            Vous recevrez une réponse dans les plus brefs délais.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Déposer une autre candidature
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Candidature aux offres d'emploi
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez les offres d'emploi et de stage proposées par nos entreprises partenaires 
            et déposez votre candidature en quelques clics.
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtrer les offres</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Entreprise, poste, secteur..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pôle</label>
              <select
                value={selectedPole}
                onChange={(e) => {
                  setSelectedPole(e.target.value)
                  setSelectedFiliere('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les pôles</option>
                {poles.map(pole => (
                  <option key={pole.id} value={pole.id}>{pole.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
              <select
                value={selectedFiliere}
                onChange={(e) => setSelectedFiliere(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedPole}
              >
                <option value="">Toutes les filières</option>
                {getFilieresForPole(selectedPole).map(filiere => (
                  <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedPole('')
                  setSelectedFiliere('')
                }}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des offres */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement des offres...</p>
            </div>
          ) : filteredDemandes.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune offre disponible</h3>
              <p className="text-gray-500">
                {searchTerm || selectedPole || selectedFiliere 
                  ? 'Aucune offre ne correspond à vos critères de recherche.'
                  : 'Aucune offre d\'emploi n\'est actuellement disponible.'
                }
              </p>
            </div>
          ) : (
            filteredDemandes.map((demande) => (
              <div key={demande.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      {demande.entreprise_nom}
                    </h3>
                    <p className="text-gray-600">{demande.secteur} • {demande.ville}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Contact: {demande.contact_nom} • {demande.contact_email}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    Publié le {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="space-y-4">
                  {demande.profils.map((profil, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{profil.poste_intitule}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Pôle:</strong> {getPoleName(profil.pole_id)}</p>
                              <p><strong>Filière:</strong> {getFiliereName(profil.filiere_id)}</p>
                              <p><strong>Type de contrat:</strong> {profil.type_contrat}</p>
                            </div>
                            <div>
                              <p><strong>Durée:</strong> {profil.duree}</p>
                              {profil.salaire && <p><strong>Salaire:</strong> {profil.salaire}</p>}
                            </div>
                          </div>
                          {profil.poste_description && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-700">
                                <strong>Description:</strong> {profil.poste_description}
                              </p>
                            </div>
                          )}
                          {profil.competences && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-700">
                                <strong>Compétences requises:</strong> {profil.competences}
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleSelectDemande(demande, index)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Postuler
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Formulaire de candidature */}
        {formData.demande_id && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Déposer votre candidature</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                      <input
                        type="text"
                        value={formData.prenom}
                        onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                    <input
                      type="text"
                      value={formData.ville}
                      onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CV (PDF) *</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lettre de motivation</label>
                    <textarea
                      value={formData.lettre_motivation}
                      onChange={(e) => setFormData(prev => ({ ...prev, lettre_motivation: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Décrivez votre motivation pour ce poste..."
                    />
                  </div>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, demande_id: '', profil_selectionne: '' }))}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Envoyer la candidature
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
