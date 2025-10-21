'use client'

import React, { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { 
  Upload, FileText, User, Mail, Phone, MapPin, 
  Calendar, CheckCircle, AlertCircle, Loader2,
  Download, Eye, X
} from 'lucide-react'

interface FormData {
  nom: string
  prenom: string
  email: string
  telephone: string
  pole_id: string
  filiere_id: string
  cv_file: File | null
}

export default function CVConnectPublicPage() {
  const { poles, filieres, loading: settingsLoading } = useSettings()
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    pole_id: '',
    filiere_id: '',
    cv_file: null
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Filtrer les filières selon le pôle sélectionné
  const filieresFiltered = formData.pole_id 
    ? filieres.filter(f => f.pole_id === formData.pole_id)
    : []

  // Gestion du drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    // Vérifier le type de fichier
    if (file.type !== 'application/pdf') {
      setError('Veuillez sélectionner un fichier PDF uniquement.')
      return
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 5MB.')
      return
    }

    setFormData(prev => ({ ...prev, cv_file: file }))
    setError('')

    // Créer une URL de prévisualisation
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value,
      // Réinitialiser la filière si le pôle change
      ...(field === 'pole_id' ? { filiere_id: '' } : {})
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Validation
      if (!formData.nom || !formData.prenom || !formData.email || !formData.pole_id || !formData.filiere_id || !formData.cv_file) {
        throw new Error('Veuillez remplir tous les champs obligatoires.')
      }

      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error('Veuillez saisir une adresse email valide.')
      }

      // Préparer les données pour l'upload
      const uploadFormData = new FormData()
      uploadFormData.append('nom', formData.nom)
      uploadFormData.append('prenom', formData.prenom)
      uploadFormData.append('email', formData.email)
      uploadFormData.append('telephone', formData.telephone)
      uploadFormData.append('pole_id', formData.pole_id)
      uploadFormData.append('filiere_id', formData.filiere_id)
      uploadFormData.append('cv_file', formData.cv_file)

      // Uploader via l'API
      const response = await fetch('/api/cv-connect/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'upload')
      }

      if (!result.success) {
        throw new Error('Échec de l\'upload')
      }

      setSuccess(true)
      
      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        pole_id: '',
        filiere_id: '',
        cv_file: null
      })
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Nettoyer l'URL de prévisualisation au démontage
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du formulaire...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">CV soumis avec succès !</h1>
          <p className="text-gray-600 mb-6">
            Votre CV a été transmis à notre équipe. Nous vous contacterons prochainement.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Soumettre un autre CV
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* En-tête */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CV Connect</h1>
            <p className="text-gray-600 text-lg">
              Déposez votre CV et rejoignez notre base de talents
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Informations personnelles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Votre nom"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Votre prénom"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => handleInputChange('telephone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pôle et filière */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Formation
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pôle <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.pole_id}
                    onChange={(e) => handleInputChange('pole_id', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Sélectionner un pôle</option>
                    {poles.filter(p => p.actif).map(pole => (
                      <option key={pole.id} value={pole.id}>{pole.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filière <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.filiere_id}
                    onChange={(e) => handleInputChange('filiere_id', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={!formData.pole_id}
                    required
                  >
                    <option value="">
                      {formData.pole_id ? 'Sélectionner une filière' : 'Sélectionnez d\'abord un pôle'}
                    </option>
                    {filieresFiltered.map(filiere => (
                      <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Upload CV */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                CV (PDF uniquement)
              </h2>
              
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : formData.cv_file 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                
                {formData.cv_file ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">{formData.cv_file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(formData.cv_file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex justify-center gap-2">
                      {previewUrl && (
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                          Prévisualiser
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, cv_file: null }))
                          if (previewUrl) {
                            URL.revokeObjectURL(previewUrl)
                            setPreviewUrl(null)
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Glissez-déposez votre CV ici
                      </p>
                      <p className="text-sm text-gray-600">
                        ou cliquez pour sélectionner un fichier
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF uniquement, maximum 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Bouton de soumission */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Soumission en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Soumettre mon CV
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
