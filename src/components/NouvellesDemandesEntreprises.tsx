'use client'

import React from 'react'
import { Building2, Clock, ArrowRight, AlertCircle } from 'lucide-react'
import { useDemandesEntreprises } from '@/hooks/useDemandesEntreprises'
import { useRouter } from 'next/navigation'

const NouvellesDemandesEntreprises: React.FC = () => {
  const { demandes, loading } = useDemandesEntreprises()
  const router = useRouter()

  // Fonction pour obtenir la couleur du statut
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'en_cours':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'terminee':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'refusee':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'annulee':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Fonction pour obtenir le label du statut
  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return 'En attente'
      case 'en_cours':
        return 'En cours'
      case 'terminee':
        return 'Terminée'
      case 'refusee':
        return 'Refusée'
      case 'annulee':
        return 'Annulée'
      default:
        return statut
    }
  }

  // Fonction pour obtenir le type de demande
  const getTypeDemandeLabel = (type: string) => {
    switch (type) {
      case 'cv':
        return 'Demande CV'
      case 'evenement':
        return 'Événement'
      default:
        return type
    }
  }

  // Fonction pour formater le temps relatif
  const getTimeAgo = (date: string) => {
    const now = new Date()
    const messageDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    const diffInDays = Math.floor(diffInMinutes / 1440)
    if (diffInDays === 1) return 'Hier'
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`
    return messageDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // Prendre les 5 demandes les plus récentes
  const recentDemandes = demandes.slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (recentDemandes.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Aucune demande récente</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recentDemandes.map((demande) => (
        <div
          key={demande.id}
          onClick={() => router.push(`/dashboard-admin?demande=${demande.id}`)}
          className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {demande.entreprise_nom}
                </h3>
                {(demande as any).reference && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono font-semibold flex-shrink-0">
                    {(demande as any).reference}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-2">
                {getTypeDemandeLabel(demande.type_demande)}
                {demande.profils && demande.profils.length > 0 && (
                  <span className="ml-2">
                    • {demande.profils.length} profil{demande.profils.length > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-md border flex-shrink-0 ${getStatutColor(demande.statut || 'en_attente')}`}
            >
              {getStatutLabel(demande.statut || 'en_attente')}
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{getTimeAgo(demande.created_at)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600 group-hover:text-blue-700">
              <span className="font-medium">Voir</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      ))}
      
      {demandes.length > 5 && (
        <button
          onClick={() => router.push('/dashboard-admin')}
          className="w-full mt-4 py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          Voir toutes les demandes ({demandes.length})
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default NouvellesDemandesEntreprises

