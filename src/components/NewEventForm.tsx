'use client'

import React, { useState, useCallback } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, Plus, X, Save, Upload, Image, Trash2, 
  MapPin, Clock, FileText, User, AlertCircle, CheckCircle 
} from 'lucide-react'

interface EventFormData {
  id?: string
  titre: string
  type_evenement_id: string
  volet: string
  pole_id?: string
  filiere_id?: string
  date_debut: string
  date_fin?: string
  lieu: string
  description: string
  responsable_cop: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  photos: File[]
  photos_urls: string[]
  nombre_beneficiaires?: number
  nombre_candidats?: number
  nombre_candidats_retenus?: number
  taux_conversion?: number
}

interface NewEventFormProps {
  onSave: (event: any) => void
  onCancel: () => void
  initialData?: Partial<EventFormData>
}

export const NewEventForm: React.FC<NewEventFormProps> = ({ 
  onSave, 
  onCancel, 
  initialData 
}) => {
  const { eventTypes, poles, filieres } = useSettings()
  
  // Liste des volets
  const volets = [
    { value: 'information_communication', label: 'Information/Communication' },
    { value: 'accompagnement_projets', label: 'Accompagnement des stagiaires dans la réalisation de leur Projets Professionnels' },
    { value: 'assistance_carriere', label: 'Assistance au choix de carrière' },
    { value: 'assistance_filiere', label: 'Assistance au choix de filière' }
  ]
  const [formData, setFormData] = useState<EventFormData>({
    titre: '',
    type_evenement_id: '',
    volet: 'information_communication',
    pole_id: '',
    filiere_id: '',
    date_debut: '',
    date_fin: '',
    lieu: '',
    description: '',
    responsable_cop: '',
    statut: 'planifie',
    photos: [],
    photos_urls: [],
    nombre_beneficiaires: 0,
    nombre_candidats: 0,
    nombre_candidats_retenus: 0,
    taux_conversion: 0,
    ...initialData
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadProgress, setUploadProgress] = useState(0)

  // Validation du formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est obligatoire'
    }
    if (!formData.type_evenement_id) {
      newErrors.type_evenement_id = 'Le type d\'événement est obligatoire'
    }
    if (!formData.date_debut) {
      newErrors.date_debut = 'La date de début est obligatoire'
    }
    if (!formData.lieu.trim()) {
      newErrors.lieu = 'Le lieu est obligatoire'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire'
    }
    if (formData.photos.length > 5) {
      newErrors.photos = 'Maximum 5 photos autorisées'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Gestion des changements de champs
  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Réinitialiser la filière si le pôle change
      if (field === 'pole_id') {
        newData.filiere_id = ''
      }
      
      // Calculer automatiquement le taux de conversion
      if (field === 'nombre_candidats' || field === 'nombre_candidats_retenus') {
        const candidats = field === 'nombre_candidats' ? value : newData.nombre_candidats || 0
        const retenus = field === 'nombre_candidats_retenus' ? value : newData.nombre_candidats_retenus || 0
        
        if (candidats > 0) {
          newData.taux_conversion = Math.round((retenus / candidats) * 100 * 100) / 100 // Arrondir à 2 décimales
        } else {
          newData.taux_conversion = 0
        }
      }
      
      return newData
    })
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Obtenir les filières pour un pôle donné
  const getFilieresForPole = (poleId: string) => {
    return filieres.filter(f => f.pole_id === poleId)
  }

  // Upload des photos
  const handlePhotoUpload = useCallback((files: FileList | null) => {
    if (!files) return

    const newPhotos: File[] = []
    const maxPhotos = 5 - formData.photos.length

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
      setFormData(prev => ({ 
        ...prev, 
        photos: [...prev.photos, ...newPhotos] 
      }))
      setErrors(prev => ({ ...prev, photos: '' }))
    }
  }, [formData.photos.length])

  // Supprimer une photo
  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  // Sauvegarder l'événement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setUploadProgress(0)

    try {
      let photosUrls: string[] = []

      // Upload des photos si présentes
      if (formData.photos.length > 0) {
        console.log('📸 Début upload photos, nombre:', formData.photos.length)
        
        const uploadPromises = formData.photos.map(async (photo, index) => {
          const fileName = `evenements/${Date.now()}_${index}_${photo.name}`
          console.log('📁 Upload fichier:', fileName, 'Taille:', photo.size, 'Type:', photo.type)
          
          try {
            const { data, error } = await supabase.storage
              .from('photos')
              .upload(fileName, photo, {
                cacheControl: '3600',
                upsert: false
              })

            if (error) {
              console.error('❌ Erreur upload:', error)
              throw error
            }

            console.log('✅ Upload réussi:', fileName)
            const { data: urlData } = supabase.storage
              .from('photos')
              .getPublicUrl(fileName)

            setUploadProgress(((index + 1) / formData.photos.length) * 100)
            return urlData.publicUrl
          } catch (uploadError) {
            console.error('❌ Erreur upload fichier:', fileName, uploadError)
            throw uploadError
          }
        })

        photosUrls = await Promise.all(uploadPromises)
        console.log('✅ Tous les uploads terminés, URLs:', photosUrls)
      }

      // Préparer les données à sauvegarder
      const eventData = {
        titre: formData.titre,
        type_evenement_id: formData.type_evenement_id,
        volet: formData.volet,
        pole_id: formData.pole_id || null,
        filiere_id: formData.filiere_id || null,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin || null,
        lieu: formData.lieu,
        description: formData.description,
        responsable_cop: formData.responsable_cop,
        statut: formData.statut,
        actif: true
      }

      // Ajouter les nouvelles photos si présentes
      if (photosUrls.length > 0) {
        eventData.photos_urls = photosUrls
      }

      let data, error

      // Vérifier si c'est une modification ou une création
      if (initialData?.id) {
        // Modification d'un événement existant
        console.log('🔄 Modification événement ID:', initialData.id)
        const { data: updateData, error: updateError } = await supabase
          .from('evenements')
          .update(eventData)
          .eq('id', initialData.id)
          .select()
        
        data = updateData
        error = updateError
      } else {
        // Création d'un nouvel événement
        console.log('➕ Création nouvel événement')
        const { data: insertData, error: insertError } = await supabase
          .from('evenements')
          .insert([eventData])
          .select()
        
        data = insertData
        error = insertError
      }

      if (error) throw error

      onSave(data?.[0])
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error)
      setErrors({ submit: error.message })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                {initialData?.id ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h2>
              <p className="text-gray-600 mt-1">
                Créez un nouvel événement avec photos et détails complets
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Grille principale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Titre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Titre de l'événement *
              </label>
              <input
                type="text"
                value={formData.titre}
                onChange={(e) => handleInputChange('titre', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.titre ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Job Dating COP 2024"
              />
              {errors.titre && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.titre}
                </p>
              )}
            </div>

            {/* Type d'événement */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type d'événement *
              </label>
              <select
                value={formData.type_evenement_id}
                onChange={(e) => handleInputChange('type_evenement_id', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.type_evenement_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner un type</option>
                {eventTypes.filter(t => t.actif).map(type => (
                  <option key={type.id} value={type.id}>
                    {type.nom}
                  </option>
                ))}
              </select>
              {errors.type_evenement_id && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.type_evenement_id}
                </p>
              )}
            </div>

            {/* Volet */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Volet *
              </label>
              <select
                value={formData.volet}
                onChange={(e) => handleInputChange('volet', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                {volets.map(volet => (
                  <option key={volet.value} value={volet.value}>
                    {volet.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pôle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pôle concerné
              </label>
              <select
                value={formData.pole_id}
                onChange={(e) => handleInputChange('pole_id', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="">Sélectionner un pôle</option>
                {poles.filter(p => p.actif).map(pole => (
                  <option key={pole.id} value={pole.id}>
                    {pole.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Filière */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filière concernée
              </label>
              <select
                value={formData.filiere_id}
                onChange={(e) => handleInputChange('filiere_id', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
                disabled={!formData.pole_id}
              >
                <option value="">Sélectionner une filière</option>
                {formData.pole_id && getFilieresForPole(formData.pole_id).map(filiere => (
                  <option key={filiere.id} value={filiere.id}>
                    {filiere.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={formData.statut}
                onChange={(e) => handleInputChange('statut', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>

            {/* Date de début */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date et heure de début *
              </label>
              <input
                type="datetime-local"
                value={formData.date_debut}
                onChange={(e) => handleInputChange('date_debut', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.date_debut ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.date_debut && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.date_debut}
                </p>
              )}
            </div>

            {/* Date de fin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date et heure de fin
              </label>
              <input
                type="datetime-local"
                value={formData.date_fin || ''}
                onChange={(e) => handleInputChange('date_fin', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Lieu */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lieu *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.lieu}
                  onChange={(e) => handleInputChange('lieu', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.lieu ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Adresse ou lieu de l'événement"
                />
              </div>
              {errors.lieu && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.lieu}
                </p>
              )}
            </div>

            {/* Responsable */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Responsable COP
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.responsable_cop}
                  onChange={(e) => handleInputChange('responsable_cop', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="Nom du responsable"
                />
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows={4}
                  placeholder="Description détaillée de l'événement..."
                />
              </div>
              {errors.description && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
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
                  onChange={(e) => handleInputChange('nombre_beneficiaires', parseInt(e.target.value) || 0)}
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
                  onChange={(e) => handleInputChange('nombre_candidats', parseInt(e.target.value) || 0)}
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
                  onChange={(e) => handleInputChange('nombre_candidats_retenus', parseInt(e.target.value) || 0)}
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
              <Image className="w-5 h-5 text-blue-600" />
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
                disabled={formData.photos.length >= 5}
              />
              <label
                htmlFor="photo-upload"
                className={`cursor-pointer flex flex-col items-center gap-2 ${
                  formData.photos.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
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

            {/* Barre de progression */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">Upload en cours...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Preview des photos */}
            {formData.photos.length > 0 && (
              <div className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.photos && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.photos}
              </p>
            )}
          </div>

          {/* Erreur générale */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {initialData?.id ? 'Modifier' : 'Créer l\'événement'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 