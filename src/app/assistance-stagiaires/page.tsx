'use client'

import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Eye,
  User,
  Calendar,
  Settings,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface DemandeAssistance {
  id: string
  nom: string
  prenom: string
  telephone: string
  type_assistance: string
  statut: 'en_attente' | 'en_cours' | 'terminee'
  created_at: string
  conseiller_id: string
  poles?: {
    nom: string
    code: string
  }
  filieres?: {
    nom: string
    code: string
  }
  profiles?: {
    nom: string
    prenom: string
    email: string
    role: string
  }
}

const typesAssistance = {
  orientation: 'Orientation',
  strategie: 'Stratégie de recherche d\'emploi',
  entretiens: 'Préparation aux entretiens',
  developpement: 'Développement personnel'
}

const statuts = {
  en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  terminee: { label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle }
}

export default function AssistanceStagiaires() {
  const [demandes, setDemandes] = useState<DemandeAssistance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDemandes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/assistance-stagiaires')
      const result = await response.json()
      
      if (result.success) {
        setDemandes(result.data || [])
      } else {
        setError('Erreur lors du chargement des demandes')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDemandes()
  }, [])

  const getStatutIcon = (statut: string) => {
    const IconComponent = statuts[statut as keyof typeof statuts]?.icon || Clock
    return <IconComponent className="w-4 h-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🆘 Assistance Stagiaires
              </h1>
              <p className="text-gray-600">
                Centre d'assistance et d'accompagnement pour les stagiaires
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/assistance-stagiaires/conseiller"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Interface conseiller
              </Link>
              <Link
                href="/assistance-stagiaires/demande"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nouvelle demande
              </Link>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total demandes</p>
                <p className="text-2xl font-bold text-gray-900">{demandes.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {demandes.filter(d => d.statut === 'en_attente').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {demandes.filter(d => d.statut === 'en_cours').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-green-600">
                  {demandes.filter(d => d.statut === 'terminee').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Link
            href="/assistance-stagiaires/demande"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Nouvelle demande</h3>
                <p className="text-gray-600">Soumettre une demande d'assistance</p>
              </div>
            </div>
          </Link>

          <Link
            href="/assistance-stagiaires/conseiller"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Interface conseiller</h3>
                <p className="text-gray-600">Gérer les demandes d'assistance</p>
              </div>
            </div>
          </Link>

          <Link
            href="/assistance-stagiaires/admin"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tableau de bord admin</h3>
                <p className="text-gray-600">Vue d'ensemble de toutes les demandes</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Liste des demandes récentes */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Demandes récentes
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des demandes...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadDemandes}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : demandes.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune demande d'assistance</p>
              <Link
                href="/assistance-stagiaires/demande"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer la première demande
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stagiaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type d'assistance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {demandes.slice(0, 10).map((demande) => (
                    <tr key={demande.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {demande.prenom} {demande.nom}
                        </div>
                        <div className="text-sm text-gray-500">{demande.telephone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {typesAssistance[demande.type_assistance as keyof typeof typesAssistance]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statuts[demande.statut].color}`}>
                          {getStatutIcon(demande.statut)}
                          {statuts[demande.statut].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(demande.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href="/assistance-stagiaires/conseiller"
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}