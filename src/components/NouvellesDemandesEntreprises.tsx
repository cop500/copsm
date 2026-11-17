'use client'

import React from 'react'
import { Building2, Clock, ArrowRight } from 'lucide-react'
import { useDemandesEntreprises } from '@/hooks/useDemandesEntreprises'
import { useRouter } from 'next/navigation'

const NouvellesDemandesEntreprises: React.FC<{ limite?: number }> = ({ limite = 10 }) => {
  const { demandes, loading } = useDemandesEntreprises()
  const router = useRouter()
  const enAttente = demandes.filter((d) => d.statut === 'en_attente').length
  const enCours = demandes.filter((d) => d.statut === 'en_cours').length

  // Fonction pour obtenir la couleur du statut
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return 'bg-[#0f3d6c]/10 text-[#0f3d6c] border-[#0f3d6c]/20'
      case 'en_cours':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'terminee':
        return 'bg-slate-50 text-slate-600 border-slate-200'
      case 'refusee':
        return 'bg-slate-50 text-slate-500 border-slate-200'
      case 'annulee':
        return 'bg-slate-50 text-slate-500 border-slate-200'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200'
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

  const recentDemandes = [...demandes]
    .sort((a, b) => {
      const prio = (s: string | undefined) =>
        s === 'en_attente' ? 0 : s === 'en_cours' ? 1 : 2
      const d = prio(a.statut) - prio(b.statut)
      if (d !== 0) return d
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .slice(0, limite)

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
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[#0f3d6c]/10 bg-[#0f3d6c]/5 px-3 py-2">
          <p className="text-[11px] text-slate-500">En attente</p>
          <p className="text-lg font-semibold tabular-nums text-[#0f3d6c]">{enAttente}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] text-slate-500">En cours</p>
          <p className="text-lg font-semibold tabular-nums text-slate-700">{enCours}</p>
        </div>
      </div>
      {recentDemandes.map((demande) => (
        <div
          key={demande.id}
          onClick={() => router.push(`/dashboard-admin?demande=${demande.id}`)}
          className="group cursor-pointer rounded-xl border border-[#0f3d6c]/10 bg-white p-3.5 hover:border-[#0f3d6c]/30"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-[#0f3d6c]" />
                <h3 className="truncate text-sm font-semibold text-[#0f3d6c]">
                  {demande.entreprise_nom}
                </h3>
                {(demande as any).reference && (
                  <span className="shrink-0 rounded bg-[#0f3d6c]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#0f3d6c]">
                    {(demande as any).reference}
                  </span>
                )}
              </div>
              <p className="mb-1 text-xs text-slate-500">
                {getTypeDemandeLabel(demande.type_demande)}
                {demande.profils && demande.profils.length > 0 && (
                  <span className="ml-2">
                    • {demande.profils.length} profil{demande.profils.length > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${getStatutColor(demande.statut || 'en_attente')}`}
            >
              {getStatutLabel(demande.statut || 'en_attente')}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-[#0f3d6c]/10 pt-2">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{getTimeAgo(demande.created_at)}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-[#0f3d6c]">
              <span>Voir</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      ))}
      
      {demandes.length > limite && (
        <button
          onClick={() => router.push('/dashboard-admin')}
          className="w-full mt-2 py-2 px-4 border border-[#0f3d6c]/20 text-[#0f3d6c] hover:bg-[#0f3d6c]/5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          Voir toutes les demandes ({demandes.length})
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default NouvellesDemandesEntreprises

