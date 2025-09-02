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
  nom_entreprise: string
  poste_recherche: string
  contact_nom: string
  contact_email: string
  type_contrat: string
  filiere_id: string
  pole_id: string
  niveau_requis: string
  competences_requises: string
  description_poste: string
  lieu_travail: string
  salaire_propose: string
  date_limite: string
  urgence: string
  statut: string
  created_at: string
  updated_at: string
  profils?: Array<{
    poste_intitule: string
    [key: string]: any
  }>
  all_profils?: Array<{
    poste_intitule: string
    [key: string]: any
  }>
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

  // Charger les demandes entreprises actives
  const loadDemandes = async () => {
    try {
      console.log('🔍 Chargement des demandes entreprises...')
      
      // Charger les demandes entreprises
      const { data: demandesEntreprises, error: errorEntreprises } = await supabase
        .from('demandes_entreprises')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (errorEntreprises) throw errorEntreprises
      
      console.log('🏢 Toutes les demandes entreprises:', demandesEntreprises?.length || 0)
      
      // Filtrer les demandes entreprises actives
      const activeDemandesEntreprises = demandesEntreprises?.filter(d => 
        d.statut === 'nouvelle' || 
        d.statut === 'en_cours' || 
        d.statut === 'en_attente' || 
        !d.statut || 
        d.statut === ''
      ) || []
      
      // Formater les demandes
      const allActiveDemandes = activeDemandesEntreprises.map(d => {
        // Récupérer tous les postes des profils
        const postes = d.profils?.map(profil => profil.poste_intitule).filter(Boolean) || []
        const display_poste = postes.length > 0 
          ? postes.join(' • ') 
          : 'Stage'
        
        return {
        ...d,
        type: 'entreprise',
        display_nom: d.entreprise_nom,
          display_poste: display_poste,
          display_type: d.type_demande,
          // Garder les profils complets pour référence
          all_profils: d.profils || []
        }
      })
      
      console.log('✅ Demandes entreprises actives:', allActiveDemandes.length)
      console.log('📋 Statuts trouvés:', [...new Set(activeDemandesEntreprises.map(d => d.statut))])
      
      setDemandes(allActiveDemandes)
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
      console.log('Début upload CV:', file.name)
      
      // Vérifier le type de fichier
      if (file.type !== 'application/pdf') {
        throw new Error('Seuls les fichiers PDF sont acceptés')
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Le fichier est trop volumineux (max 5MB)')
      }
      
      // Nettoyer le nom du fichier pour éviter les caractères spéciaux
      const cleanFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Remplacer les caractères spéciaux par des underscores
        .replace(/_{2,}/g, '_') // Remplacer les underscores multiples par un seul
        .replace(/^_|_$/g, '') // Supprimer les underscores au début et à la fin
      
      const fileName = `cv_${Date.now()}_${cleanFileName}`
      console.log('Tentative upload vers bucket cv-stagiaires:', fileName)
      
      const { data, error } = await supabase.storage
        .from('cv-stagiaires')
        .upload(fileName, file)
      
      if (error) {
        console.error('Erreur upload Supabase:', error)
        throw new Error(`Erreur upload: ${error.message}`)
      }
      
      console.log('Upload réussi, récupération URL publique')
      
      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from('cv-stagiaires')
        .getPublicUrl(fileName)
      
      console.log('URL publique récupérée:', urlData.publicUrl)
      return urlData.publicUrl
    } catch (err: any) {
      console.error('Erreur upload complète:', err)
      setError(`Erreur upload CV: ${err.message}`)
      return null
    } finally {
      setUploading(false)
    }
  }

  // Soumettre la candidature
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Début soumission candidature')
    console.log('Demande sélectionnée:', selectedDemande)
    console.log('CV file:', cvFile)
    
    if (!selectedDemande || !cvFile) {
      setError('Veuillez sélectionner une demande et uploader votre CV')
      return
    }
    
    try {
      setSubmitting(true)
      setError(null)
      
      console.log('Upload du CV en cours...')
      // Upload du CV
      const cvUrl = await handleFileUpload(cvFile)
      if (!cvUrl) {
        console.log('Échec upload CV')
        setError('Erreur lors de l\'upload du CV')
        return
      }
      
      console.log('CV uploadé avec succès:', cvUrl)
      console.log('Vérification candidature existante...')
      
      // Vérifier si candidature déjà existante (par entreprise et poste)
      const { data: existingCandidature, error: checkError } = await supabase
        .from('candidatures_stagiaires')
        .select('id')
        .eq('entreprise_nom', selectedDemande.display_nom)
        .eq('poste', selectedDemande.display_poste)
        .maybeSingle()
      
      if (checkError) {
        console.error('Erreur vérification candidature existante:', checkError)
      }
      
      if (existingCandidature) {
        setError('Vous avez déjà postulé à cette demande')
        return
      }
      
      console.log('Insertion candidature en cours...')
      
             // Insérer la candidature avec les informations personnelles
       const candidatureData = {
         entreprise_nom: selectedDemande.display_nom,
         poste: selectedDemande.display_poste,
         type_contrat: selectedDemande.display_type,
         date_candidature: new Date().toISOString().split('T')[0],
         source_offre: 'Site web COP',
         statut_candidature: 'envoye',
         nom: formData.nom,
         prenom: formData.prenom,
         email: formData.email,
         telephone: formData.telephone,
         cv_url: cvUrl
       }
      
      console.log('Données candidature à insérer:', candidatureData)
      
      const { error: insertError } = await supabase
        .from('candidatures_stagiaires')
        .insert([candidatureData])
      
      if (insertError) {
        console.error('Erreur insertion candidature:', insertError)
        throw new Error(`Erreur insertion: ${insertError.message}`)
      }
      
      console.log('Candidature insérée avec succès')
      
             // Afficher un message de succès avec les informations
       alert(`Candidature envoyée avec succès !
       
 Entreprise: ${selectedDemande.display_nom}
 Poste: ${selectedDemande.display_poste}
 Type: ${selectedDemande.display_type}
 Nom: ${formData.nom}
 Prénom: ${formData.prenom}
 Email: ${formData.email}
 Téléphone: ${formData.telephone}
 
 Votre candidature a été enregistrée et sera traitée dans les plus brefs délais.`)
      
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
      console.error('Erreur soumission complète:', err)
      setError(`Erreur lors de la soumission: ${err.message}`)
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
      <div className="min-h-screen relative">
        {/* Background avec image et overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-blue-900/90">
                  <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: "url('/bg-entreprise.jpg')"
          }}
        ></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center px-4 py-12">
          <div className="max-w-2xl w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/20">
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Candidature envoyée avec succès !</h2>
              <p className="text-gray-600 mb-10 text-xl leading-relaxed">
                Votre candidature a été reçue et sera traitée dans les plus brefs délais. 
                <br />Nous vous contacterons bientôt.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-10 py-4 rounded-2xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Postuler à une autre demande
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background avec image et overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-blue-900/90">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: "url('/bg-entreprise.jpg')"
          }}
        ></div>
      </div>
      
      {/* Contenu principal */}
      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header avec carreau central - Design moderne */}
          <div className="text-center mb-8 sm:mb-16">
            <div className="inline-block p-6 sm:p-10 bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-indigo-900/90 backdrop-blur-md rounded-3xl sm:rounded-[2rem] border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] mb-4 sm:mb-8 relative overflow-hidden">
              {/* Effet de brillance subtil */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
              
              {/* Contenu principal */}
              <div className="relative z-10">
                {/* Titre principal avec typographie moderne */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    ESPACE Candidature
                  </span>
                </h1>
                
                {/* Séparateur élégant avec icône */}
                <div className="flex items-center justify-center mb-4">
                  <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                  <div className="w-3 h-3 bg-blue-300 rounded-full mx-3 shadow-lg"></div>
                  <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                </div>
                
                {/* Sous-titre institutionnel */}
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-blue-200 mb-4 tracking-wide" style={{ fontFamily: 'Lora, serif' }}>
                  <span className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                    COP CMC SM
                  </span>
                </h2>
                
                {/* Ligne de séparation avec dégradé */}
                <div className="w-20 sm:w-28 h-0.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-green-400 mx-auto mb-4 shadow-sm"></div>
                
                {/* Call-to-action */}
                <p className="text-base sm:text-lg lg:text-xl font-medium text-green-200 tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <span className="bg-gradient-to-r from-green-300 via-green-200 to-green-300 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                    DÉPOSER VOTRE CANDIDATURE
                  </span>
                </p>
                
                {/* Éléments décoratifs subtils */}
                <div className="flex justify-center mt-4 space-x-2">
                  <div className="w-1 h-1 bg-blue-300 rounded-full opacity-60"></div>
                  <div className="w-1 h-1 bg-blue-200 rounded-full opacity-40"></div>
                  <div className="w-1 h-1 bg-blue-300 rounded-full opacity-60"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Liste des demandes */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border-2 border-blue-200/50 overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
              {/* Background avec image */}
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
                style={{
                  backgroundImage: "url('/bg-entreprise.jpg')"
                }}
              ></div>
              
              <div className="relative z-10">
                <div className="mb-6 sm:mb-8 text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Demandes disponibles</h2>
                  <p className="text-gray-600 text-base sm:text-lg">Sélectionnez une offre pour postuler</p>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mt-4 mx-auto"></div>
                </div>
              <div className="space-y-4">
                {demandes.map((demande) => (
                  <div
                    key={demande.id}
                    className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                      selectedDemande?.id === demande.id
                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-xl'
                        : 'border-gray-200 hover:border-indigo-400 hover:shadow-lg bg-white/80'
                    }`}
                    onClick={() => setSelectedDemande(demande)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-xl text-gray-900">{demande.display_nom}</h3>
                      {selectedDemande?.id === demande.id && (
                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      {demande.all_profils && demande.all_profils.length > 1 ? (
                        <div>
                          <p className="text-gray-600 font-medium mb-2">Postes disponibles :</p>
                          <div className="space-y-1">
                            {demande.all_profils.map((profil, index) => (
                              <div key={index} className="flex items-center">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                                <span className="text-gray-700">{profil.poste_intitule}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-600">{demande.display_poste}</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 text-sm">
                      <span className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-3 sm:px-4 py-2 rounded-full font-medium shadow-md text-center">
                        {demande.display_type}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-full font-medium text-center">
                        {demande.secteur}
                      </span>
                    </div>
                  </div>
                                 ))}
               </div>
              </div>
            </div>

            {/* Formulaire de candidature */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border-2 border-blue-200/50 overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
              {/* Background avec image */}
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
                style={{
                  backgroundImage: "url('/bg-entreprise.jpg')"
                }}
              ></div>
              
              <div className="relative z-10">
                <div className="mb-6 sm:mb-8 text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Formulaire de candidature</h2>
                  <p className="text-gray-600 text-base sm:text-lg">Remplissez vos informations personnelles</p>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mt-4 mx-auto"></div>
                </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-6 bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 rounded-2xl shadow-lg">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      {error}
                    </div>
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
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    Détails de l'offre sélectionnée
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Entreprise</label>
                      <input
                        type="text"
                        disabled
                        value={selectedDemande?.display_nom || 'Aucune offre sélectionnée'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Poste</label>
                      <input
                        type="text"
                        disabled
                        value={selectedDemande?.display_poste || 'Aucune offre sélectionnée'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Upload CV */}
                <div>
                  <label htmlFor="cv" className="block text-sm font-semibold text-gray-700 mb-3">
                    CV (PDF uniquement) *
                  </label>
                  <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-300 group">
                    <input
                      id="cv"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      required
                      className="hidden"
                    />
                    <label htmlFor="cv" className="cursor-pointer">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-gray-700 mb-2 font-medium text-lg">
                        {cvFile ? cvFile.name : 'Cliquez pour sélectionner votre CV'}
                      </p>
                      <p className="text-sm text-gray-500 mb-2">
                        Format PDF uniquement, max 5MB
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        💡 Conseil : Nommez votre CV "Nom_Prénom_CV.pdf" avant l'upload
                      </p>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || uploading || !selectedDemande}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-5 rounded-2xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {submitting || uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white mr-4"></div>
                      <span className="text-lg">{uploading ? 'Upload en cours...' : 'Envoi en cours...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-7 h-7 mr-4" />
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
    </div>
  )
}

export default CandidaturePage 