'use client'

import React, { useState } from 'react'
import { 
  CheckCircle, XCircle, AlertTriangle, Clock, 
  FileText, User, Building2, Calendar, 
  MessageSquare, Send, ArrowLeft, Eye, Edit3
} from 'lucide-react'
import Link from 'next/link'

// Types pour les motifs
interface Motif {
  id: string
  type: 'refus' | 'acceptation' | 'attente' | 'entretien'
  titre: string
  description: string
  categorie: string
  couleur: string
  icone: React.ReactNode
}

// Motifs prédéfinis
const motifsPredefinis: Motif[] = [
  {
    id: '1',
    type: 'refus',
    titre: 'Profil non conforme',
    description: 'Le profil du candidat ne correspond pas aux exigences du poste demandé.',
    categorie: 'Compétences',
    couleur: 'red',
    icone: <XCircle className="w-5 h-5" />
  },
  {
    id: '2',
    type: 'refus',
    titre: 'Expérience insuffisante',
    description: 'Le niveau d\'expérience du candidat est en dessous des attentes pour ce poste.',
    categorie: 'Expérience',
    couleur: 'red',
    icone: <XCircle className="w-5 h-5" />
  },
  {
    id: '3',
    type: 'refus',
    titre: 'Disponibilité incompatible',
    description: 'Les disponibilités du candidat ne correspondent pas aux besoins de l\'entreprise.',
    categorie: 'Disponibilité',
    couleur: 'red',
    icone: <XCircle className="w-5 h-5" />
  },
  {
    id: '4',
    type: 'acceptation',
    titre: 'Profil excellent',
    description: 'Le candidat présente un profil parfaitement adapté au poste et aux exigences.',
    categorie: 'Compétences',
    couleur: 'green',
    icone: <CheckCircle className="w-5 h-5" />
  },
  {
    id: '5',
    type: 'entretien',
    titre: 'Entretien programmé',
    description: 'Un entretien a été programmé pour évaluer plus en détail le candidat.',
    categorie: 'Processus',
    couleur: 'blue',
    icone: <Calendar className="w-5 h-5" />
  },
  {
    id: '6',
    type: 'attente',
    titre: 'En cours d\'évaluation',
    description: 'Le dossier est en cours d\'évaluation par l\'équipe COP.',
    categorie: 'Processus',
    couleur: 'yellow',
    icone: <Clock className="w-5 h-5" />
  }
]

export default function MotifsPage() {
  const [motifs, setMotifs] = useState<Motif[]>(motifsPredefinis)
  const [showForm, setShowForm] = useState(false)
  const [editingMotif, setEditingMotif] = useState<Motif | null>(null)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    categorie: '',
    type: 'refus' as 'refus' | 'acceptation' | 'attente' | 'entretien'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('tous')

  // Filtrer les motifs
  const filteredMotifs = motifs.filter(motif => {
    const matchesSearch = motif.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motif.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motif.categorie.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'tous' || motif.type === filterType
    
    return matchesSearch && matchesType
  })

  // Gérer l'ajout/modification
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingMotif) {
      // Modification
      setMotifs(motifs.map(m => 
        m.id === editingMotif.id 
          ? { ...m, ...formData, couleur: getCouleurByType(formData.type) }
          : m
      ))
    } else {
      // Ajout
      const nouveauMotif: Motif = {
        id: Date.now().toString(),
        ...formData,
        couleur: getCouleurByType(formData.type),
        icone: getIconeByType(formData.type)
      }
      setMotifs([...motifs, nouveauMotif])
    }
    
    setFormData({ titre: '', description: '', categorie: '', type: 'refus' })
    setShowForm(false)
    setEditingMotif(null)
  }

  // Supprimer un motif
  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce motif ?')) {
      setMotifs(motifs.filter(m => m.id !== id))
    }
  }

  // Fonctions utilitaires
  const getCouleurByType = (type: string) => {
    switch (type) {
      case 'refus': return 'red'
      case 'acceptation': return 'green'
      case 'entretien': return 'blue'
      case 'attente': return 'yellow'
      default: return 'gray'
    }
  }

  const getIconeByType = (type: string) => {
    switch (type) {
      case 'refus': return <XCircle className="w-5 h-5" />
      case 'acceptation': return <CheckCircle className="w-5 h-5" />
      case 'entretien': return <Calendar className="w-5 h-5" />
      case 'attente': return <Clock className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getCouleurClasses = (couleur: string) => {
    switch (couleur) {
      case 'red': return 'bg-red-50 border-red-200 text-red-800'
      case 'green': return 'bg-green-50 border-green-200 text-green-800'
      case 'blue': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'yellow': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Motifs</h1>
              <p className="text-gray-600">Gérez les motifs de décision pour les candidatures</p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un motif..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="tous">Tous les types</option>
                  <option value="refus">Refus</option>
                  <option value="acceptation">Acceptation</option>
                  <option value="entretien">Entretien</option>
                  <option value="attente">En attente</option>
                </select>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Nouveau motif
              </button>
            </div>
          </div>
        </div>

        {/* Liste des motifs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMotifs.map((motif) => (
            <div
              key={motif.id}
              className={`bg-white rounded-lg border-2 p-6 hover:shadow-lg transition-all duration-200 ${getCouleurClasses(motif.couleur)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {motif.icone}
                  <div>
                    <h3 className="font-semibold text-lg">{motif.titre}</h3>
                    <span className="text-sm opacity-75">{motif.categorie}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingMotif(motif)
                      setFormData({
                        titre: motif.titre,
                        description: motif.description,
                        categorie: motif.categorie,
                        type: motif.type
                      })
                      setShowForm(true)
                    }}
                    className="p-1 hover:bg-white/50 rounded"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(motif.id)}
                    className="p-1 hover:bg-white/50 rounded text-red-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm opacity-90 leading-relaxed">{motif.description}</p>
            </div>
          ))}
        </div>

        {/* Message si aucun résultat */}
        {filteredMotifs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun motif trouvé</h3>
            <p className="text-gray-500">Aucun motif ne correspond à votre recherche.</p>
          </div>
        )}

        {/* Formulaire d'ajout/modification */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white relative overflow-hidden">
              {/* Background avec motifs professionnels cohérents */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-stone-50 to-amber-50 opacity-90"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.02)_25%,rgba(0,0,0,0.02)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.02)_75%)] bg-[length:20px_20px]"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingMotif ? 'Modifier le motif' : 'Nouveau motif'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingMotif(null)
                      setFormData({ titre: '', description: '', categorie: '', type: 'refus' })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                      <input
                        type="text"
                        value={formData.titre}
                        onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Profil non conforme"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="refus">Refus</option>
                        <option value="acceptation">Acceptation</option>
                        <option value="entretien">Entretien</option>
                        <option value="attente">En attente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                    <input
                      type="text"
                      value={formData.categorie}
                      onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Compétences, Expérience, Disponibilité"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Décrivez le motif en détail..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        setEditingMotif(null)
                        setFormData({ titre: '', description: '', categorie: '', type: 'refus' })
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      {editingMotif ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
