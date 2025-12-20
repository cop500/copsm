'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useActionsAmbassadeurs, ActionAmbassadeur, ActionAmbassadeurFormData } from '@/hooks/useActionsAmbassadeurs'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
import { useAuth } from '@/hooks/useAuth'
import * as XLSX from 'xlsx'
import { 
  Users, Calendar, MapPin, User, Building2, 
  Filter, Search, Download, Eye, Edit3, Trash2,
  TrendingUp, BarChart3, PieChart, Activity,
  Loader2, AlertCircle, CheckCircle, XCircle,
  Clock, Award, Target, BookOpen, Mail, Phone,
  ChevronRight, UserCircle, Star, Zap, Plus,
  FileText, X, UploadCloud
} from 'lucide-react'

interface StagiaireAmbassadeur {
  id: string
  nom: string
  prenom: string
  email?: string
  telephone?: string
  photo_url?: string
  pole_id?: string
  filiere_id?: string
  pole?: { nom: string; couleur?: string }
  filiere?: { nom: string; color?: string }
  actions: ActionAmbassadeur[]
  stats: {
    totalActions: number
    totalParticipants: number
    presenceEvenements: number
    participationAteliers: number
    dernierAction?: string
  }
  evaluation?: {
    note_presence?: number
    note_implication?: number
    note_participation?: number
    note_qualite_actions?: number
    note_leadership?: number
    note_globale?: number
    commentaires?: string
    points_forts?: string
    axes_amelioration?: string
    periode_debut?: string
    periode_fin?: string
    evaluateur_nom?: string
  }
}

const volets = [
  { value: 'information_communication', label: 'Information/Communication', color: 'bg-blue-100 text-blue-800' },
  { value: 'accompagnement_projets', label: 'Accompagnement Projets', color: 'bg-green-100 text-green-800' },
  { value: 'assistance_carriere', label: 'Assistance Carrière', color: 'bg-purple-100 text-purple-800' },
  { value: 'assistance_filiere', label: 'Assistance Filière', color: 'bg-orange-100 text-orange-800' }
]

