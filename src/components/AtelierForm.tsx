'use client'

import React, { useState, useEffect, useCallback } from 'react'
// import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { 
  Save, 
  X, 
  User, 
  Calendar, 
  MapPin, 
  FileText, 
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Building
} from 'lucide-react'

// Palette de couleurs
const COLORS = {
  primary: '#2563eb',      // Bleu
  primaryLight: '#3b82f6', // Bleu clair
  secondary: '#6b7280',    // Gris
  secondaryLight: '#f3f4f6', // Gris clair
  accent: '#f59e0b',       // Jaune
  accentLight: '#fef3c7',  // Jaune clair
  success: '#10b981',      // Vert
  error: '#ef4444',        // Rouge
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827'
}

interface AtelierFormProps {
  atelier?: any
  onSave: (data: any) => void
  onCancel: () => void
  isAdmin?: boolean
}

interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  avatar?: string
}

export const AtelierForm: React.FC<AtelierFormProps> = ({
  atelier,
  onSave,
  onCancel,
  isAdmin = false
}) => {
  // Plus besoin d'eventTypes car on a supprimé le champ type d'événement
  const [users, setUsers] = useState<User[]>([])
  const [animateurSearch, setAnimateurSearch] = useState('')
  const [showAnimateurDropdown, setShowAnimateurDropdown] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // État local pour les données du formulaire
  const [formData, setFormData] = useState({
    titre: atelier?.titre || '',
    description: atelier?.description || '',
    date_debut: atelier?.date_debut || '',
    date_fin: atelier?.date_fin || '',
    lieu: atelier?.lieu || '',
    capacite_max: atelier?.capacite_max || 20,
    statut: atelier?.statut || 'planifie',
    animateur_id: atelier?.animateur_id || '',
    animateur_nom: atelier?.animateur_nom || '',
    animateur_role: atelier?.animateur_role || '',
  })

  // Charger les utilisateurs pour le champ animateur
  const loadUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nom, prenom, email, role')
        .eq('actif', true)
        .order('nom')

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err)
    }
  }, [])

  // Autosave avec debounce - Sauvegarde réelle en brouillon
  const autosave = useCallback(async () => {
    if (!formData.titre || formData.titre.trim().length < 3) return // Pas d'autosave si pas de titre valide

    setAutosaveStatus('saving')
    try {
      // Sauvegarder en localStorage comme brouillon
      const draftData = {
        ...formData,
        isDraft: true,
        lastSaved: new Date().toISOString()
      }
      
      localStorage.setItem('atelier_draft', JSON.stringify(draftData))
      
      // Optionnel : sauvegarder aussi en base de données (brouillon)
      // await supabase.from('ateliers_drafts').upsert(draftData)
      
      setAutosaveStatus('saved')
      setTimeout(() => setAutosaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Erreur autosave:', err)
      setAutosaveStatus('error')
      setTimeout(() => setAutosaveStatus('idle'), 3000)
    }
  }, [formData])

  // Debounced autosave
  useEffect(() => {
    const timer = setTimeout(autosave, 2000) // Autosave après 2s d'inactivité
    return () => clearTimeout(timer)
  }, [formData, autosave])

  // Filtrer les utilisateurs pour l'animateur
  useEffect(() => {
    if (animateurSearch.length > 0) {
      const filtered = users.filter(user => 
        `${user.prenom} ${user.nom}`.toLowerCase().includes(animateurSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(animateurSearch.toLowerCase()) ||
        user.role.toLowerCase().includes(animateurSearch.toLowerCase())
      )
      setFilteredUsers(filtered)
      setShowAnimateurDropdown(true)
    } else {
      setFilteredUsers([])
      setShowAnimateurDropdown(false)
    }
  }, [animateurSearch, users])

  // Charger les utilisateurs au montage
  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Initialiser le champ animateur si on est en mode édition
  useEffect(() => {
    if (atelier?.animateur_nom) {
      setAnimateurSearch(atelier.animateur_nom)
    }
  }, [atelier])

  // Charger le brouillon au démarrage (seulement pour la création)
  useEffect(() => {
    if (!atelier) { // Seulement pour la création, pas pour l'édition
      try {
        const savedDraft = localStorage.getItem('atelier_draft')
        if (savedDraft) {
          const draftData = JSON.parse(savedDraft)
          // Vérifier si le brouillon est récent (moins de 24h)
          const lastSaved = new Date(draftData.lastSaved)
          const now = new Date()
          const hoursDiff = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60)
          
          if (hoursDiff < 24) { // Brouillon valide pendant 24h
            setFormData(prev => ({ ...prev, ...draftData }))
            if (draftData.animateur_nom) {
              setAnimateurSearch(draftData.animateur_nom)
            }
            console.log('📄 Brouillon chargé automatiquement')
          } else {
            // Supprimer le brouillon expiré
            localStorage.removeItem('atelier_draft')
          }
        }
      } catch (err) {
        console.error('Erreur chargement brouillon:', err)
        localStorage.removeItem('atelier_draft')
      }
    }
  }, [atelier])

  // Validation des champs
  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'titre':
        if (!value || value.trim().length < 3) {
          newErrors.titre = 'Le titre doit contenir au moins 3 caractères'
        } else {
          delete newErrors.titre
        }
        break
      case 'date_debut':
        if (!value) {
          newErrors.date_debut = 'La date de début est obligatoire'
        } else if (new Date(value) < new Date()) {
          newErrors.date_debut = 'La date ne peut pas être dans le passé'
        } else {
          delete newErrors.date_debut
        }
        break
      case 'lieu':
        if (!value || value.trim().length < 2) {
          newErrors.lieu = 'Le lieu doit contenir au moins 2 caractères'
        } else {
          delete newErrors.lieu
        }
        break
    }
    
    setErrors(newErrors)
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  const selectAnimateur = (user: User) => {
    setFormData(prev => ({ 
      ...prev, 
      animateur_id: user.id,
      animateur_nom: `${user.prenom} ${user.nom}`,
      animateur_role: user.role
    }))
    setAnimateurSearch(`${user.prenom} ${user.nom}`)
    setShowAnimateurDropdown(false)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'business_developer': return 'bg-blue-100 text-blue-800'
      case 'manager_cop': return 'bg-purple-100 text-purple-800'
      case 'conseiller_cop': return 'bg-green-100 text-green-800'
      case 'conseillere_carriere': return 'bg-pink-100 text-pink-800'
      case 'directeur': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'business_developer': return 'Admin'
      case 'manager_cop': return 'Manager COP'
      case 'conseiller_cop': return 'Conseiller COP'
      case 'conseillere_carriere': return 'Conseillère Carrière'
      case 'directeur': return 'Directeur'
      default: return role
    }
  }

  // Fonction pour gérer la sauvegarde finale
  const handleFinalSave = async () => {
    // Validation finale
    const requiredFields = ['titre', 'date_debut', 'lieu']
    const newErrors: Record<string, string> = {}
    
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = 'Ce champ est obligatoire'
      }
    })
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      await onSave(formData)
      // Nettoyer le brouillon après sauvegarde réussie
      localStorage.removeItem('atelier_draft')
      console.log('✅ Brouillon nettoyé après sauvegarde')
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {atelier ? 'Modifier l\'atelier' : 'Nouvel atelier'}
        </h2>
              <p className="text-gray-600 mt-1">
                Créez un nouvel atelier d'insertion professionnelle
                {localStorage.getItem('atelier_draft') && (
                  <span className="ml-2 text-blue-600 text-sm font-medium">
                    📄 Brouillon restauré
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Autosave status */}
              <div className="flex items-center gap-2 text-sm">
                {autosaveStatus === 'saving' && (
                  <>
                    <Clock className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-blue-600">Sauvegarde...</span>
                  </>
                )}
                {autosaveStatus === 'saved' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Données enregistrées</span>
                  </>
                )}
                {autosaveStatus === 'error' && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Erreur sauvegarde</span>
                  </>
                )}
              </div>
        <button
          onClick={onCancel}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-8">
          {/* Section 1: Informations générales */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b-2 border-blue-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
            </div>
              <h3 className="text-lg font-semibold text-gray-900">Informations générales</h3>
          </div>

            <div className="space-y-6">
          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titre de l'atelier *
            </label>
              <input
                  type="text"
                  value={formData.titre || ''}
                  onChange={(e) => handleFieldChange('titre', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.titre ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Atelier CV et entretiens d'embauche"
                />
                {errors.titre && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.titre}
                  </p>
                )}
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Capacité maximale *
            </label>
              <input
                type="number"
                min="1"
                    max="100"
                value={formData.capacite_max}
                    onChange={(e) => handleFieldChange('capacite_max', parseInt(e.target.value))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.capacite_max ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                placeholder="20"
              />
                  {errors.capacite_max && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.capacite_max}
                    </p>
                  )}
          </div>

          <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
              Statut
            </label>
            <select
                    value={formData.statut || 'planifie'}
                    onChange={(e) => handleFieldChange('statut', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="planifie">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
                </div>
              </div>
            </div>
        </div>

          {/* Section 2: Dates et lieu */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b-2 border-yellow-100">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Dates et lieu</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de début *
            </label>
              <input
                  type="datetime-local"
                  value={formData.date_debut || ''}
                  onChange={(e) => handleFieldChange('date_debut', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.date_debut ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.date_debut && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.date_debut}
                  </p>
                )}
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de fin
            </label>
              <input
                  type="datetime-local"
                  value={formData.date_fin || ''}
                  onChange={(e) => handleFieldChange('date_fin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lieu *
              </label>
              <input
                  type="text"
                  value={formData.lieu || ''}
                  onChange={(e) => handleFieldChange('lieu', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.lieu ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Salle de conférence, Amphi A, etc."
                />
                {errors.lieu && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.lieu}
                  </p>
                )}
            </div>
          </div>
        </div>

          {/* Section 3: Détails logistiques */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b-2 border-gray-100">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Détails logistiques</h3>
        </div>

            <div className="space-y-6">
              {/* Champ Animateur avec auto-complétion */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Animateur
              </label>
                <div className="relative">
                  <input
                    type="text"
                    value={animateurSearch}
                    onChange={(e) => setAnimateurSearch(e.target.value)}
                    onFocus={() => setShowAnimateurDropdown(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Rechercher un animateur..."
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  
                  {/* Dropdown des utilisateurs */}
                  {showAnimateurDropdown && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => selectAnimateur(user)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.prenom} {user.nom}
                              </p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
            </div>

                {/* Animateur sélectionné */}
                {formData.animateur_nom && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
            <div>
                          <p className="font-medium text-gray-900">{formData.animateur_nom}</p>
                          <p className="text-sm text-gray-600">{formData.animateur_role}</p>
                        </div>
                      </div>
          <button
                        onClick={() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            animateur_id: '', 
                            animateur_nom: '', 
                            animateur_role: '' 
                          }))
                          setAnimateurSearch('')
                        }}
                        className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
            </div>
          </div>
        )}
          </div>


          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
            </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  rows={4}
                  placeholder="Décrivez le contenu et les objectifs de l'atelier..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec boutons */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
            onClick={() => {
              // Nettoyer le brouillon si l'utilisateur annule
              localStorage.removeItem('atelier_draft')
              onCancel()
            }}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Annuler
            </button>
          <button
              onClick={handleFinalSave}
              disabled={Object.keys(errors).length > 0 || !formData.titre}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              {atelier ? 'Modifier' : 'Créer'} l'atelier
          </button>
        </div>
        </div>
      </div>
    </div>
  )
} 