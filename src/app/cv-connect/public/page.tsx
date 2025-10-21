'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { 
  Upload, FileText, User, Mail, Phone, MapPin, 
  Calendar, CheckCircle, AlertCircle, Loader2,
  Download, Eye, X, Sparkles, ArrowRight, Star
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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  
  const formRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filtrer les filières selon le pôle sélectionné
  const filieresFiltered = formData.pole_id 
    ? filieres.filter(f => f.pole_id === formData.pole_id)
    : []

  // Animation d'entrée
  useEffect(() => {
    if (formRef.current) {
      formRef.current.style.opacity = '0'
      formRef.current.style.transform = 'translateY(30px)'
      
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          formRef.current.style.opacity = '1'
          formRef.current.style.transform = 'translateY(0)'
        }
      }, 100)
    }
  }, [])

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
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf') {
        handleFileSelect(file)
      } else {
        setError('Seuls les fichiers PDF sont acceptés')
      }
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 5MB')
      return
    }

    setFormData(prev => ({ ...prev, cv_file: file }))
    setError('')
    
    // Créer une URL de prévisualisation
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const removeFile = () => {
    setFormData(prev => ({ ...prev, cv_file: null }))
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nom || !formData.prenom || !formData.email || !formData.pole_id || !formData.filiere_id || !formData.cv_file) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setSubmitting(true)
    setError('')
    setUploadProgress(0)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('nom', formData.nom)
      formDataToSend.append('prenom', formData.prenom)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('telephone', formData.telephone)
      formDataToSend.append('pole_id', formData.pole_id)
      formDataToSend.append('filiere_id', formData.filiere_id)
      formDataToSend.append('cv_file', formData.cv_file)

      // Simuler le progrès d'upload
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'upload')
      }

      const result = await response.json()
      
      // Animation de succès
      setShowConfetti(true)
      setSuccess(true)
      
      // Réinitialiser le formulaire après 3 secondes
      setTimeout(() => {
        setFormData({
          nom: '',
          prenom: '',
          email: '',
          telephone: '',
          pole_id: '',
          filiere_id: '',
          cv_file: null
        })
        setSuccess(false)
        setShowConfetti(false)
        setUploadProgress(0)
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
        }
      }, 3000)

    } catch (err: any) {
      setError(err.message)
      setUploadProgress(0)
    } finally {
      setSubmitting(false)
    }
  }

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Professional background image with overlay */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-slate-900/70"></div>
      </div>

      {/* Confetti animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div ref={formRef} className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-2xl px-10 py-5 mb-8 border border-white/40 shadow-xl animate-glow">
              <FileText className="w-7 h-7 text-orange-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent font-['Inter'] tracking-wide">
                CV Connect
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight animate-float">
              Déposez votre CV
            </h1>
            
            <p className="text-lg text-white/90 max-w-xl mx-auto leading-relaxed font-medium">
              Rejoignez-nous
            </p>
          </div>

          {/* Main Form Card */}
          <div className="glass-card p-8 md:p-12">
            {success ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">CV envoyé avec succès !</h2>
                <p className="text-slate-600 text-lg">Merci pour votre candidature. Nous vous contacterons bientôt.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-3">
                    <User className="w-6 h-6 text-blue-600" />
                    <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                      Informations personnelles
                    </span>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Nom *</label>
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                        className="form-input"
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Prénom *</label>
                      <input
                        type="text"
                        value={formData.prenom}
                        onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                        className="form-input"
                        placeholder="Votre prénom"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="form-input pl-12"
                          placeholder="votre@email.com"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Téléphone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                        <input
                          type="tel"
                          value={formData.telephone}
                          onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                          className="form-input pl-12"
                          placeholder="06 12 34 56 78"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-slate-200 my-8"></div>

                {/* Education */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-3">
                    <MapPin className="w-6 h-6 text-blue-600" />
                    <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                      Formation
                    </span>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Pôle *</label>
                      <select
                        value={formData.pole_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, pole_id: e.target.value, filiere_id: '' }))}
                        className="form-input"
                        required
                      >
                        <option value="">Sélectionnez un pôle</option>
                        {poles.map(pole => (
                          <option key={pole.id} value={pole.id}>{pole.nom}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Filière *</label>
                      <select
                        value={formData.filiere_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, filiere_id: e.target.value }))}
                        className="form-input"
                        required
                        disabled={!formData.pole_id}
                      >
                        <option value="">Sélectionnez une filière</option>
                        {filieresFiltered.map(filiere => (
                          <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-slate-200 my-8"></div>

                {/* CV Upload */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                      CV (PDF uniquement)
                    </span>
                  </h2>
                  
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
                        : 'border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50'
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
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                    
                    {formData.cv_file ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <FileText className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <p className="text-slate-800 font-medium">{formData.cv_file.name}</p>
                          <p className="text-slate-600 text-sm">{(formData.cv_file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary"
                          >
                            <Eye className="w-4 h-4" />
                            Prévisualiser
                          </button>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="btn-danger"
                          >
                            <X className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                          <Upload className="w-8 h-8 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-slate-700 text-lg font-medium mb-2">
                            Glissez-déposez votre CV ici
                          </p>
                          <p className="text-slate-500 mb-4">ou</p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-primary"
                          >
                            Parcourir les fichiers
                          </button>
                        </div>
                        <p className="text-slate-500 text-sm">PDF uniquement, max 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Progress */}
                {submitting && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-medium">Upload en cours...</span>
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-center mt-12">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group relative inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                  >
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Button content */}
                    <div className="relative flex items-center gap-3">
                      {submitting ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Envoi en cours...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 group-hover:animate-bounce" />
                          <span>Soumettre mon CV</span>
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </>
                      )}
                    </div>
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 -top-2 -left-2 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-white/60">
              Vos données sont protégées et utilisées uniquement à des fins de recrutement
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.15),
            0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .form-group {
          @apply space-y-2;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .form-input {
            @apply py-4 text-lg;
          }
          
          .form-label {
            @apply text-lg;
          }
          
          .glass-card {
            @apply mx-4;
          }
        }

        .form-label {
          @apply block text-gray-800 font-bold text-base mb-3 tracking-wide;
        }

        .form-input {
          @apply w-full px-4 py-4 bg-white border-2 border-gray-400 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-md hover:border-gray-500 text-base;
        }

        .form-input:focus {
          @apply shadow-lg border-blue-500 bg-blue-50;
        }

        .btn-primary {
          @apply inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm;
        }

        .btn-primary-large {
          @apply inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg;
        }

        .btn-secondary {
          @apply inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-300;
        }

        .btn-danger {
          @apply inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all duration-300;
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

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

        .animate-blob {
          animation: blob 7s infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  )
}