// Composant formulaire d'ajout de stagiaire ambassadeur
const StagiaireFormInline: React.FC<{ 
  onSuccess: () => void
  poles: any[]
  filieres: any[]
}> = ({ onSuccess, poles, filieres }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    pole_id: '',
    filiere_id: '',
    photo: null as File | null,
    photoPreview: '' as string | null
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, photo: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoPreview: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let photoUrl = null

      // Upload photo si fournie
      if (formData.photo) {
        setUploadingPhoto(true)
        const fileExt = formData.photo.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `stagiaires-ambassadeurs/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, formData.photo)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath)

        photoUrl = publicUrl
        setUploadingPhoto(false)
      }

      // Créer le stagiaire dans la table stagiaires
      const { data: newStagiaire, error: insertError } = await supabase
        .from('stagiaires')
        .insert([{
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email || null,
          telephone: formData.telephone || null,
          pole_id: formData.pole_id || null,
          filiere_id: formData.filiere_id || null,
          photo_url: photoUrl,
          insere: false
        }])
        .select()
        .single()

      if (insertError) throw insertError

      // Ne plus créer d'action automatiquement - les stagiaires et actions sont séparés
      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        pole_id: '',
        filiere_id: '',
        photo: null,
        photoPreview: null
      })
      
      // Appeler onSuccess pour recharger les données
      onSuccess()
    } catch (err: any) {
      console.error('Erreur ajout stagiaire:', err)
      setError(err.message || 'Erreur lors de l\'ajout du stagiaire')
    } finally {
      setLoading(false)
      setUploadingPhoto(false)
    }
  }

  return (
    <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Formulaire d'Ajout de Stagiaire Ambassadeur</h4>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
            <input
              type="text"
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pôle</label>
            <select
              value={formData.pole_id}
              onChange={(e) => setFormData({ ...formData, pole_id: e.target.value, filiere_id: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un pôle</option>
              {poles.filter(p => p.actif).map(pole => (
                <option key={pole.id} value={pole.id}>{pole.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
            <select
              value={formData.filiere_id}
              onChange={(e) => setFormData({ ...formData, filiere_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!formData.pole_id}
            >
              <option value="">Sélectionner une filière</option>
              {filieres
                .filter(f => f.actif && (!formData.pole_id || f.pole_id === formData.pole_id))
                .map(filiere => (
                  <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            <div className="flex items-center gap-4">
              {formData.photoPreview && (
                <img 
                  src={formData.photoPreview} 
                  alt="Preview" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                nom: '',
                prenom: '',
                email: '',
                telephone: '',
                pole_id: '',
                filiere_id: '',
                photo: null,
                photoPreview: null
              })
              onSuccess()
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || uploadingPhoto}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading || uploadingPhoto ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadingPhoto ? 'Upload...' : 'Enregistrement...'}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Enregistrer le stagiaire
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Composant formulaire d'action inline
const ActionFormInline: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { saveAction } = useActionsAmbassadeurs()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ActionAmbassadeurFormData>({
    nom_prenom_stagiaire: '',
    equipe_participante: '',
    volet_action: 'information_communication',
    responsable_action: '',
    lieu_realisation: '',
    date_action: '',
    nombre_participants: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await saveAction(formData)
      if (result.success) {
        setFormData({
          nom_prenom_stagiaire: '',
          equipe_participante: '',
          volet_action: 'information_communication',
          responsable_action: '',
          lieu_realisation: '',
          date_action: '',
          nombre_participants: 0
        })
        onSuccess()
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Formulaire de Saisie d'Action</h4>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom et prénom du stagiaire *</label>
            <input
              type="text"
              value={formData.nom_prenom_stagiaire}
              onChange={(e) => setFormData({ ...formData, nom_prenom_stagiaire: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intitulé de l'action *</label>
            <input
              type="text"
              value={formData.responsable_action}
              onChange={(e) => setFormData({ ...formData, responsable_action: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de réalisation *</label>
            <input
              type="text"
              value={formData.lieu_realisation}
              onChange={(e) => setFormData({ ...formData, lieu_realisation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de l'action *</label>
            <input
              type="date"
              value={formData.date_action}
              onChange={(e) => setFormData({ ...formData, date_action: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de participants *</label>
            <input
              type="number"
              min="0"
              value={formData.nombre_participants}
              onChange={(e) => setFormData({ ...formData, nombre_participants: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Équipe participante</label>
            <input
              type="text"
              value={formData.equipe_participante}
              onChange={(e) => setFormData({ ...formData, equipe_participante: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => onSuccess()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Enregistrer l'action
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export const EspaceAmbassadeurs: React.FC = () => {
  const { actions, loading: actionsLoading, error, deleteAction, fetchActions } = useActionsAmbassadeurs()
  const { poles, filieres } = useSettings()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'business_developer' || profile?.role === 'manager_cop' || profile?.role === 'directeur'
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('tous')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [poleFilter, setPoleFilter] = useState<string>('')
  const [filiereFilter, setFiliereFilter] = useState<string>('')
  const [selectedStagiaire, setSelectedStagiaire] = useState<StagiaireAmbassadeur | null>(null)
  const [showStagiaireDetail, setShowStagiaireDetail] = useState(false)
  const [stagiaires, setStagiaires] = useState<StagiaireAmbassadeur[]>([])
  const [loading, setLoading] = useState(true)
  const [inscriptionsAteliers, setInscriptionsAteliers] = useState<any[]>([])
  const [presencesEvenements, setPresencesEvenements] = useState<any[]>([])
  const [showAddStagiaireModal, setShowAddStagiaireModal] = useState(false)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [allStagiaires, setAllStagiaires] = useState<any[]>([])
  const [loadingStagiaires, setLoadingStagiaires] = useState(false)
  const [activeSection, setActiveSection] = useState<'stagiaires' | 'actions'>('stagiaires')
  const [showActionForm, setShowActionForm] = useState(false)
  const [showStagiaireForm, setShowStagiaireForm] = useState(false)
  const [stagiaireFormData, setStagiaireFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    pole_id: '',
    filiere_id: '',
    photo: null as File | null
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editingStagiaire, setEditingStagiaire] = useState<StagiaireAmbassadeur | null>(null)
  const [editingPhotoFile, setEditingPhotoFile] = useState<File | null>(null)
  const [editingPhotoPreview, setEditingPhotoPreview] = useState<string | null>(null)
  const [evaluationForm, setEvaluationForm] = useState({
    note_presence: '',
    note_implication: '',
    note_participation: '',
    note_qualite_actions: '',
    note_leadership: '',
    commentaires: '',
    points_forts: '',
    axes_amelioration: '',
    periode_debut: '',
    periode_fin: ''
  })

  // Debug: afficher les actions chargées
  useEffect(() => {
    console.log('🔍 Actions ambassadeurs chargées:', actions.length)
    if (actions.length > 0) {
      console.log('🔍 Première action:', actions[0])
    }
  }, [actions])

  // Charger les données complètes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Charger les inscriptions aux ateliers en premier
        const { data: inscriptionsData, error: inscriptionsError } = await supabase
          .from('inscriptions_ateliers')
          .select('*')
          .is('statut', null) // Inscriptions actives seulement

        if (inscriptionsError) {
          console.error('Erreur chargement inscriptions:', inscriptionsError)
        } else {
          setInscriptionsAteliers(inscriptionsData || [])
        }

        // Charger les présences aux événements
        const { data: presencesData, error: presencesError } = await supabase
          .from('presences_evenements')
          .select('*')

        if (presencesError) {
          console.error('Erreur chargement présences:', presencesError)
        } else {
          setPresencesEvenements(presencesData || [])
        }

        // Charger TOUS les stagiaires de la table stagiaires (pas seulement ceux avec des actions)
        const { data: allStagiairesData, error: stagiairesError } = await supabase
          .from('stagiaires')
          .select(`
            *,
            poles(nom, couleur),
            filieres(nom, color)
          `)

        if (stagiairesError) {
          console.error('Erreur chargement stagiaires:', stagiairesError)
        }

        // Grouper les actions par stagiaire (normaliser les noms)
        const actionsByStagiaire = new Map<string, ActionAmbassadeur[]>()
        
        if (actions && actions.length > 0) {
          actions.forEach(action => {
            if (!action.nom_prenom_stagiaire) {
              console.warn('⚠️ Action sans nom_prenom_stagiaire:', action.id)
              return
            }
            const nomComplet = action.nom_prenom_stagiaire.trim().toLowerCase()
            if (!actionsByStagiaire.has(nomComplet)) {
              actionsByStagiaire.set(nomComplet, [])
            }
            actionsByStagiaire.get(nomComplet)!.push(action)
          })
        }

        console.log('👥 Stagiaires uniques trouvés:', actionsByStagiaire.size)

        // Récupérer les profils stagiaires depuis la table stagiaires
        const stagiairesData: StagiaireAmbassadeur[] = []
        const inscriptions = inscriptionsData || []
        const allStagiaires = allStagiairesData || []
        const stagiairesProcessed = new Set<string>() // Pour éviter les doublons
        
        // Traiter UNIQUEMENT les stagiaires qui existent dans la table stagiaires
        // Ne pas créer de stagiaires à partir des actions
        for (const [nomCompletNormalized, stagiaireActions] of actionsByStagiaire.entries()) {
          // Récupérer le nom original depuis la première action
          const nomCompletOriginal = stagiaireActions[0].nom_prenom_stagiaire.trim()
          const nameParts = nomCompletOriginal.split(' ').filter(p => p.length > 0)
          const prenom = nameParts[0] || ''
          const nom = nameParts.slice(1).join(' ') || ''
          
          let stagiaireData: any = null
          
          // Essayer de trouver le stagiaire dans la table stagiaires
          // IMPORTANT : Si le stagiaire n'existe pas, on ne crée PAS de stagiaire fictif
          if (prenom && nom) {
            try {
              const { data, error } = await supabase
                .from('stagiaires')
                .select(`
                  *,
                  poles(nom, couleur),
                  filieres(nom, color)
                `)
                .or(`prenom.ilike.%${prenom}%,nom.ilike.%${nom}%`)
                .limit(5) // Prendre plusieurs résultats pour mieux matcher
              
              if (!error && data && data.length > 0) {
                // Trouver la meilleure correspondance
                const bestMatch = data.find(s => {
                  const sNomComplet = `${s.prenom} ${s.nom}`.toLowerCase()
                  return sNomComplet.includes(nomCompletNormalized) || 
                         nomCompletNormalized.includes(sNomComplet) ||
                         (s.prenom.toLowerCase().includes(prenom.toLowerCase()) && 
                          s.nom.toLowerCase().includes(nom.toLowerCase()))
                })
                stagiaireData = bestMatch || data[0]
              }
            } catch (err) {
              console.error('Erreur recherche stagiaire:', err)
            }
          }

          // Si le stagiaire n'existe pas dans la table stagiaires, on ignore cette action
          // Les actions sans stagiaire correspondant ne créent pas de stagiaire fictif
          if (!stagiaireData) {
            console.log(`⚠️ Action ignorée : stagiaire "${nomCompletOriginal}" n'existe pas dans la table stagiaires`)
            continue
          }

          // Calculer les statistiques
          const totalActions = stagiaireActions.length
          const totalParticipants = stagiaireActions.reduce((sum, a) => sum + a.nombre_participants, 0)
          
          // Compter les inscriptions aux ateliers
          const participationAteliers = inscriptions.filter(ins => {
            const insNom = `${ins.stagiaire_nom || ''}`.toLowerCase()
            const insEmail = `${ins.stagiaire_email || ''}`.toLowerCase()
            return insNom.includes(nomCompletNormalized) || 
                   nomCompletNormalized.includes(insNom) ||
                   (stagiaireData?.email && insEmail.includes(stagiaireData.email.toLowerCase()))
          }).length

          // Dernière action
          const sortedActions = [...stagiaireActions].sort((a, b) => 
            new Date(b.date_action).getTime() - new Date(a.date_action).getTime()
          )
          const dernierAction = sortedActions[0]

          // Charger l'évaluation du stagiaire
          let evaluationData: any = null
          const stagiaireId = stagiaireData?.id
          const nomCompletForEval = `${prenom} ${nom}`.trim()
          
          try {
            let evalData: any = null
            let evalError: any = null

            // Essayer d'abord par stagiaire_id si disponible
            if (stagiaireId && !stagiaireId.startsWith('temp-')) {
              const { data, error } = await supabase
                .from('evaluations_ambassadeurs')
                .select('*')
                .eq('stagiaire_id', stagiaireId)
                .eq('actif', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
              
              evalData = data
              evalError = error
            }

            // Si pas trouvé par ID, essayer par nom complet
            if (!evalData && nomCompletForEval) {
              const { data, error } = await supabase
                .from('evaluations_ambassadeurs')
                .select('*')
                .eq('stagiaire_nom_complet', nomCompletForEval)
                .eq('actif', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
              
              evalData = data
              evalError = error
            }

            if (!evalError && evalData) {
              evaluationData = {
                note_presence: evalData.note_presence,
                note_implication: evalData.note_implication,
                note_participation: evalData.note_participation,
                note_qualite_actions: evalData.note_qualite_actions,
                note_leadership: evalData.note_leadership,
                note_globale: evalData.note_globale,
                commentaires: evalData.commentaires,
                points_forts: evalData.points_forts,
                axes_amelioration: evalData.axes_amelioration,
                periode_debut: evalData.periode_debut,
                periode_fin: evalData.periode_fin,
                evaluateur_nom: evalData.evaluateur_nom
              }
            }
          } catch (evalErr) {
            console.error('Erreur chargement évaluation:', evalErr)
          }

          // Utiliser uniquement l'ID du stagiaire réel (pas de stagiaire fictif)
          stagiairesData.push({
            id: stagiaireData.id, // ID réel du stagiaire
            nom: stagiaireData.nom || 'Non renseigné',
            prenom: stagiaireData.prenom || 'Non renseigné',
            email: stagiaireData.email,
            telephone: stagiaireData.telephone,
            photo_url: stagiaireData.photo_url,
            pole_id: stagiaireData.pole_id,
            filiere_id: stagiaireData.filiere_id,
            pole: stagiaireData.poles as any,
            filiere: stagiaireData.filieres as any,
            actions: stagiaireActions,
            evaluation: evaluationData,
            stats: {
              totalActions,
              totalParticipants,
              presenceEvenements: stagiaireActions.length, // Approximation basée sur les actions
              participationAteliers,
              dernierAction: dernierAction?.date_action
            }
          })
          
          // Marquer ce stagiaire comme traité
          stagiairesProcessed.add(stagiaireData.id)
        }

        // Ajouter les stagiaires qui n'ont pas d'actions mais qui existent dans la table stagiaires
        for (const stagiaire of allStagiaires) {
          // Si le stagiaire n'a pas déjà été ajouté (pas d'actions)
          if (!stagiairesProcessed.has(stagiaire.id)) {
            const nomComplet = `${stagiaire.prenom} ${stagiaire.nom}`.toLowerCase()
            
            // Charger l'évaluation si elle existe
            let evaluationData = null
            try {
              const { data: evalData } = await supabase
                .from('evaluations_ambassadeurs')
                .select('*')
                .or(`stagiaire_id.eq.${stagiaire.id},stagiaire_nom_complet.eq.${stagiaire.prenom} ${stagiaire.nom}`)
                .eq('actif', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

              if (evalData) {
                evaluationData = {
                  note_presence: evalData.note_presence,
                  note_implication: evalData.note_implication,
                  note_participation: evalData.note_participation,
                  note_qualite_actions: evalData.note_qualite_actions,
                  note_leadership: evalData.note_leadership,
                  note_globale: evalData.note_globale,
                  commentaires: evalData.commentaires,
                  points_forts: evalData.points_forts,
                  axes_amelioration: evalData.axes_amelioration,
                  periode_debut: evalData.periode_debut,
                  periode_fin: evalData.periode_fin,
                  evaluateur_nom: evalData.evaluateur_nom
                }
              }
            } catch (evalErr) {
              console.error('Erreur chargement évaluation:', evalErr)
            }

            // Compter les inscriptions et présences
            const participationAteliers = inscriptions.filter(ins => {
              const insNom = `${ins.stagiaire_nom || ''}`.toLowerCase()
              const insEmail = `${ins.stagiaire_email || ''}`.toLowerCase()
              return insNom.includes(nomComplet) || 
                     nomComplet.includes(insNom) ||
                     (stagiaire.email && insEmail === stagiaire.email.toLowerCase())
            }).length

            const presenceEvenements = presencesEvenements.filter(p => {
              const pNom = `${p.stagiaire_nom || ''}`.toLowerCase()
              return pNom.includes(nomComplet) || 
                     nomComplet.includes(pNom) ||
                     (stagiaire.email && p.stagiaire_email?.toLowerCase() === stagiaire.email.toLowerCase())
            }).length

            stagiairesData.push({
              id: stagiaire.id,
              nom: stagiaire.nom || 'Non renseigné',
              prenom: stagiaire.prenom || 'Non renseigné',
              email: stagiaire.email,
              telephone: stagiaire.telephone,
              photo_url: stagiaire.photo_url,
              pole_id: stagiaire.pole_id,
              filiere_id: stagiaire.filiere_id,
              pole: stagiaire.poles as any,
              filiere: stagiaire.filieres as any,
              actions: [], // Pas d'actions
              evaluation: evaluationData,
              stats: {
                totalActions: 0,
                totalParticipants: 0,
                presenceEvenements,
                participationAteliers,
                dernierAction: undefined
              }
            })
          }
        }

        // Trier par nombre d'actions décroissant, puis par nom
        stagiairesData.sort((a, b) => {
          if (b.stats.totalActions !== a.stats.totalActions) {
            return b.stats.totalActions - a.stats.totalActions
          }
          return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
        })
        
        console.log('✅ Stagiaires ambassadeurs créés:', stagiairesData.length)
        console.log('📋 Détails:', stagiairesData.map(s => ({
          nom: `${s.prenom} ${s.nom}`,
          actions: s.stats.totalActions,
          aProfil: !!s.pole || !!s.filiere
        })))
        
        setStagiaires(stagiairesData)
      } catch (err: any) {
        console.error('Erreur chargement données:', err)
        setStagiaires([])
      } finally {
        setLoading(false)
      }
    }

    if (!actionsLoading) {
      loadData()
    }
  }, [actions, actionsLoading])

  // Fonction pour forcer le rechargement des stagiaires
  const reloadStagiairesData = useCallback(async () => {
    // Recharger les actions pour déclencher le useEffect
    await fetchActions()
  }, [fetchActions])

  const filteredStagiaires = useMemo(() => {
    return stagiaires.filter(stagiaire => {
      const nomComplet = `${stagiaire.prenom} ${stagiaire.nom}`.toLowerCase()
      const matchesSearch = 
        nomComplet.includes(searchTerm.toLowerCase()) ||
        stagiaire.pole?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stagiaire.filiere?.nom.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesPole = !poleFilter || stagiaire.pole_id === poleFilter
      const matchesFiliere = !filiereFilter || stagiaire.filiere_id === filiereFilter

      const matchesDate = (() => {
        if (dateFilter === 'tous' || !stagiaire.stats.dernierAction) return true
        
        const lastActionDate = new Date(stagiaire.stats.dernierAction)
        const now = new Date()
        
        switch (dateFilter) {
          case 'ce_mois':
            return lastActionDate.getMonth() === now.getMonth() && lastActionDate.getFullYear() === now.getFullYear()
          case 'derniers_3_mois':
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
            return lastActionDate >= threeMonthsAgo
          case 'cette_annee':
            return lastActionDate.getFullYear() === now.getFullYear()
          default:
            return true
        }
      })()

      return matchesSearch && matchesDate && matchesPole && matchesFiliere
    })
  }, [stagiaires, searchTerm, dateFilter, poleFilter, filiereFilter])

  const handleViewStagiaire = (stagiaire: StagiaireAmbassadeur) => {
    setSelectedStagiaire(stagiaire)
    setShowStagiaireDetail(true)
    // Charger l'évaluation si elle existe
    loadEvaluation(stagiaire)
  }

  // Charger l'évaluation d'un stagiaire
  const loadEvaluation = async (stagiaire: StagiaireAmbassadeur) => {
    try {
      const nomComplet = `${stagiaire.prenom} ${stagiaire.nom}`
      const { data, error } = await supabase
        .from('evaluations_ambassadeurs')
        .select('*')
        .or(`stagiaire_id.eq.${stagiaire.id},stagiaire_nom_complet.eq.${nomComplet}`)
        .eq('actif', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        setSelectedStagiaire(prev => prev ? {
          ...prev,
          evaluation: {
            note_presence: data.note_presence,
            note_implication: data.note_implication,
            note_participation: data.note_participation,
            note_qualite_actions: data.note_qualite_actions,
            note_leadership: data.note_leadership,
            note_globale: data.note_globale,
            commentaires: data.commentaires,
            points_forts: data.points_forts,
            axes_amelioration: data.axes_amelioration,
            periode_debut: data.periode_debut,
            periode_fin: data.periode_fin,
            evaluateur_nom: data.evaluateur_nom
          }
        } : null)
      }
    } catch (err) {
      console.error('Erreur chargement évaluation:', err)
    }
  }

  // Charger tous les stagiaires pour le modal d'ajout
  const loadAllStagiaires = async () => {
    try {
      setLoadingStagiaires(true)
      const { data, error } = await supabase
        .from('stagiaires')
        .select(`
          *,
          poles(nom, couleur),
          filieres(nom, color)
        `)
        .order('nom')

      if (error) throw error
      setAllStagiaires(data || [])
    } catch (err: any) {
      console.error('Erreur chargement stagiaires:', err)
    } finally {
      setLoadingStagiaires(false)
    }
  }

  // Ouvrir le modal d'ajout de stagiaire ambassadeur
  const handleAddStagiaire = () => {
    loadAllStagiaires()
    setShowAddStagiaireModal(true)
  }

  // Ajouter un stagiaire comme ambassadeur (sans créer d'action automatiquement)
  const handleSelectStagiaireForAmbassadeur = async (stagiaire: any) => {
    try {
      // Le stagiaire existe déjà dans la table stagiaires, pas besoin de créer d'action
      // Les actions sont gérées séparément via le formulaire public
      alert('Stagiaire ajouté comme ambassadeur avec succès !')
      setShowAddStagiaireModal(false)
      // Recharger les données sans recharger la page
      await fetchActions()
      // Forcer le rechargement des stagiaires en déclenchant le useEffect
      setLoading(true)
      setLoading(false)
    } catch (err: any) {
      console.error('Erreur ajout stagiaire ambassadeur:', err)
      alert(`Erreur: ${err.message}`)
    }
  }

  // Supprimer un stagiaire ambassadeur (admin seulement)
  const handleDeleteStagiaire = async (stagiaireId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher l'ouverture du modal
    
    if (!isAdmin) {
      alert('Vous n\'avez pas les permissions pour supprimer un stagiaire.')
      return
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce stagiaire ambassadeur ?')) {
      return
    }

    try {
      // Supprimer le stagiaire de la table stagiaires
      const { error } = await supabase
        .from('stagiaires')
        .delete()
        .eq('id', stagiaireId)

      if (error) throw error

      alert('Stagiaire supprimé avec succès !')
      // Recharger les données
      await fetchActions()
      setLoading(true)
      setTimeout(() => setLoading(false), 100)
    } catch (err: any) {
      console.error('Erreur suppression stagiaire:', err)
      alert(`Erreur lors de la suppression: ${err.message}`)
    }
  }

  // Importer des stagiaires depuis un fichier Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      if (jsonData.length === 0) {
        alert('Le fichier Excel est vide.')
        return
      }

      // Valider et importer les données
      const stagiairesToImport = []
      const errors = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        const prenom = row['Prénom'] || row['prenom'] || row['Prenom'] || ''
        const nom = row['Nom'] || row['nom'] || ''
        const email = row['Email'] || row['email'] || ''
        const telephone = row['Téléphone'] || row['telephone'] || row['Telephone'] || ''
        const poleNom = row['Pôle'] || row['pole'] || row['Pole'] || ''
        const filiereNom = row['Filière'] || row['filiere'] || row['Filiere'] || ''

        if (!prenom || !nom) {
          errors.push(`Ligne ${i + 2}: Prénom et Nom sont requis`)
          continue
        }

        // Trouver le pôle et la filière
        let poleId = null
        let filiereId = null

        if (poleNom) {
          const pole = poles.find(p => p.nom.toLowerCase() === poleNom.toLowerCase())
          if (pole) {
            poleId = pole.id
            if (filiereNom) {
              const filiere = filieres.find(f => 
                f.nom.toLowerCase() === filiereNom.toLowerCase() && 
                f.pole_id === poleId
              )
              if (filiere) filiereId = filiere.id
            }
          }
        }

        stagiairesToImport.push({
          nom,
          prenom,
          email: email || null,
          telephone: telephone || null,
          pole_id: poleId,
          filiere_id: filiereId,
          insere: false
        })
      }

      if (errors.length > 0) {
        alert(`Erreurs détectées:\n${errors.join('\n')}\n\nLes lignes valides seront importées.`)
      }

      if (stagiairesToImport.length === 0) {
        alert('Aucun stagiaire valide à importer.')
        return
      }

      // Insérer les stagiaires
      const { error: insertError } = await supabase
        .from('stagiaires')
        .insert(stagiairesToImport)

      if (insertError) throw insertError

      alert(`${stagiairesToImport.length} stagiaire(s) importé(s) avec succès !`)
      // Recharger les données
      await fetchActions()
      setLoading(true)
      setTimeout(() => setLoading(false), 100)
      
      // Réinitialiser l'input
      e.target.value = ''
    } catch (err: any) {
      console.error('Erreur import Excel:', err)
      alert(`Erreur lors de l'import: ${err.message}`)
    }
  }

  // Ouvrir le modal d'évaluation
  const handleOpenEvaluation = (stagiaire: StagiaireAmbassadeur) => {
    setSelectedStagiaire(stagiaire)
    // Pré-remplir le formulaire si une évaluation existe
    if (stagiaire.evaluation) {
      setEvaluationForm({
        note_presence: stagiaire.evaluation.note_presence?.toString() || '',
        note_implication: stagiaire.evaluation.note_implication?.toString() || '',
        note_participation: stagiaire.evaluation.note_participation?.toString() || '',
        note_qualite_actions: stagiaire.evaluation.note_qualite_actions?.toString() || '',
        note_leadership: stagiaire.evaluation.note_leadership?.toString() || '',
        commentaires: stagiaire.evaluation.commentaires || '',
        points_forts: stagiaire.evaluation.points_forts || '',
        axes_amelioration: stagiaire.evaluation.axes_amelioration || '',
        periode_debut: stagiaire.evaluation.periode_debut || '',
        periode_fin: stagiaire.evaluation.periode_fin || ''
      })
    } else {
      // Réinitialiser le formulaire
      setEvaluationForm({
        note_presence: '',
        note_implication: '',
        note_participation: '',
        note_qualite_actions: '',
        note_leadership: '',
        commentaires: '',
        points_forts: '',
        axes_amelioration: '',
        periode_debut: '',
        periode_fin: ''
      })
    }
    setShowEvaluationModal(true)
  }

  // Sauvegarder l'évaluation
  const handleSaveEvaluation = async () => {
    if (!selectedStagiaire) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const nomComplet = `${selectedStagiaire.prenom} ${selectedStagiaire.nom}`

      const evaluationData = {
        stagiaire_id: selectedStagiaire.id.startsWith('temp-') ? null : selectedStagiaire.id,
        stagiaire_nom_complet: nomComplet,
        note_presence: evaluationForm.note_presence ? parseFloat(evaluationForm.note_presence) : null,
        note_implication: evaluationForm.note_implication ? parseFloat(evaluationForm.note_implication) : null,
        note_participation: evaluationForm.note_participation ? parseFloat(evaluationForm.note_participation) : null,
        note_qualite_actions: evaluationForm.note_qualite_actions ? parseFloat(evaluationForm.note_qualite_actions) : null,
        note_leadership: evaluationForm.note_leadership ? parseFloat(evaluationForm.note_leadership) : null,
        commentaires: evaluationForm.commentaires || null,
        points_forts: evaluationForm.points_forts || null,
        axes_amelioration: evaluationForm.axes_amelioration || null,
        periode_debut: evaluationForm.periode_debut || new Date().toISOString().split('T')[0],
        periode_fin: evaluationForm.periode_fin || new Date().toISOString().split('T')[0],
        evaluateur_id: user?.id || null,
        evaluateur_nom: user?.email || 'Admin'
      }

      // Vérifier si une évaluation existe déjà pour cette période
      const { data: existingEval } = await supabase
        .from('evaluations_ambassadeurs')
        .select('id')
        .or(`stagiaire_id.eq.${selectedStagiaire.id},stagiaire_nom_complet.eq.${nomComplet}`)
        .eq('periode_debut', evaluationData.periode_debut)
        .eq('actif', true)
        .maybeSingle()

      if (existingEval) {
        // Mettre à jour l'évaluation existante
        const { error } = await supabase
          .from('evaluations_ambassadeurs')
          .update(evaluationData)
          .eq('id', existingEval.id)

        if (error) throw error
      } else {
        // Créer une nouvelle évaluation
        const { error } = await supabase
          .from('evaluations_ambassadeurs')
          .insert([evaluationData])

        if (error) throw error
      }

      alert('Évaluation enregistrée avec succès !')
      setShowEvaluationModal(false)
      // Recharger les données
      if (selectedStagiaire) {
        loadEvaluation(selectedStagiaire)
      }
    } catch (err: any) {
      console.error('Erreur sauvegarde évaluation:', err)
      alert(`Erreur: ${err.message}`)
    }
  }

  const stats = useMemo(() => {
    const totalStagiaires = stagiaires.length
    const totalActions = actions.length
    const totalParticipants = actions.reduce((sum, action) => sum + action.nombre_participants, 0)
    const moyenneActions = totalStagiaires > 0 ? (totalActions / totalStagiaires).toFixed(1) : '0'

    return {
      totalStagiaires,
      totalActions,
      totalParticipants,
      moyenneActions
    }
  }, [stagiaires, actions])

  if (loading || actionsLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Chargement des données ambassadeurs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Erreur lors du chargement des données</p>
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section principale : Deux cartes pour choisir l'option */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Carte 1 : Les Stagiaires Ambassadeurs */}
        <div
          onClick={() => setActiveSection('stagiaires')}
          className={`relative overflow-hidden rounded-2xl shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${
            activeSection === 'stagiaires'
              ? 'ring-4 ring-blue-500 bg-gradient-to-br from-blue-500 to-blue-600'
              : 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
          }`}
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                activeSection === 'stagiaires' ? 'bg-white/20' : 'bg-blue-500'
              }`}>
                <Users className="w-8 h-8 text-white" />
              </div>
              {activeSection === 'stagiaires' && (
                <div className="w-3 h-3 bg-white rounded-full"></div>
              )}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${
              activeSection === 'stagiaires' ? 'text-white' : 'text-gray-900'
            }`}>
              Les Stagiaires Ambassadeurs
            </h3>
            <p className={`text-sm mb-4 ${
              activeSection === 'stagiaires' ? 'text-blue-100' : 'text-gray-600'
            }`}>
              Gérez la liste des stagiaires ambassadeurs, leurs profils, statistiques et évaluations
            </p>
            <div className={`flex items-center gap-2 ${
              activeSection === 'stagiaires' ? 'text-white' : 'text-blue-600'
            }`}>
              <span className="text-sm font-semibold">
                {stats.totalStagiaires} stagiaire{stats.totalStagiaires > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Carte 2 : Les Actions des Stagiaires Ambassadeurs */}
        <div
          onClick={() => setActiveSection('actions')}
          className={`relative overflow-hidden rounded-2xl shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${
            activeSection === 'actions'
              ? 'ring-4 ring-green-500 bg-gradient-to-br from-green-500 to-green-600'
              : 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200'
          }`}
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                activeSection === 'actions' ? 'bg-white/20' : 'bg-green-500'
              }`}>
                <Activity className="w-8 h-8 text-white" />
              </div>
              {activeSection === 'actions' && (
                <div className="w-3 h-3 bg-white rounded-full"></div>
              )}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${
              activeSection === 'actions' ? 'text-white' : 'text-gray-900'
            }`}>
              Les Actions des Stagiaires Ambassadeurs
            </h3>
            <p className={`text-sm mb-4 ${
              activeSection === 'actions' ? 'text-green-100' : 'text-gray-600'
            }`}>
              Consultez et gérez toutes les actions réalisées par les stagiaires ambassadeurs
            </p>
            <div className={`flex items-center gap-2 ${
              activeSection === 'actions' ? 'text-white' : 'text-green-600'
            }`}>
              <span className="text-sm font-semibold">
                {stats.totalActions} action{stats.totalActions > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu conditionnel selon la section active */}
      {activeSection === 'stagiaires' ? (
        <div className="space-y-6">
          {/* SECTION STAGIAIRES AMBASSADEURS : Affiche uniquement les stagiaires avec leurs informations et critères de notation */}
          {/* Bouton et formulaire d'ajout de stagiaire */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Gestion des Stagiaires Ambassadeurs</h3>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 cursor-pointer">
                    <FileText className="w-4 h-4" />
                    Importer Excel
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportExcel}
                      className="hidden"
                    />
                  </label>
                )}
                <button
                  onClick={() => setShowStagiaireForm(!showStagiaireForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {showStagiaireForm ? 'Masquer le formulaire' : 'Ajouter un Stagiaire Ambassadeur'}
                </button>
              </div>
            </div>

            {/* Formulaire d'ajout de stagiaire */}
            {showStagiaireForm && (
              <StagiaireFormInline 
                onSuccess={async () => {
                  setShowStagiaireForm(false)
                  // Forcer le rechargement des données
                  await reloadStagiairesData()
                }}
                poles={poles}
                filieres={filieres}
              />
            )}
          </div>

          {/* Liste des stagiaires en cartes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Liste des Stagiaires Ambassadeurs ({filteredStagiaires.length})
              </h3>
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                <input
                  type="text"
                  placeholder="Nom, prénom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pôle</label>
                <select
                  value={poleFilter}
                  onChange={(e) => {
                    setPoleFilter(e.target.value)
                    setFiliereFilter('') // Reset filière when pole changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Tous les pôles</option>
                  {poles.filter(p => p.actif).map(pole => (
                    <option key={pole.id} value={pole.id}>{pole.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
                <select
                  value={filiereFilter}
                  onChange={(e) => setFiliereFilter(e.target.value)}
                  disabled={!poleFilter}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                >
                  <option value="">Toutes les filières</option>
                  {filieres
                    .filter(f => f.actif && (!poleFilter || f.pole_id === poleFilter))
                    .map(filiere => (
                      <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="tous">Toutes les périodes</option>
                  <option value="ce_mois">Ce mois</option>
                  <option value="derniers_3_mois">3 derniers mois</option>
                  <option value="cette_annee">Cette année</option>
                </select>
              </div>
            </div>

            {filteredStagiaires.length === 0 ? (
              <div className="p-12 text-center bg-gray-50 rounded-lg">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun stagiaire ambassadeur trouvé
                </h3>
                <p className="text-gray-600">
                  {stagiaires.length === 0 
                    ? 'Aucun stagiaire ambassadeur n\'a été enregistré. Utilisez le formulaire ci-dessus pour ajouter un stagiaire.'
                    : 'Aucun stagiaire ne correspond aux critères de recherche.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStagiaires.map(stagiaire => (
                  <div 
                    key={stagiaire.id} 
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => handleViewStagiaire(stagiaire)}
                  >
                    {/* En-tête simplifié avec photo et informations */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative flex-shrink-0">
                        {stagiaire.photo_url ? (
                          <img 
                            src={stagiaire.photo_url} 
                            alt={`${stagiaire.prenom} ${stagiaire.nom}`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                            onError={(e) => {
                              // Si l'image ne charge pas, afficher l'avatar par défaut
                              e.currentTarget.style.display = 'none'
                              const parent = e.currentTarget.parentElement
                              if (parent) {
                                const fallback = parent.querySelector('.photo-fallback') as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div className={`w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-300 ${stagiaire.photo_url ? 'hidden photo-fallback' : ''}`}>
                          <UserCircle className="w-8 h-8 text-blue-600" />
                        </div>
                        {stagiaire.evaluation && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                            <Star className="w-3 h-3 text-white fill-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {stagiaire.prenom} {stagiaire.nom}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {stagiaire.pole && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {stagiaire.pole.nom}
                            </span>
                          )}
                          {stagiaire.filiere && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {stagiaire.filiere.nom}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Critères de notation simplifiés */}
                    {stagiaire.evaluation ? (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <h5 className="text-sm font-semibold text-gray-900">Évaluation</h5>
                          </div>
                          {stagiaire.evaluation.note_globale !== undefined && (
                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {stagiaire.evaluation.note_globale.toFixed(1)}/20
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {stagiaire.evaluation.note_presence !== undefined && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Présence</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${(stagiaire.evaluation.note_presence / 20) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 w-10 text-right">
                                  {stagiaire.evaluation.note_presence.toFixed(1)}/20
                                </span>
                              </div>
                            </div>
                          )}
                          {stagiaire.evaluation.note_implication !== undefined && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Implication</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${(stagiaire.evaluation.note_implication / 20) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 w-10 text-right">
                                  {stagiaire.evaluation.note_implication.toFixed(1)}/20
                                </span>
                              </div>
                            </div>
                          )}
                          {stagiaire.evaluation.note_participation !== undefined && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Participation</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-purple-500 rounded-full"
                                    style={{ width: `${(stagiaire.evaluation.note_participation / 20) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 w-10 text-right">
                                  {stagiaire.evaluation.note_participation.toFixed(1)}/20
                                </span>
                              </div>
                            </div>
                          )}
                          {stagiaire.evaluation.note_qualite_actions !== undefined && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Qualité Actions</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-orange-500 rounded-full"
                                    style={{ width: `${(stagiaire.evaluation.note_qualite_actions / 20) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 w-10 text-right">
                                  {stagiaire.evaluation.note_qualite_actions.toFixed(1)}/20
                                </span>
                              </div>
                            </div>
                          )}
                          {stagiaire.evaluation.note_leadership !== undefined && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Leadership</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-red-500 rounded-full"
                                    style={{ width: `${(stagiaire.evaluation.note_leadership / 20) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 w-10 text-right">
                                  {stagiaire.evaluation.note_leadership.toFixed(1)}/20
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 p-2 bg-gray-50 rounded text-center">
                        <p className="text-xs text-gray-500">Aucune évaluation</p>
                      </div>
                    )}

                    {/* Boutons d'action */}
                    <div className="flex gap-2 mt-4">
                      <button 
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewStagiaire(stagiaire)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        Voir le profil
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditStagiaire(stagiaire)
                            }}
                            title="Modifier le stagiaire"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            onClick={(e) => handleDeleteStagiaire(stagiaire.id, e)}
                            title="Supprimer le stagiaire"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION ACTIONS : Affiche uniquement les actions saisies via le formulaire public */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Les Actions des Stagiaires Ambassadeurs</h3>
              <button
                onClick={() => setShowActionForm(!showActionForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {showActionForm ? 'Masquer le formulaire' : 'Formulaire Public'}
              </button>
            </div>

            {/* Formulaire public de saisie d'action */}
            {showActionForm && (
              <ActionFormInline onSuccess={async () => {
                setShowActionForm(false)
                // Recharger les actions
                await fetchActions()
              }} />
            )}

            {/* Liste des actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Liste des Actions ({actions.length})</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher une action..."
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                    <option value="">Tous les volets</option>
                    {volets.map(volet => (
                      <option key={volet.value} value={volet.value}>{volet.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {actions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune action enregistrée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map(action => (
                    <div key={action.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${volets.find(v => v.value === action.volet_action)?.color || 'bg-gray-100 text-gray-800'}`}>
                              {volets.find(v => v.value === action.volet_action)?.label || action.volet_action}
                            </span>
                            <span className="text-sm text-gray-600">{action.nom_prenom_stagiaire}</span>
                          </div>
                          <h5 className="font-semibold text-gray-900 mb-2">{action.responsable_action}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{action.lieu_realisation}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(action.date_action).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{action.nombre_participants} participant(s)</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteAction(action.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de détail du stagiaire */}
      {showStagiaireDetail && selectedStagiaire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStagiaire ? 'Modifier le Stagiaire' : 'Profil Ambassadeur'}
              </h2>
              <div className="flex items-center gap-2">
                {isAdmin && !editingStagiaire && (
                  <button
                    onClick={() => {
                      setEditingStagiaire({ ...selectedStagiaire })
                      setEditingPhotoPreview(null)
                      setEditingPhotoFile(null)
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifier
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowStagiaireDetail(false)
                    setEditingStagiaire(null)
                    setEditingPhotoPreview(null)
                    setEditingPhotoFile(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {editingStagiaire ? (
                /* Mode édition */
                <div className="space-y-6">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="relative">
                      {editingPhotoPreview ? (
                        <img 
                          src={editingPhotoPreview} 
                          alt="Preview"
                          className="w-24 h-24 rounded-full object-cover border-4 border-blue-400 shadow-md"
                        />
                      ) : editingStagiaire.photo_url ? (
                        <img 
                          src={editingStagiaire.photo_url} 
                          alt={`${editingStagiaire.prenom} ${editingStagiaire.nom}`}
                          className="w-24 h-24 rounded-full object-cover border-4 border-blue-400 shadow-md"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-blue-400 shadow-md">
                          <UserCircle className="w-12 h-12 text-white" />
                        </div>
                      )}
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                        <UploadCloud className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setEditingPhotoFile(file)
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setEditingPhotoPreview(reader.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                      <input
                        type="text"
                        value={editingStagiaire.prenom}
                        onChange={(e) => setEditingStagiaire({ ...editingStagiaire, prenom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                      <input
                        type="text"
                        value={editingStagiaire.nom}
                        onChange={(e) => setEditingStagiaire({ ...editingStagiaire, nom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editingStagiaire.email || ''}
                        onChange={(e) => setEditingStagiaire({ ...editingStagiaire, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={editingStagiaire.telephone || ''}
                        onChange={(e) => setEditingStagiaire({ ...editingStagiaire, telephone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pôle</label>
                      <select
                        value={editingStagiaire.pole_id || ''}
                        onChange={(e) => setEditingStagiaire({ ...editingStagiaire, pole_id: e.target.value, filiere_id: '' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner un pôle</option>
                        {poles.map(pole => (
                          <option key={pole.id} value={pole.id}>{pole.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
                      <select
                        value={editingStagiaire.filiere_id || ''}
                        onChange={(e) => setEditingStagiaire({ ...editingStagiaire, filiere_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={!editingStagiaire.pole_id}
                      >
                        <option value="">Sélectionner une filière</option>
                        {filieres.filter(f => f.pole_id === editingStagiaire.pole_id).map(filiere => (
                          <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setEditingStagiaire(null)
                        setEditingPhotoPreview(null)
                        setEditingPhotoFile(null)
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveStagiaireEdit}
                      disabled={uploadingPhoto}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Enregistrer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Mode affichage */
                <div>
                  {/* En-tête du profil amélioré */}
                  <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-200">
                    <div className="relative">
                      {selectedStagiaire.photo_url ? (
                        <div className="relative">
                          <img 
                            src={selectedStagiaire.photo_url} 
                            alt={`${selectedStagiaire.prenom} ${selectedStagiaire.nom}`}
                            className="w-28 h-28 rounded-full object-cover border-4 border-blue-400 shadow-lg ring-2 ring-blue-100"
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent pointer-events-none"></div>
                        </div>
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-blue-400 shadow-lg ring-2 ring-blue-100">
                          <UserCircle className="w-14 h-14 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedStagiaire.prenom} {selectedStagiaire.nom}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {selectedStagiaire.pole && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span className="font-medium">{selectedStagiaire.pole.nom}</span>
                          </div>
                        )}
                        {selectedStagiaire.filiere && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span className="font-medium">{selectedStagiaire.filiere.nom}</span>
                          </div>
                        )}
                        {selectedStagiaire.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{selectedStagiaire.email}</span>
                          </div>
                        )}
                        {selectedStagiaire.telephone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{selectedStagiaire.telephone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium text-gray-600">Actions</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{selectedStagiaire.stats.totalActions}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-gray-600">Participants</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{selectedStagiaire.stats.totalParticipants}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    <p className="text-sm font-medium text-gray-600">Ateliers</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{selectedStagiaire.stats.participationAteliers}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <p className="text-sm font-medium text-gray-600">Événements</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{selectedStagiaire.stats.presenceEvenements}</p>
                </div>
              </div>

              {/* Évaluation / Notation */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Évaluation</h4>
                  <button
                    onClick={() => handleOpenEvaluation(selectedStagiaire)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    {selectedStagiaire.evaluation ? 'Modifier l\'évaluation' : 'Noter le stagiaire'}
                  </button>
                </div>
                
                {selectedStagiaire.evaluation ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Présence</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedStagiaire.evaluation.note_presence?.toFixed(1) || 'N/A'}/20
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Implication</p>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedStagiaire.evaluation.note_implication?.toFixed(1) || 'N/A'}/20
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Participation</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedStagiaire.evaluation.note_participation?.toFixed(1) || 'N/A'}/20
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Qualité Actions</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {selectedStagiaire.evaluation.note_qualite_actions?.toFixed(1) || 'N/A'}/20
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Leadership</p>
                        <p className="text-2xl font-bold text-red-600">
                          {selectedStagiaire.evaluation.note_leadership?.toFixed(1) || 'N/A'}/20
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Note Globale</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {selectedStagiaire.evaluation.note_globale?.toFixed(1) || 'N/A'}/20
                        </p>
                      </div>
                    </div>
                    {selectedStagiaire.evaluation.commentaires && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">Commentaires</p>
                        <p className="text-gray-700 bg-white p-3 rounded border">{selectedStagiaire.evaluation.commentaires}</p>
                      </div>
                    )}
                    {selectedStagiaire.evaluation.points_forts && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-green-600 mb-2">Points Forts</p>
                        <p className="text-gray-700 bg-white p-3 rounded border">{selectedStagiaire.evaluation.points_forts}</p>
                      </div>
                    )}
                    {selectedStagiaire.evaluation.axes_amelioration && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-orange-600 mb-2">Axes d'Amélioration</p>
                        <p className="text-gray-700 bg-white p-3 rounded border">{selectedStagiaire.evaluation.axes_amelioration}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Aucune évaluation enregistrée</p>
                    <p className="text-sm text-gray-500 mt-1">Cliquez sur "Noter le stagiaire" pour créer une évaluation</p>
                  </div>
                )}
              </div>

              {/* Liste des actions */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Actions Réalisées</h4>
                <div className="space-y-3">
                  {selectedStagiaire.actions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Aucune action enregistrée</p>
                  ) : (
                    selectedStagiaire.actions.map(action => (
                      <div key={action.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${volets.find(v => v.value === action.volet_action)?.color || 'bg-gray-100 text-gray-800'}`}>
                                {volets.find(v => v.value === action.volet_action)?.label || action.volet_action}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{action.lieu_realisation}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(action.date_action).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{action.responsable_action}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{action.nombre_participants} participant(s)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout de stagiaire ambassadeur */}
      {showAddStagiaireModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Ajouter un Stagiaire Ambassadeur</h2>
              <button
                onClick={() => setShowAddStagiaireModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {loadingStagiaires ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Chargement des stagiaires...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un stagiaire..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const search = e.target.value.toLowerCase()
                        // Filtrer les stagiaires (sera implémenté avec un état de recherche)
                      }}
                    />
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {allStagiaires.map(stagiaire => (
                      <div
                        key={stagiaire.id}
                        onClick={() => handleSelectStagiaireForAmbassadeur(stagiaire)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {stagiaire.photo_url ? (
                            <img src={stagiaire.photo_url} alt={`${stagiaire.prenom} ${stagiaire.nom}`} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserCircle className="w-6 h-6 text-blue-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{stagiaire.prenom} {stagiaire.nom}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              {stagiaire.poles && <span>{stagiaire.poles.nom}</span>}
                              {stagiaire.filieres && <span>• {stagiaire.filieres.nom}</span>}
                            </div>
                          </div>
                          <Plus className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal d'évaluation */}
      {showEvaluationModal && selectedStagiaire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Évaluation - {selectedStagiaire.prenom} {selectedStagiaire.nom}</h2>
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Période d'évaluation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Période de début</label>
                  <input
                    type="date"
                    value={evaluationForm.periode_debut}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, periode_debut: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Période de fin</label>
                  <input
                    type="date"
                    value={evaluationForm.periode_fin}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, periode_fin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Présence (sur 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={evaluationForm.note_presence}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, note_presence: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Implication (sur 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={evaluationForm.note_implication}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, note_implication: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Participation (sur 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={evaluationForm.note_participation}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, note_participation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualité des Actions (sur 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={evaluationForm.note_qualite_actions}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, note_qualite_actions: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leadership (sur 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={evaluationForm.note_leadership}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, note_leadership: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0-20"
                  />
                </div>
              </div>

              {/* Commentaires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commentaires</label>
                <textarea
                  value={evaluationForm.commentaires}
                  onChange={(e) => setEvaluationForm({ ...evaluationForm, commentaires: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Commentaires généraux sur l'évaluation..."
                />
              </div>

              {/* Points forts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Points Forts</label>
                <textarea
                  value={evaluationForm.points_forts}
                  onChange={(e) => setEvaluationForm({ ...evaluationForm, points_forts: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Points forts du stagiaire..."
                />
              </div>

              {/* Axes d'amélioration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Axes d'Amélioration</label>
                <textarea
                  value={evaluationForm.axes_amelioration}
                  onChange={(e) => setEvaluationForm({ ...evaluationForm, axes_amelioration: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Axes d'amélioration pour le stagiaire..."
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEvaluationModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEvaluation}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enregistrer l'évaluation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
