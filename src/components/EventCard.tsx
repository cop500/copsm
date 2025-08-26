'use client'

import React, { useState } from 'react'
import { 
  Calendar, MapPin, User, Clock, Image, Eye, 
  Edit3, Trash2, Plus, X, ChevronLeft, ChevronRight,
  FileText, Building, Users, Award, Zap
} from 'lucide-react'

interface EventCardProps {
  event: {
    id: string
    titre: string
    type_evenement_id?: string
    date_debut: string
    date_fin?: string
    lieu: string
    description: string
    responsable_cop?: string
    statut: string
    photos_urls?: string[]
    event_types?: {
      nom: string
      couleur: string
    }
  }
  onEdit?: (event: any) => void
  onDelete?: (id: string) => void
  onView?: (event: any) => void
  onGenerateContent?: (event: any) => void
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onEdit, 
  onDelete, 
  onView,
  onGenerateContent
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showPhotoModal, setShowPhotoModal] = useState(false)

  // Debug logs pour les photos
  console.log('📸 EventCard - Événement:', event.titre)
  console.log('📸 EventCard - Photos URLs:', event.photos_urls)
  console.log('📸 EventCard - Nombre de photos:', event.photos_urls?.length || 0)

  // Fonctions utilitaires
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'en_cours': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'termine': return 'bg-green-100 text-green-800 border-green-200'
      case 'annule': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'Planifié'
      case 'en_cours': return 'En cours'
      case 'termine': return 'Terminé'
      case 'annule': return 'Annulé'
      default: return statut
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Navigation photos
  const nextPhoto = () => {
    if (event.photos_urls && event.photos_urls.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === event.photos_urls!.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevPhoto = () => {
    if (event.photos_urls && event.photos_urls.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? event.photos_urls!.length - 1 : prev - 1
      )
    }
  }

  return (
    <>
      {/* Card principale */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
        {/* Section photos */}
        {event.photos_urls && event.photos_urls.length > 0 ? (
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.photos_urls[currentPhotoIndex]}
              alt={`Photo ${currentPhotoIndex + 1} - ${event.titre}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Overlay avec informations */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-medium">
                      {formatDate(event.date_debut)}
                    </span>
                  </div>
                  
                  {/* Navigation photos */}
                  {event.photos_urls.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          prevPhoto()
                        }}
                        className="p-1 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <span className="text-white text-xs">
                        {currentPhotoIndex + 1} / {event.photos_urls.length}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          nextPhoto()
                        }}
                        className="p-1 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton voir toutes les photos */}
            <button
              onClick={() => setShowPhotoModal(true)}
              className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Image className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-blue-300 mx-auto mb-2" />
              <p className="text-blue-400 text-sm">Aucune photo</p>
            </div>
          </div>
        )}

        {/* Contenu de la card */}
        <div className="p-6">
          {/* Header avec titre et statut */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {event.titre}
              </h3>
              
              <div className="flex items-center gap-2 mb-3">
                {event.event_types && (
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: event.event_types.couleur + '20',
                      color: event.event_types.couleur,
                      border: `1px solid ${event.event_types.couleur}40`
                    }}
                  >
                    {event.event_types.nom}
                  </span>
                )}
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatutColor(event.statut)}`}>
                  {getStatutLabel(event.statut)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onGenerateContent && (
                <button
                  onClick={() => onGenerateContent(event)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Générer contenu IA"
                >
                  <Zap className="w-4 h-4" />
                </button>
              )}
              {onView && (
                <button
                  onClick={() => onView(event)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Voir détails"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(event)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(event.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="space-y-3">
            {/* Date et heure */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Début :</span>
              <span>{formatDate(event.date_debut)}</span>
            </div>

            {event.date_fin && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Fin :</span>
                <span>{formatDate(event.date_fin)}</span>
              </div>
            )}

            {/* Lieu */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Lieu :</span>
              <span className="line-clamp-1">{event.lieu}</span>
            </div>

            {/* Responsable */}
            {event.responsable_cop && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Responsable :</span>
                <span>{event.responsable_cop}</span>
              </div>
            )}

            {/* Description */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 line-clamp-3">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* Footer avec actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {event.photos_urls && event.photos_urls.length > 0 && (
                <div className="flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  <span>{event.photos_urls.length} photo(s)</span>
                </div>
              )}
            </div>

            {onView && (
              <button
                onClick={() => onView(event)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
              >
                Voir détails
                <Eye className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal photos */}
      {showPhotoModal && event.photos_urls && event.photos_urls.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            {/* Photo principale */}
            <div className="relative">
              <img
                src={event.photos_urls[currentPhotoIndex]}
                alt={`Photo ${currentPhotoIndex + 1} - ${event.titre}`}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
              
              {/* Navigation */}
              {event.photos_urls.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Informations */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="font-semibold">{event.titre}</h3>
                  <p className="text-sm opacity-90">
                    Photo {currentPhotoIndex + 1} sur {event.photos_urls.length}
                  </p>
                </div>
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Indicateurs */}
            {event.photos_urls.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {event.photos_urls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
} 