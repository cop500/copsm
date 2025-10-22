'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
import { 
  User, Mail, Phone, MapPin, FileText, Upload, 
  Building2, Briefcase, Calendar, Send, CheckCircle,
  AlertCircle, Loader2
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
  pole_id: string
  filiere_id: string
  demande_id: string
  profil_selectionne: string
  cv_file: File | null
}

export default function CandidaturePage() {
  const { poles, filieres } = useSettings()
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    pole_id: '',
    filiere_id: '',
    demande_id: '',
    profil_selectionne: '',
    cv_file: null
  })

  // Charger les demandes d'entreprises en statut "en attente"
  const loadDemandes = useCallback(async () => {
    try {
      setLoading(true)
      
      // Essayer d'abord demandes_entreprises avec filtre de statut
      const { data: dataEntreprises, error: errorEntreprises } = await supabase
        .from('demandes_entreprises')
        .select('*')
        .eq('type_demande', 'cv')
        .or('statut.in.(en_cours,en_attente),statut.is.null')
        .order('created_at', { ascending: false })

      // Essayer aussi demandes_cv avec filtre de statut
      const { data: dataCV, error: errorCV } = await supabase
        .from('demandes_cv')
        .select('*')
        .or('statut.in.(en_cours,en_attente),statut.is.null')
        .order('created_at', { ascending: false })

      if (errorEntreprises && errorCV) {
        throw new Error('Erreur lors du chargement des demandes')
      }

      // Combiner les deux sources de données
      const allDemandes = [
        ...(dataEntreprises || []).map(d => ({ ...d, source: 'entreprises' })),
        ...(dataCV || []).map(d => ({ ...d, source: 'cv' }))
      ]
      
      console.log('Demandes trouvées:', {
        entreprises: dataEntreprises?.length || 0,
        cv: dataCV?.length || 0,
        total: allDemandes.length
      })
      
      setDemandes(allDemandes)
    } catch (err: any) {
      console.error('Erreur chargement demandes:', err)
      setError('Erreur lors du chargement des offres')
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtenir le nom d'un pôle (mémorisé)
  const getPoleName = useCallback((poleId: string) => {
    return poles.find(p => p.id === poleId)?.nom || 'Pôle inconnu'
  }, [poles])

  // Obtenir le nom d'une filière (mémorisé)
  const getFiliereName = useCallback((filiereId: string) => {
    return filieres.find(f => f.id === filiereId)?.nom || 'Filière inconnue'
  }, [filieres])

  // Filtrer les filières par pôle sélectionné
  const filteredFilieres = useMemo(() => {
    if (!formData.pole_id) return filieres
    return filieres.filter(f => f.pole_id === formData.pole_id)
  }, [filieres, formData.pole_id])

  // Réinitialiser la filière quand le pôle change
  const handlePoleChange = (poleId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      pole_id: poleId,
      filiere_id: '' // Réinitialiser la filière
    }))
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
        .from('avatars')
        .upload(filePath, formData.cv_file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 2. Récupérer les détails de la demande et du profil
      const [demandeId, profilIndex] = formData.profil_selectionne.split('_')
      const demande = demandes.find(d => d.id === demandeId)
      
      if (!demande) {
        throw new Error('Demande introuvable')
      }

      // 3. Préparer les données selon le type de demande (structure conforme à la table)
      let candidatureData: any = {
        // demande_cv_id sera null car nous n'avons pas d'UUID valide
        demande_cv_id: null,
        date_candidature: new Date().toISOString().split('T')[0],
        source_offre: 'Site web',
        statut_candidature: 'envoye',
        cv_url: publicUrlData.publicUrl,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        type_contrat: 'cv'
        // created_at et updated_at sont gérés automatiquement par Supabase
      }

      if (demande.source === 'entreprises' && demande.profils) {
        // Demande avec profils détaillés
        const profil = demande.profils[parseInt(profilIndex)]
        if (!profil) {
          throw new Error('Profil introuvable')
        }
        candidatureData = {
          ...candidatureData,
          entreprise_nom: demande.entreprise_nom,
          poste: profil.poste_intitule,
          type_contrat: profil.type_contrat
        }
      } else {
        // Demande CV simple
        candidatureData = {
          ...candidatureData,
          entreprise_nom: demande.nom_entreprise || demande.entreprise_nom,
          poste: demande.poste_recherche || 'Poste à définir',
          type_contrat: 'À définir'
        }
      }

      // 4. Insérer la candidature via API route (contourne RLS)
      const response = await fetch('/api/candidatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(candidatureData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'enregistrement')
      }

      const result = await response.json()

      setSuccess(true)
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        pole_id: '',
        filiere_id: '',
        demande_id: '',
        profil_selectionne: '',
        cv_file: null
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md border border-gray-200">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Candidature envoyée !</h2>
          <p className="text-gray-600 mb-6 text-lg">
            Votre candidature a été transmise avec succès à l'entreprise. 
            Vous recevrez une réponse dans les plus brefs délais.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setSuccess(false)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Déposer une autre candidature
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Candidature aux offres d'emploi
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez les offres d'emploi et de stage disponibles et déposez votre candidature.
          </p>
        </div>

        {/* Liste des offres */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement des offres...</p>
            </div>
          ) : demandes.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune offre disponible</h3>
              <p className="text-gray-500">
                Aucune offre d'emploi n'est actuellement disponible.
              </p>
            </div>
          ) : (
            demandes.map((demande) => (
              <div key={demande.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="space-y-4">
                  {demande.source === 'entreprises' && demande.profils ? (
                    // Demandes avec profils détaillés
                    demande.profils.map((profil, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-blue-600" />
                              {demande.entreprise_nom}
                            </h3>
                            <h4 className="font-medium text-gray-800 mt-1">{profil.poste_intitule}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Pôle:</strong> {getPoleName(profil.pole_id)} • <strong>Filière:</strong> {getFiliereName(profil.filiere_id)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleSelectDemande(demande, index)}
                            className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Postuler
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Demandes CV simples
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            {demande.nom_entreprise || demande.entreprise_nom}
                          </h3>
                          <h4 className="font-medium text-gray-800 mt-1">{demande.poste_recherche || 'Poste à définir'}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Contact:</strong> {demande.contact_nom} • <strong>Email:</strong> {demande.contact_email}
                          </p>
                          {demande.description && (
                            <p className="text-sm text-gray-500 mt-2">{demande.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleSelectDemande(demande, 0)}
                          className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Postuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Formulaire de candidature */}
        {formData.demande_id && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white relative overflow-hidden">
              {/* Background avec motifs professionnels */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-stone-50 to-amber-50 opacity-90"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.02)_25%,rgba(0,0,0,0.02)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.02)_75%)] bg-[length:20px_20px]"></div>
              <div className="relative z-10 mt-3">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Déposer votre candidature</h3>
                
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pôle *</label>
                      <select
                        value={formData.pole_id}
                        onChange={(e) => handlePoleChange(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionner un pôle</option>
                        {poles.map((pole) => (
                          <option key={pole.id} value={pole.id}>
                            {pole.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Filière *</label>
                      <select
                        value={formData.filiere_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, filiere_id: e.target.value }))}
                        required
                        disabled={!formData.pole_id}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {formData.pole_id ? "Sélectionner une filière" : "Sélectionnez d'abord un pôle"}
                        </option>
                        {filteredFilieres.map((filiere) => (
                          <option key={filiere.id} value={filiere.id}>
                            {filiere.nom}
                          </option>
                        ))}
                      </select>
                    </div>
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

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-6 border-t border-gray-200">
                    <div className="flex gap-3">
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
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Envoyer ma candidature
                          </>
                        )}
                      </button>
                    </div>
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