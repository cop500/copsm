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
  stagiaire_id?: string
  cv_envoye_id?: string
  entreprise_nom: string
  poste: string
  type_contrat?: string
  date_candidature?: string
  source_offre?: string
  statut_candidature?: string
  date_derniere_maj?: string
  prochaine_action?: string
  date_prochaine_action?: string
  resultat_final?: string
  date_resultat?: string
  motif_refus?: string
  feedback_entreprise?: string
  created_at?: string
  updated_at?: string
}

const CandidaturePage = () => {
  const { loading: settingsLoading } = useSettings()
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([])
  const [selectedDemande, setSelectedDemande] = useState<DemandeEntreprise | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Formulaire
  const [formData, setFormData] = useState<Partial<Candidature>>({
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
          entreprise_nom: selectedDemande.entreprise_nom,
          poste: selectedDemande.profils?.[0]?.poste_intitule || 'Stage',
          type_contrat: selectedDemande.type_demande,
          date_candidature: new Date().toISOString().split('T')[0],
          source_offre: 'Site web COP',
          statut_candidature: 'envoye',
          date_derniere_maj: new Date().toISOString().split('T')[0]
        }])
      
      if (error) throw error
      
      setSuccess(true)
      setFormData({
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

  // Pas besoin de filtres pôle/filière pour cette structure
  const selectedPole = null
  const filteredFilieres = []

  if (loading || settingsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Candidature envoyée avec succès !</h2>
            <p className="text-gray-600 mb-6">
              Votre candidature a été reçue. Nous vous contacterons bientôt.
            </p>
            <button 
              onClick={() => setSuccess(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Postuler à une autre demande
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Candidature Stagiaire</h1>
          <p className="text-gray-600">
            Postulez aux demandes d'entreprises pour vos stages
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Liste des demandes */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Demandes disponibles</h2>
            </div>
            <div className="space-y-3">
              {demandes.map((demande) => (
                <div
                  key={demande.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDemande?.id === demande.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDemande(demande)}
                >
                  <h3 className="font-semibold text-lg">{demande.entreprise_nom}</h3>
                  <p className="text-sm text-gray-600 mb-2">{demande.secteur}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{demande.type_demande}</span>
                    <span>{demande.evenement_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulaire de candidature */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Formulaire de candidature</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="entreprise" className="block text-sm font-medium mb-2">Entreprise sélectionnée</label>
                <input
                  id="entreprise"
                  type="text"
                  disabled
                  value={selectedDemande?.entreprise_nom || ''}
                  className="w-full px-3 py-2 border rounded bg-gray-50"
                />
              </div>

              <div>
                <label htmlFor="poste" className="block text-sm font-medium mb-2">Poste</label>
                <input
                  id="poste"
                  type="text"
                  disabled
                  value={selectedDemande?.profils?.[0]?.poste_intitule || 'Stage'}
                  className="w-full px-3 py-2 border rounded bg-gray-50"
                />
              </div>

              <div>
                <label htmlFor="type_contrat" className="block text-sm font-medium mb-2">Type de contrat</label>
                <input
                  id="type_contrat"
                  type="text"
                  disabled
                  value={selectedDemande?.type_demande || ''}
                  className="w-full px-3 py-2 border rounded bg-gray-50"
                />
              </div>

              <div>
                <label htmlFor="cv" className="block text-sm font-medium mb-2">CV (PDF) *</label>
                <div className="mt-1">
                  <input
                    id="cv"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    required
                    className="w-full px-3 py-2 border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format PDF uniquement, max 5MB
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || uploading || !selectedDemande}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting || uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {uploading ? 'Upload en cours...' : 'Envoi en cours...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Postuler à cette offre
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CandidaturePage 