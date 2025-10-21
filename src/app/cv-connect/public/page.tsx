'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { 
  User, MapPin, FileText, Upload, CheckCircle, AlertCircle, 
  Loader2, ArrowRight, Sparkles, Eye, EyeOff, Phone, Mail,
  Building, GraduationCap, Briefcase, Star, Shield, Clock,
  UserCheck, Award, Target, Zap, Crown, Diamond, Rocket, Trophy
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

interface Pole {
  id: string
  nom: string
}

interface Filiere {
  id: string
  nom: string
  pole_id: string
}

export default function CVConnectPage() {
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    pole_id: '',
    filiere_id: '',
    cv_file: null
  })

  const [poles, setPoles] = useState<Pole[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [filteredFilieres, setFilteredFilieres] = useState<Filiere[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isFormValid, setIsFormValid] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Charger les données initiales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Validation en temps réel
  useEffect(() => {
    validateForm()
  }, [formData])

  const loadInitialData = async () => {
    try {
      const [polesRes, filieresRes] = await Promise.all([
        fetch('/api/poles'),
        fetch('/api/filieres')
      ])

      if (polesRes.ok && filieresRes.ok) {
        const polesData = await polesRes.json()
        const filieresData = await filieresRes.json()
        
        setPoles(polesData)
        setFilieres(filieresData)
      }
    } catch (err) {
      console.error('Erreur chargement données:', err)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    // Validation nom
    if (!formData.nom.trim()) {
      errors.nom = 'Le nom est requis'
    } else if (formData.nom.trim().length < 2) {
      errors.nom = 'Le nom doit contenir au moins 2 caractères'
    }

    // Validation prénom
    if (!formData.prenom.trim()) {
      errors.prenom = 'Le prénom est requis'
    } else if (formData.prenom.trim().length < 2) {
      errors.prenom = 'Le prénom doit contenir au moins 2 caractères'
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis'
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Veuillez entrer un email valide'
    }

    // Validation téléphone (optionnel mais si rempli, doit être valide)
    if (formData.telephone && !/^(\+212|0)[5-7][0-9]{8}$/.test(formData.telephone.replace(/\s/g, ''))) {
      errors.telephone = 'Veuillez entrer un numéro de téléphone marocain valide'
    }

    // Validation pôle
    if (!formData.pole_id) {
      errors.pole_id = 'Veuillez sélectionner un pôle'
    }

    // Validation filière
    if (!formData.filiere_id) {
      errors.filiere_id = 'Veuillez sélectionner une filière'
    }

    // Validation CV
    if (!formData.cv_file) {
      errors.cv_file = 'Veuillez télécharger votre CV'
    } else if (formData.cv_file.type !== 'application/pdf') {
      errors.cv_file = 'Seuls les fichiers PDF sont acceptés'
    } else if (formData.cv_file.size > 5 * 1024 * 1024) {
      errors.cv_file = 'Le fichier ne doit pas dépasser 5MB'
    }

    setValidationErrors(errors)
    setIsFormValid(Object.keys(errors).length === 0)
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Filtrer les filières quand le pôle change
    if (field === 'pole_id') {
      const filtered = filieres.filter(f => f.pole_id === value)
      setFilteredFilieres(filtered)
      setFormData(prev => ({ ...prev, filiere_id: '' })) // Reset filière
    }
  }

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, cv_file: file }))
  }

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
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf') {
        handleFileChange(file)
      } else {
        setError('Seuls les fichiers PDF sont acceptés')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('Veuillez corriger les erreurs avant de soumettre')
      return
    }

    setSubmitting(true)
    setError('')
    setUploadProgress(0)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('nom', formData.nom.trim())
      formDataToSend.append('prenom', formData.prenom.trim())
      formDataToSend.append('email', formData.email.trim())
      formDataToSend.append('telephone', formData.telephone.trim())
      formDataToSend.append('pole_id', formData.pole_id)
      formDataToSend.append('filiere_id', formData.filiere_id)
      
      if (formData.cv_file) {
        formDataToSend.append('cv_file', formData.cv_file)
      }

      // Simulation de progression d'upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/cv-connect/upload', {
        method: 'POST',
        body: formDataToSend,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        setSuccess(true)
        setShowConfetti(true)
        
        // Arrêter les confettis après 3 secondes
        setTimeout(() => setShowConfetti(false), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Une erreur est survenue lors de l\'envoi')
      }
    } catch (err: any) {
      setError('Une erreur est survenue. Veuillez réessayer ou contacter le support.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/background4.jpg')`
          }}
        />
        <div className="absolute inset-0 bg-white/5"></div>
      </div>

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-500 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div ref={formRef} className="bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl border-2 border-white/90 overflow-hidden">

          {/* Form Content */}
          <div className="p-8">
            {success ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">CV envoyé avec succès !</h2>
                <p className="text-slate-600 text-lg mb-8">
                  Merci pour votre candidature. Notre équipe vous contactera dans les plus brefs délais.
                </p>
                <button
                  onClick={() => {
                    setSuccess(false)
                    setFormData({
                      nom: '',
                      prenom: '',
                      email: '',
                      telephone: '',
                      pole_id: '',
                      filiere_id: '',
                      cv_file: null
                    })
                    setError('')
                    setValidationErrors({})
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Déposer un autre CV
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                       {/* Personal Information */}
                       <div className="space-y-6">
                         <div className="flex items-center justify-center gap-3 mb-6">
                           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                             <UserCheck className="w-4 h-4 text-white" />
                           </div>
                           <h2 className="text-xl font-semibold text-black">
                             Informations personnelles
                           </h2>
                         </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => handleInputChange('nom', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                          validationErrors.nom 
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                            : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-200'
                        }`}
                        placeholder="Votre nom de famille"
                      />
                      {validationErrors.nom && (
                        <p className="text-sm text-blue-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.nom}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.prenom}
                        onChange={(e) => handleInputChange('prenom', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                          validationErrors.prenom 
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                            : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-200'
                        }`}
                        placeholder="Votre prénom"
                      />
                      {validationErrors.prenom && (
                        <p className="text-sm text-blue-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.prenom}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                            validationErrors.email 
                              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                              : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-200'
                          }`}
                          placeholder="votre@email.com"
                        />
                      </div>
                      {validationErrors.email && (
                        <p className="text-sm text-blue-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Téléphone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          value={formData.telephone}
                          onChange={(e) => handleInputChange('telephone', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                            validationErrors.telephone 
                              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                              : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-200'
                          }`}
                          placeholder="+212 6XX XXX XXX"
                        />
                      </div>
                      {validationErrors.telephone && (
                        <p className="text-sm text-blue-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.telephone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-slate-200 my-8"></div>

                       {/* Education */}
                       <div className="space-y-6">
                         <div className="flex items-center justify-center gap-3 mb-6">
                           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                             <Award className="w-4 h-4 text-white" />
                           </div>
                           <h2 className="text-xl font-semibold text-black">
                             Formation
                           </h2>
                         </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Pôle <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.pole_id}
                        onChange={(e) => handleInputChange('pole_id', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                          validationErrors.pole_id 
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                            : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-200'
                        }`}
                      >
                        <option value="">Sélectionner un pôle</option>
                        {poles.map((pole) => (
                          <option key={pole.id} value={pole.id}>
                            {pole.nom}
                          </option>
                        ))}
                      </select>
                      {validationErrors.pole_id && (
                        <p className="text-sm text-blue-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.pole_id}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Filière <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.filiere_id}
                        onChange={(e) => handleInputChange('filiere_id', e.target.value)}
                        disabled={!formData.pole_id}
                        className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                          !formData.pole_id 
                            ? 'border-slate-200 bg-slate-50 text-slate-400' 
                            : validationErrors.filiere_id 
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                            : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-200'
                        }`}
                      >
                        <option value="">
                          {!formData.pole_id ? 'Sélectionnez d\'abord un pôle' : 'Sélectionner une filière'}
                        </option>
                        {filteredFilieres.map((filiere) => (
                          <option key={filiere.id} value={filiere.id}>
                            {filiere.nom}
                          </option>
                        ))}
                      </select>
                      {validationErrors.filiere_id && (
                        <p className="text-sm text-blue-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.filiere_id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-slate-200 my-8"></div>

                       {/* CV Upload */}
                       <div className="space-y-6">
                         <div className="flex items-center justify-center gap-3 mb-6">
                           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                             <Rocket className="w-4 h-4 text-white" />
                           </div>
                           <h2 className="text-xl font-semibold text-black">
                             Déposez votre CV
                           </h2>
                         </div>
                  
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    
                           {formData.cv_file ? (
                             <div className="space-y-3">
                               <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto">
                                 <FileText className="w-6 h-6 text-white" />
                               </div>
                        <div>
                          <p className="text-gray-800 font-medium text-sm">{formData.cv_file.name}</p>
                          <p className="text-gray-500 text-xs">{(formData.cv_file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Changer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFileChange(null)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                           ) : (
                             <div className="space-y-3">
                               <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center mx-auto">
                                 <Upload className="w-6 h-6 text-white" />
                               </div>
                        <div>
                          <p className="text-gray-700 text-sm font-medium mb-2">
                            Glissez-déposez votre CV ici
                          </p>
                          <p className="text-gray-500 text-xs mb-3">ou</p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Parcourir les fichiers
                          </button>
                        </div>
                        <p className="text-gray-500 text-xs">PDF uniquement, max 5MB</p>
                      </div>
                    )}
                  </div>
                  
                  {validationErrors.cv_file && (
                    <p className="text-sm text-blue-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.cv_file}
                    </p>
                  )}
                </div>

                {/* Upload Progress */}
                {submitting && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-medium">Envoi en cours...</span>
                      <span className="font-semibold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-blue-700 font-medium">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-center pt-8">
                  <button
                    type="submit"
                    disabled={submitting || !isFormValid}
                    className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-blue-600 border-2 border-black rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin mr-3" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Déposer mon CV
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  )
}