'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Save, 
  X, 
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  TrendingUp
} from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'

// Palette de couleurs
const COLORS = {
  blue: '#2563EB',
  blueDark: '#1E3A8A',
  gray: '#E5E7EB',
  grayLight: '#F5F7FA',
  yellow: '#FACC15',
  white: '#FFFFFF',
  grayText: '#6B7280',
  grayDark: '#374151',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444'
}

interface EvenementFormProps {
  evenement?: any
  onSave: (data: any) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string } | void
  onCancel: () => void
  isAdmin: boolean
}

interface FormData {
  id?: string
  titre: string
  description: string
  type_evenement_id: string
  volet: string
  pole_id?: string
  filiere_id?: string
  date_debut: string
  date_fin: string
  lieu: string
  responsable_cop: string
  statut: string
  capacite_maximale: number
  animateur_id?: string
  animateur_nom?: string
  animateur_role?: string
  visible_inscription: boolean
  // Champs pour médias et communication
  image_url?: string
  video_url?: string
  lien_inscription?: string
  notes_internes?: string
  // Champs pour statistiques
  nombre_beneficiaires?: number
  nombre_candidats?: number
  nombre_candidats_retenus?: number
  taux_conversion?: number
}

interface ValidationErrors {
  [key: string]: string
}

const EvenementForm: React.FC<EvenementFormProps> = ({ 
  evenement, 
  onSave, 
  onCancel, 
  isAdmin 
}) => {
  const { eventTypes, poles, filieres } = useSettings()
  
  // Liste des volets
  const volets = [
    { value: 'information_communication', label: 'Information/Communication' },
    { value: 'accompagnement_projets', label: 'Accompagnement des stagiaires dans la réalisation de leur Projets Professionnels' },
    { value: 'assistance_carriere', label: 'Assistance au choix de carrière' },
    { value: 'assistance_filiere', label: 'Assistance au choix de filière' }
  ]

  // États du formulaire
  const [formData, setFormData] = useState<FormData>({
    titre: '',
    description: '',
    type_evenement_id: '',
    volet: '',
    pole_id: '',
    filiere_id: '',
    date_debut: '',
    date_fin: '',
    lieu: '',
    responsable_cop: '',
    statut: 'planifie',
    capacite_maximale: 50,
    animateur_id: '',
    animateur_nom: '',
    animateur_role: '',
    visible_inscription: false,
    image_url: '',
    video_url: '',
    lien_inscription: '',
    notes_internes: '',
    nombre_beneficiaires: 0,
    nombre_candidats: 0,
    nombre_candidats_retenus: 0,
    taux_conversion: 0,
    ...evenement
  })

  // États pour l'upload de photos
  const [photos, setPhotos] = useState<File[]>([])
  const [photosUrls, setPhotosUrls] = useState<string[]>([])

  // Initialiser les photos existantes si on édite un événement
  useEffect(() => {
    if (evenement) {
      // Charger les photos existantes
      if (evenement.photos_urls && Array.isArray(evenement.photos_urls)) {
        setPhotosUrls(evenement.photos_urls)
      } else if (evenement.image_url) {
        setPhotosUrls([evenement.image_url])
      }
    }
  }, [evenement])

  // États pour l'autosave et la validation
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [loading, setLoading] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [progress, setProgress] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const lastServerAutosaveRef = useRef<number>(0)

  // États pour les animateurs
  const [animateurs, setAnimateurs] = useState<any[]>([])
  const [animateurSearch, setAnimateurSearch] = useState('')
  const [showAnimateurDropdown, setShowAnimateurDropdown] = useState(false)

  // Charger les animateurs
  const loadAnimateurs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nom, prenom, role, email')
        .in('role', ['conseiller_cop', 'conseillere_carriere', 'business_developer', 'manager_cop'])
        .eq('actif', true)
        .order('nom')

      if (error) throw error
      setAnimateurs(data || [])
    } catch (error) {
      console.error('Erreur chargement animateurs:', error)
    }
  }, [])

  useEffect(() => {
    loadAnimateurs()
  }, [loadAnimateurs])

  // Calcul du pourcentage de completion
  const calculateProgress = useCallback((data: FormData) => {
    const requiredFields = ['titre', 'type_evenement_id', 'date_debut', 'lieu', 'responsable_cop']
    const optionalFields = ['description', 'date_fin', 'animateur_nom']
    
    const requiredCompleted = requiredFields.filter(field => data[field as keyof FormData]).length
    const optionalCompleted = optionalFields.filter(field => data[field as keyof FormData]).length
    
    const totalFields = requiredFields.length + optionalFields.length
    const completedFields = requiredCompleted + optionalCompleted
    
    return Math.round((completedFields / totalFields) * 100)
  }, [])

  // Validation des champs
  const validateField = useCallback((field: string, value: any): string => {
    switch (field) {
      case 'titre':
        if (!value || value.trim().length < 3) return 'Le titre doit contenir au moins 3 caractères'
        if (value.length > 100) return 'Le titre ne peut pas dépasser 100 caractères'
        break
      case 'type_evenement_id':
        if (!value) return 'Veuillez sélectionner un type d\'événement'
        break
      case 'date_debut':
        if (!value) return 'La date de début est obligatoire'
        break
      case 'date_fin':
        if (value && formData.date_debut) {
          const endDate = new Date(value)
          const startDate = new Date(formData.date_debut)
          if (endDate < startDate) {
            return 'La date de fin doit être après la date de début'
          }
        }
        break
      case 'lieu':
        if (!value || value.trim().length < 2) return 'Le lieu doit contenir au moins 2 caractères'
        break
      case 'responsable_cop':
        if (!value || value.trim().length < 2) return 'Le responsable COP est obligatoire'
        break
      case 'capacite_maximale':
        if (value < 1 || value > 1000) return 'La capacité doit être entre 1 et 1000'
        break
    }
    return ''
  }, [formData.date_debut])

  // Validation complète
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}
    const fieldsToValidate = ['titre', 'type_evenement_id', 'date_debut', 'lieu', 'responsable_cop', 'date_fin', 'capacite_maximale']
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field as keyof FormData])
      if (error) newErrors[field] = error
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, validateField])

  // Autosave local (localStorage)
  const autosaveLocal = useCallback(() => {
    try {
      const draftData = {
        ...formData,
        isDraft: true,
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem('evenement_draft', JSON.stringify(draftData))
      setLastSaved(new Date())
    } catch (error) {
      console.error('Erreur autosave local:', error)
    }
  }, [formData])

  // Autosave serveur - DÉSACTIVÉ pour éviter les erreurs 400
  const autosaveServer = useCallback(async () => {
    // Autosave serveur désactivé pour éviter les erreurs 400
    // Les données sont sauvegardées localement seulement
    setAutosaveStatus('saved')
    setTimeout(() => setAutosaveStatus('idle'), 2000)
  }, [])

  // Sauvegarde automatique
  useEffect(() => {
    const timer = window.setTimeout(() => {
      autosaveLocal()

      const now = Date.now()
      if (now - lastServerAutosaveRef.current > 30000) {
        lastServerAutosaveRef.current = now
        autosaveServer()
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [formData, autosaveLocal, autosaveServer])

  // Restaurer le brouillon au chargement
  useEffect(() => {
    if (!evenement) {
      try {
        const draft = localStorage.getItem('evenement_draft')
        if (draft) {
          const draftData = JSON.parse(draft)
          if (draftData.isDraft) {
            setFormData(prev => ({ ...prev, ...draftData }))
            setLastSaved(new Date(draftData.lastSaved))
          }
        }
      } catch (error) {
        console.error('Erreur restauration brouillon:', error)
      }
    }
  }, [evenement])

  // Mise à jour du progrès
  useEffect(() => {
    setProgress(calculateProgress(formData))
  }, [formData, calculateProgress])

  // Gestion des changements de formulaire
  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Validation en temps réel
    const error = validateField(field, value)
    setErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }, [validateField])

  // Gestion de la sélection d'animateur
  const handleAnimateurSelect = useCallback((animateur: any) => {
    setFormData(prev => ({
      ...prev,
      animateur_id: animateur.id,
      animateur_nom: `${animateur.prenom} ${animateur.nom}`,
      animateur_role: animateur.role
    }))
    setAnimateurSearch('')
    setShowAnimateurDropdown(false)
  }, [])

  // Upload des photos
  const handlePhotoUpload = useCallback((files: FileList | null) => {
    if (!files) return

    const newPhotos: File[] = []
    const maxPhotos = 5 - photos.length

    for (let i = 0; i < Math.min(files.length, maxPhotos); i++) {
      const file = files[i]
      
      // Validation du type de fichier
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photos: 'Seules les images sont acceptées' }))
        continue
      }
      
      // Validation de la taille (max 5MB par image)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photos: 'Chaque image doit faire moins de 5MB' }))
        continue
      }

      newPhotos.push(file)
    }

    if (newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos])
      setErrors(prev => ({ ...prev, photos: '' }))
    }
  }, [photos.length])

  // Supprimer une photo
  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Filtrage des animateurs
  const filteredAnimateurs = useMemo(() => {
    if (!animateurSearch) return animateurs.slice(0, 5)
    return animateurs.filter(animateur => 
      `${animateur.prenom} ${animateur.nom}`.toLowerCase().includes(animateurSearch.toLowerCase()) ||
      animateur.email.toLowerCase().includes(animateurSearch.toLowerCase())
    ).slice(0, 5)
  }, [animateurs, animateurSearch])

  // Upload des photos vers Supabase Storage (comme l'ancien formulaire)
  const uploadPhotos = useCallback(async (): Promise<string[]> => {
    if (photos.length === 0) return []

    const uploadedUrls: string[] = []
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      const fileName = `evenements/${Date.now()}_${i}_${photo.name}`
      
      try {
        console.log('📸 Upload photo:', fileName, 'Taille:', photo.size, 'Type:', photo.type)
        
        const { data, error } = await supabase.storage
          .from('photos')
          .upload(fileName, photo, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (error) {
          console.error('❌ Erreur upload:', error)
          console.error('❌ Détails erreur:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            statusCode: error.statusCode
          })
          throw error
        }
        
        console.log('✅ Upload réussi:', fileName)
        
        // Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName)
        
        uploadedUrls.push(urlData.publicUrl)
      } catch (err) {
        console.error('❌ Erreur upload photo:', fileName, err)
        throw err
      }
    }
    
    return uploadedUrls
  }, [photos])

  // Sauvegarde finale
  const handleFinalSave = useCallback(async () => {
    if (!validateForm()) {
      setSubmitError('Veuillez corriger les erreurs indiquées avant de sauvegarder.')
      return
    }

    setSubmitError(null)
    setLoading(true)
    setAutosaveStatus('idle')

    try {
      const cleanData = {
        // IMPORTANT: Préserver l'ID pour la modification
        ...(formData.id && { id: formData.id }),
        
        // Champs de base
        titre: formData.titre,
        description: formData.description,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin || null,
        lieu: formData.lieu,
        responsable_cop: formData.responsable_cop,
        statut: formData.statut || 'planifie',
        type_evenement_id: formData.type_evenement_id || null,
        
        // Champs optionnels (convertir les chaînes vides en null pour les UUID)
        volet: formData.volet,
        pole_id: formData.pole_id || null,
        filiere_id: formData.filiere_id || null,
        nombre_beneficiaires: formData.nombre_beneficiaires,
        nombre_candidats: formData.nombre_candidats,
        nombre_candidats_retenus: formData.nombre_candidats_retenus,
        taux_conversion: formData.taux_conversion,
        
        // Champs système
        type_evenement: 'evenement',
        actif: true
      }

      // Upload des nouvelles photos d'abord (comme l'ancien formulaire)
      let newPhotosUrls: string[] = []
      
      if (photos.length > 0) {
        try {
          console.log('📸 Début upload photos, nombre:', photos.length)
          newPhotosUrls = await uploadPhotos()
          console.log('✅ Tous les uploads terminés, URLs:', newPhotosUrls)
        } catch (uploadError) {
          console.error('❌ Erreur upload photos, on continue sans photos:', uploadError)
          // Continuer sans les photos plutôt que d'échouer complètement
          newPhotosUrls = []
        }
      }

      // Combiner les photos existantes avec les nouvelles
      const allPhotosUrls = [...photosUrls, ...newPhotosUrls]

      // Préparer les données à sauvegarder (comme l'ancien formulaire)
      const eventData = {
        ...cleanData,
        // Ajouter toutes les photos (existantes + nouvelles) seulement si disponibles
        ...(allPhotosUrls.length > 0 && {
          photos_urls: allPhotosUrls,
          image_url: allPhotosUrls[0] // Première photo comme image principale
        })
      }

      // Sauvegarder l'événement avec les photos
      const result = await onSave(eventData)
      const saveResult = (result && typeof result === 'object' && 'success' in result)
        ? result as { success: boolean; error?: string }
        : { success: true }

      if (!saveResult.success) {
        setSubmitError(saveResult.error || 'Impossible d\'enregistrer l\'événement. Veuillez réessayer.')
        setAutosaveStatus('error')
        return
      }
      
      // Nettoyer le brouillon après sauvegarde réussie
      localStorage.removeItem('evenement_draft')

      setAutosaveStatus('saved')
      onCancel()
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde. Veuillez réessayer.'
      setSubmitError(errorMessage)
      setAutosaveStatus('error')
    } finally {
      setLoading(false)
    }
  }, [formData, validateForm, onSave, onCancel, evenement])

  // Nettoyage du brouillon
  const handleCancel = useCallback(() => {
    if (window.confirm('Voulez-vous vraiment annuler ? Les modifications non sauvegardées seront perdues.')) {
      localStorage.removeItem('evenement_draft')
      onCancel()
    }
  }, [onCancel])

  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* En-tête avec barre de progression */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          {submitError && (
            <div className="mb-4 border border-red-200 bg-red-50 text-red-700 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold">Impossible d'enregistrer l'événement</p>
                <p className="text-sm">{submitError}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                {evenement ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h2>
              <p className="text-gray-600 mt-1">
                {evenement ? 'Modifiez les informations de l\'événement' : 'Créez un nouvel événement pour votre organisation'}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Barre de progression */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{progress}% complété</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Statut autosave */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {autosaveStatus === 'saving' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-blue-600">Enregistrement...</span>
                </>
              )}
              {autosaveStatus === 'saved' && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Données enregistrées automatiquement</span>
                </>
              )}
              {autosaveStatus === 'error' && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">Erreur d'enregistrement</span>
                </>
              )}
              {autosaveStatus === 'idle' && lastSaved && (
                <>
                  <Save className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">
                    Dernière sauvegarde: {lastSaved.toLocaleTimeString('fr-FR')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contenu du formulaire */}
        <div className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de l'événement *
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => handleChange('titre', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.titre ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="Ex: Job Dating COP 2024"
            />
            {errors.titre && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.titre}
              </p>
            )}
          </div>

          {/* Type d'événement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'événement *
            </label>
            <select
              value={formData.type_evenement_id}
              onChange={(e) => handleChange('type_evenement_id', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.type_evenement_id ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <option value="">Sélectionner un type</option>
              {eventTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.nom}
                </option>
              ))}
            </select>
            {errors.type_evenement_id && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.type_evenement_id}
              </p>
            )}
          </div>

          {/* Volet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volet *
            </label>
            <select
              value={formData.volet}
              onChange={(e) => handleChange('volet', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.volet ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <option value="">Sélectionner un volet</option>
              {volets.map(volet => (
                <option key={volet.value} value={volet.value}>
                  {volet.label}
                </option>
              ))}
            </select>
            {errors.volet && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.volet}
              </p>
            )}
          </div>

          {/* Pôle concerné */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pôle concerné
            </label>
            <select
              value={formData.pole_id}
              onChange={(e) => {
                handleChange('pole_id', e.target.value)
                handleChange('filiere_id', '') // Reset filière when pôle changes
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-blue-400"
            >
              <option value="">Sélectionner un pôle</option>
              {poles.map(pole => (
                <option key={pole.id} value={pole.id}>
                  {pole.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Filière concernée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filière concernée
            </label>
            <select
              value={formData.filiere_id}
              onChange={(e) => handleChange('filiere_id', e.target.value)}
              disabled={!formData.pole_id}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Sélectionner une filière</option>
              {filieres
                .filter(filiere => filiere.pole_id === formData.pole_id)
                .map(filiere => (
                  <option key={filiere.id} value={filiere.id}>
                    {filiere.nom}
                  </option>
                ))}
            </select>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={formData.statut}
              onChange={(e) => handleChange('statut', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-blue-400"
            >
              <option value="planifie">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>

          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Date de début *
            </label>
            <input
              type="date"
              value={formData.date_debut}
              onChange={(e) => handleChange('date_debut', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.date_debut ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            />
            {errors.date_debut && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.date_debut}
              </p>
            )}
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Date de fin
            </label>
            <input
              type="date"
              value={formData.date_fin}
              onChange={(e) => handleChange('date_fin', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.date_fin ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            />
            {errors.date_fin && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.date_fin}
              </p>
            )}
          </div>

          {/* Lieu (Salle) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Salle *
            </label>
            <input
              type="text"
              value={formData.lieu}
              onChange={(e) => handleChange('lieu', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.lieu ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="Adresse ou lieu de l'événement"
            />
            {errors.lieu && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.lieu}
              </p>
            )}
          </div>

          {/* Responsable COP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Responsable COP *
            </label>
            <input
              type="text"
              value={formData.responsable_cop}
              onChange={(e) => handleChange('responsable_cop', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.responsable_cop ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="Nom du responsable"
            />
            {errors.responsable_cop && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.responsable_cop}
              </p>
            )}
            
            {/* Suggestions de responsable */}
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                <User className="w-3 h-3" />
                Suggestions rapides (cliquez pour sélectionner) :
              </p>
              <div className="flex flex-wrap gap-2">
                {['Équipe COP', 'BD', 'CC', 'CO'].map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleChange('responsable_cop', suggestion)}
                    className="px-3 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-blue-400"
              placeholder="Description détaillée de l'événement..."
            />
            
            {/* Suggestions de description */}
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Suggestions rapides (cliquez pour ajouter) :
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Session d'information sur les opportunités de carrière...",
                  "Présentation des programmes de formation et des partenaires..."
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const currentDescription = formData.description
                      const separator = currentDescription ? '\n\n' : ''
                      const newDescription = currentDescription + separator + suggestion
                      handleChange('description', newDescription)
                    }}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    {suggestion.length > 50 ? suggestion.substring(0, 50) + '...' : suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Métriques de recrutement */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Métriques de recrutement</h3>
              <span className="text-sm text-gray-500">(optionnel)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Nombre de bénéficiaires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de stagiaires bénéficiaires
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.nombre_beneficiaires || 0}
                  onChange={(e) => handleChange('nombre_beneficiaires', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="0"
                />
              </div>

              {/* Nombre de candidats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de candidats
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.nombre_candidats || 0}
                  onChange={(e) => handleChange('nombre_candidats', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="0"
                />
              </div>

              {/* Nombre de candidats retenus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de candidats retenus
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.nombre_candidats || 0}
                  value={formData.nombre_candidats_retenus || 0}
                  onChange={(e) => handleChange('nombre_candidats_retenus', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Affichage du taux de conversion */}
            {formData.nombre_candidats && formData.nombre_candidats > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Taux de conversion : {formData.taux_conversion || 0}%
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {formData.nombre_candidats_retenus || 0} retenus sur {formData.nombre_candidats} candidats
                </p>
              </div>
            )}
          </div>

          {/* Upload de photos */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Photos de l'événement</h3>
              <span className="text-sm text-gray-500">(max 5 photos)</span>
            </div>

            {/* Zone d'upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e.target.files)}
                className="hidden"
                id="photo-upload"
                disabled={photos.length >= 5}
              />
              <label
                htmlFor="photo-upload"
                className={`cursor-pointer flex flex-col items-center gap-2 ${
                  photos.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Cliquez pour ajouter des photos
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG jusqu'à 5MB par image
                  </p>
                </div>
              </label>
            </div>

            {/* Preview des photos */}
            {(photos.length > 0 || photosUrls.length > 0) && (
              <div className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Photos existantes */}
                  {photosUrls.map((url, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <img
                        src={url}
                        alt={`Photo existante ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs">Photo existante</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Nouvelles photos */}
                  {photos.map((photo, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Nouvelle photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Pied de page avec boutons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-xl">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={handleCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleFinalSave}
              disabled={loading || !formData.titre || !formData.date_debut || !formData.lieu || !formData.responsable_cop}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {evenement ? 'Modifier l\'événement' : 'Créer l\'événement'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { EvenementForm }
