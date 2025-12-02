'use client'

import React from 'react'
import { 
  Calendar, 
  Clock, 
  Target, 
  AlertCircle,
  TrendingUp,
  Building2,
  CheckCircle
} from 'lucide-react'
import type { VisiteEntreprise } from '@/hooks/useVisitesEntreprises'

interface VisitesDashboardProps {
  visites: VisiteEntreprise[]
  stats: {
    visitesEffectuees: number
    visitesPlanifiees: number
    entreprisesPrioritaires: number
    actionsEnRetard: number
  }
}

const VisitesDashboard: React.FC<VisitesDashboardProps> = ({ visites, stats }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Tableau de bord</h2>
      
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Visites effectuées */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Visites effectuées</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.visitesEffectuees}</p>
              <p className="text-xs text-gray-500 mt-1">Ce mois</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Visites planifiées */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Visites planifiées</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.visitesPlanifiees}</p>
              <p className="text-xs text-gray-500 mt-1">À venir</p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Entreprises prioritaires */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entreprises prioritaires</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.entreprisesPrioritaires}</p>
              <p className="text-xs text-gray-500 mt-1">Intérêt fort</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Actions en retard */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actions en retard</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.actionsEnRetard}</p>
              <p className="text-xs text-gray-500 mt-1">À traiter</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Prochaines visites */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Prochaines visites
        </h3>
        {visites.filter(v => new Date(v.date_visite) > new Date()).length > 0 ? (
          <div className="space-y-3">
            {visites
              .filter(v => new Date(v.date_visite) > new Date())
              .slice(0, 5)
              .map((visite) => (
                <div
                  key={visite.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {visite.entreprise?.nom || 'Entreprise inconnue'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(visite.date_visite).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {visite.heure_visite && ` à ${visite.heure_visite}`}
                    </p>
                    {visite.objectif && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {visite.objectif}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    {visite.statut_relation === 'fort' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Prioritaire
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Aucune visite planifiée</p>
        )}
      </div>
    </div>
  )
}

export default VisitesDashboard

