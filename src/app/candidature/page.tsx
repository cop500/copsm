'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
// Temporarily use simple HTML elements instead of UI components
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSettings } from '@/hooks/useSettings'
import { Upload, Send, CheckCircle } from 'lucide-react'

interface DemandeEntreprise {
  id: string
  entreprise_nom: string
  secteur: string
  contact_nom: string
  contact_email: string
  profils: any[]
  evenement_type: string
  evenement_date?: string
  type_demande: string
  created_at: string
  statut?: string
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
  cv_url: string
  entreprise_nom: string
  poste: string
  type_contrat?: string
  date_candidature?: string
  source_offre?: string
  statut_candidature?: string
  created_at?: string
  updated_at?: string
}

const CandidaturePage = () => {
  const { poles, filieres, loading: settingsLoading } = useSettings()
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([])
  const [selectedDemande, setSelectedDemande] = useState<DemandeEntreprise | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Formulaire
  const [formData, setFormData] = useState<Partial<Candidature>>({
    nom: '',
    prenom: '',
    filiere_id: '',
    pole_id: '',
    email: '',
    telephone: '',
    entreprise_nom: '',
    poste: '',
    type_contrat: '',
    source_offre: 'Site web COP'
  })
  
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Charger les demandes actives
  const loadDemandes = async () => {
    try {
      const { data, error } = await supabase
        .from('demandes_entreprises')
        .select('*')
        .in('statut', ['en_cours', 'en_attente'])
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setDemandes(data || [])
    } catch (err) {
      console.error('Erreur chargement demandes:', err)
      setError('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDemandes()
  }, [])

  // Upload du CV
  const handleFileUpload = async (file: File) => {
    if (!file) return null
    
    try {
      setUploading(true)
      
      // Vérifier le type de fichier
      if (file.type !== 'application/pdf') {
        throw new Error('Seuls les fichiers PDF sont acceptés')
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Le fichier est trop volumineux (max 5MB)')
      }
      
      const fileName = `cv_${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('cv-stagiaires')
        .upload(fileName, file)
      
      if (error) throw error
      
      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from('cv-stagiaires')
        .getPublicUrl(fileName)
      
      return urlData.publicUrl
    } catch (err: any) {
      console.error('Erreur upload:', err)
      setError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  // Soumettre la candidature
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDemande || !cvFile) {
      setError('Veuillez sélectionner une demande et uploader votre CV')
      return
    }
    
    try {
      setSubmitting(true)
      setError(null)
      
      // Upload du CV
      const cvUrl = await handleFileUpload(cvFile)
      if (!cvUrl) {
        setError('Erreur lors de l\'upload du CV')
        return
      }
      
      // Vérifier si candidature déjà existante (par email et entreprise)
      const { data: existingCandidature } = await supabase
        .from('candidatures_stagiaires')
        .select('id')
        .eq('entreprise_nom', selectedDemande.entreprise_nom)
        .eq('poste', selectedDemande.profils?.[0]?.poste_intitule || 'Stage')
        .single()
      
      if (existingCandidature) {
        setError('Vous avez déjà postulé à cette demande')
        return
      }
      
      // Insérer la candidature
      const { error } = await supabase
        .from('candidatures_stagiaires')
        .insert([{
          demande_cv_id: selectedDemande.id,
          nom: formData.nom,
          prenom: formData.prenom,
          filiere_id: formData.filiere_id,
          pole_id: formData.pole_id,
          email: formData.email,
          telephone: formData.telephone,
          cv_url: cvUrl,
          entreprise_nom: selectedDemande.entreprise_nom,
          poste: selectedDemande.profils?.[0]?.poste_intitule || 'Stage',
          type_contrat: selectedDemande.type_demande,
          date_candidature: new Date().toISOString().split('T')[0],
          source_offre: 'Site web COP',
          statut_candidature: 'envoye'
        }])
      
      if (error) throw error
      
      setSuccess(true)
      setFormData({
        nom: '',
        prenom: '',
        filiere_id: '',
        pole_id: '',
        email: '',
        telephone: '',
        entreprise_nom: '',
        poste: '',
        type_contrat: '',
        source_offre: 'Site web COP'
      })
      setCvFile(null)
      setSelectedDemande(null)
      
    } catch (err: any) {
      console.error('Erreur soumission:', err)
      setError(err.message || 'Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  // Filtres pour les filières selon le pôle sélectionné
  const selectedPole = poles.find(p => p.id === formData.pole_id)
  const filteredFilieres = filieres.filter(f => f.pole_id === formData.pole_id)

  if (loading || settingsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center py-12">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Candidature envoyée avec succès !</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Votre candidature a été reçue. Nous vous contacterons bientôt.
            </p>
            <button 
              onClick={() => setSuccess(false)}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Postuler à une autre demande
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ESPACE Candidature
            </h1>
            <h2 className="text-2xl font-semibold text-indigo-600 mb-2">
              COP CMC SM
            </h2>
            <p className="text-xl text-gray-600 font-medium">
              DÉPOSER VOTRE CANDIDATURE
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Liste des demandes */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Demandes disponibles</h2>
                <p className="text-gray-600">Sélectionnez une offre pour postuler</p>
              </div>
              <div className="space-y-4">
                {demandes.map((demande) => (
                  <div
                    key={demande.id}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedDemande?.id === demande.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedDemande(demande)}
                  >
                    <h3 className="font-bold text-xl text-gray-900 mb-2">{demande.entreprise_nom}</h3>
                    <p className="text-gray-600 mb-3">{demande.secteur}</p>
                    <div className="flex justify-between text-sm">
                      <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                        {demande.type_demande}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        {demande.evenement_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulaire de candidature */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Formulaire de candidature</h2>
                <p className="text-gray-600">Remplissez vos informations personnelles</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Informations personnelles */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nom" className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      id="nom"
                      type="text"
                      required
                      value={formData.nom || ''}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Votre nom"
                    />
                  </div>

                  <div>
                    <label htmlFor="prenom" className="block text-sm font-semibold text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      id="prenom"
                      type="text"
                      required
                      value={formData.prenom || ''}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Votre prénom"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pole" className="block text-sm font-semibold text-gray-700 mb-2">
                      Pôle *
                    </label>
                    <select
                      id="pole"
                      required
                      value={formData.pole_id || ''}
                      onChange={(e) => setFormData({ ...formData, pole_id: e.target.value, filiere_id: '' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Sélectionnez un pôle</option>
                      {poles.map((pole) => (
                        <option key={pole.id} value={pole.id}>
                          {pole.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="filiere" className="block text-sm font-semibold text-gray-700 mb-2">
                      Filière *
                    </label>
                    <select
                      id="filiere"
                      required
                      value={formData.filiere_id || ''}
                      onChange={(e) => setFormData({ ...formData, filiere_id: e.target.value })}
                      disabled={!formData.pole_id}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50"
                    >
                      <option value="">Sélectionnez une filière</option>
                      {filteredFilieres.map((filiere) => (
                        <option key={filiere.id} value={filiere.id}>
                          {filiere.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Adresse email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="votre.email@exemple.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="telephone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Numéro de téléphone *
                    </label>
                    <input
                      id="telephone"
                      type="tel"
                      required
                      value={formData.telephone || ''}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>

                {/* Informations de la demande */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de l'offre sélectionnée</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Entreprise</label>
                      <input
                        type="text"
                        disabled
                        value={selectedDemande?.entreprise_nom || 'Aucune offre sélectionnée'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Poste</label>
                      <input
                        type="text"
                        disabled
                        value={selectedDemande?.profils?.[0]?.poste_intitule || 'Stage'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Upload CV */}
                <div>
                  <label htmlFor="cv" className="block text-sm font-semibold text-gray-700 mb-2">
                    CV (PDF uniquement) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
                    <input
                      id="cv"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      required
                      className="hidden"
                    />
                    <label htmlFor="cv" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        {cvFile ? cvFile.name : 'Cliquez pour sélectionner votre CV'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Format PDF uniquement, max 5MB
                      </p>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || uploading || !selectedDemande}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg transition-colors"
                >
                  {submitting || uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      {uploading ? 'Upload en cours...' : 'Envoi en cours...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6 mr-3" />
                      Envoyer ma candidature
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CandidaturePage 