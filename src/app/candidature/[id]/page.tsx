'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Download, Printer, Send, ArrowLeft, Eye, FileText, User, Calendar, Building, Briefcase } from 'lucide-react'

interface Candidature {
  id: string
  entreprise_nom: string
  poste: string
  type_contrat: string
  date_candidature: string
  source_offre: string
  statut_candidature: string
  date_derniere_maj: string
  feedback_entreprise?: string
  cv_url?: string
}

interface Commentaire {
  id: string
  candidature_id: string
  utilisateur_id: string
  utilisateur_nom: string
  contenu: string
  date_creation: string
}

export default function CandidatureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const candidatureId = params.id as string

  const [candidature, setCandidature] = useState<Candidature | null>(null)
  const [commentaires, setCommentaires] = useState<Commentaire[]>([])
  const [nouveauCommentaire, setNouveauCommentaire] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingComment, setSavingComment] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Charger les données
  useEffect(() => {
    loadCandidature()
    loadCommentaires()
    loadUser()
  }, [candidatureId])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadCandidature = async () => {
    try {
      const { data, error } = await supabase
        .from('candidatures_stagiaires')
        .select('*')
        .eq('id', candidatureId)
        .single()

      if (error) throw error
      setCandidature(data)
    } catch (error) {
      console.error('Erreur chargement candidature:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCommentaires = async () => {
    try {
      const { data, error } = await supabase
        .from('commentaires_candidatures')
        .select(`
          id,
          candidature_id,
          utilisateur_id,
          utilisateur_nom,
          contenu,
          date_creation
        `)
        .eq('candidature_id', candidatureId)
        .order('date_creation', { ascending: false })

      if (error) throw error
      setCommentaires(data || [])
    } catch (error) {
      console.error('Erreur chargement commentaires:', error)
    }
  }

  const ajouterCommentaire = async () => {
    if (!nouveauCommentaire.trim() || !user) return

    setSavingComment(true)
    try {
      const { error } = await supabase
        .from('commentaires_candidatures')
        .insert({
          candidature_id: candidatureId,
          utilisateur_id: user.id,
          utilisateur_nom: user.email?.split('@')[0] || 'Utilisateur',
          contenu: nouveauCommentaire.trim()
        })

      if (error) throw error

      setNouveauCommentaire('')
      loadCommentaires() // Recharger les commentaires
    } catch (error) {
      console.error('Erreur ajout commentaire:', error)
    } finally {
      setSavingComment(false)
    }
  }

  const updateStatut = async (nouveauStatut: string) => {
    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('candidatures_stagiaires')
        .update({ 
          statut_candidature: nouveauStatut,
          date_derniere_maj: new Date().toISOString()
        })
        .eq('id', candidatureId)

      if (error) throw error

      loadCandidature() // Recharger les données
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const downloadCV = async () => {
    if (!candidature?.cv_url) return

    try {
      const { data, error } = await supabase.storage
        .from('cv-stagiaires')
        .download(candidature.cv_url)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `CV_${candidature.entreprise_nom}_${candidature.poste}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur téléchargement CV:', error)
    }
  }

  const printCV = async () => {
    if (!candidature?.cv_url) return

    try {
      const { data, error } = await supabase.storage
        .from('cv-stagiaires')
        .download(candidature.cv_url)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
        URL.revokeObjectURL(url)
      }, 1000)
    } catch (error) {
      console.error('Erreur impression CV:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!candidature) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Candidature non trouvée</h1>
          <button
            onClick={() => router.push('/stagiaires')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'En attente': return 'bg-yellow-100 text-yellow-800'
      case 'En cours d\'étude': return 'bg-blue-100 text-blue-800'
      case 'Entretien programmé': return 'bg-purple-100 text-purple-800'
      case 'Acceptée': return 'bg-green-100 text-green-800'
      case 'Refusée': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/stagiaires')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Détails de la candidature</h1>
                <p className="text-gray-600">{candidature.entreprise_nom} - {candidature.poste}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutColor(candidature.statut_candidature)}`}>
                {candidature.statut_candidature}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carte principale */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Informations de la candidature
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Entreprise</p>
                      <p className="font-medium">{candidature.entreprise_nom}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Poste</p>
                      <p className="font-medium">{candidature.poste}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Type de contrat</p>
                      <p className="font-medium">{candidature.type_contrat}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Date de candidature</p>
                      <p className="font-medium">
                        {new Date(candidature.date_candidature).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Dernière mise à jour</p>
                      <p className="font-medium">
                        {new Date(candidature.date_derniere_maj).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Source</p>
                      <p className="font-medium">{candidature.source_offre}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gestion du CV */}
            {candidature.cv_url && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  CV du candidat
                </h2>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">CV disponible</p>
                    <p className="font-medium text-gray-900">{candidature.cv_url}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={downloadCV}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </button>
                    <button
                      onClick={printCV}
                      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Commentaires */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Send className="h-5 w-5 mr-2 text-blue-600" />
                Commentaires
              </h2>
              
              {/* Ajouter un commentaire */}
              <div className="mb-6">
                <textarea
                  value={nouveauCommentaire}
                  onChange={(e) => setNouveauCommentaire(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={ajouterCommentaire}
                    disabled={!nouveauCommentaire.trim() || savingComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingComment ? 'Enregistrement...' : 'Ajouter'}
                  </button>
                </div>
              </div>
              
              {/* Liste des commentaires */}
              <div className="space-y-4">
                {commentaires.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Aucun commentaire pour le moment</p>
                ) : (
                  commentaires.map((commentaire) => (
                    <div key={commentaire.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{commentaire.utilisateur_nom}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(commentaire.date_creation).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-gray-700">{commentaire.contenu}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Changement de statut */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Changer le statut</h3>
              
              <select
                value={candidature.statut_candidature}
                onChange={(e) => updateStatut(e.target.value)}
                disabled={updatingStatus}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="En attente">En attente</option>
                <option value="En cours d'étude">En cours d'étude</option>
                <option value="Entretien programmé">Entretien programmé</option>
                <option value="Acceptée">Acceptée</option>
                <option value="Refusée">Refusée</option>
              </select>
              
              {updatingStatus && (
                <p className="text-sm text-gray-600 mt-2">Mise à jour en cours...</p>
              )}
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/stagiaires')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la liste
                </button>
                
                {candidature.cv_url && (
                  <>
                    <button
                      onClick={downloadCV}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger CV
                    </button>
                    
                    <button
                      onClick={printCV}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer CV
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 