'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useEvenements } from '@/hooks/useEvenements'
import { useRouter } from 'next/navigation'

const EvenementsPassesCarousel: React.FC = () => {
  const { evenements, loading } = useEvenements()
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Filtrer les événements passés (terminés ou date_fin < aujourd'hui)
  const evenementsPasses = React.useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    return evenements.filter((event) => {
      // Événements terminés
      if (event.statut === 'termine') return true
      
      // Événements avec date_fin passée
      if (event.date_fin) {
        const dateFin = new Date(event.date_fin)
        dateFin.setHours(0, 0, 0, 0)
        return dateFin < now
      }
      
      // Événements avec date_debut passée (si pas de date_fin)
      if (event.date_debut) {
        const dateDebut = new Date(event.date_debut)
        dateDebut.setHours(0, 0, 0, 0)
        return dateDebut < now
      }
      
      return false
    }).slice(0, 10) // Limiter à 10 événements
  }, [evenements])

  // Rotation automatique
  useEffect(() => {
    if (evenementsPasses.length <= 1 || isPaused) return

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % evenementsPasses.length)
    }, 5000) // Change toutes les 5 secondes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [evenementsPasses.length, isPaused])

  // Navigation manuelle
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + evenementsPasses.length) % evenementsPasses.length)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 10000) // Reprendre après 10 secondes
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % evenementsPasses.length)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 10000)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 10000)
  }

  // Formatage des dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="relative h-64 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-400">Chargement des événements...</div>
      </div>
    )
  }

  if (evenementsPasses.length === 0) {
    return (
      <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex flex-col items-center justify-center p-6">
        <Calendar className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500 text-center">Aucun événement passé à afficher</p>
      </div>
    )
  }

  const currentEvent = evenementsPasses[currentIndex]
  const imageUrl = currentEvent.photos_urls?.[0] || currentEvent.image_url || '/photo_evenement_effet.jpg'

  return (
    <div 
      className="relative h-64 rounded-lg overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Image de fond */}
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt={currentEvent.titre}
          className="w-full h-full object-cover transition-opacity duration-500"
          onError={(e) => {
            e.currentTarget.src = '/photo_evenement_effet.jpg'
          }}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      {/* Contenu */}
      <div className="relative h-full flex flex-col justify-between p-6 text-white">
        {/* En-tête avec type d'événement */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {currentEvent.event_types?.nom && (
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-2">
                {currentEvent.event_types.nom}
              </span>
            )}
            <h3 className="text-xl font-bold mb-2 line-clamp-2">
              {currentEvent.titre}
            </h3>
          </div>
        </div>

        {/* Informations */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{formatDate(currentEvent.date_debut)}</span>
            {currentEvent.date_fin && (
              <>
                <span>•</span>
                <span>{formatDate(currentEvent.date_fin)}</span>
              </>
            )}
          </div>
          
          {currentEvent.lieu && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">{currentEvent.lieu}</span>
            </div>
          )}

          {currentEvent.description && (
            <p className="text-sm line-clamp-2 opacity-90 mt-2">
              {currentEvent.description}
            </p>
          )}
        </div>

        {/* Bouton voir plus */}
        <button
          onClick={() => router.push(`/evenements?event=${currentEvent.id}`)}
          className="self-start mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 group/btn"
        >
          Voir les détails
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Boutons de navigation */}
      {evenementsPasses.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Événement précédent"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Événement suivant"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Indicateurs de pagination */}
      {evenementsPasses.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {evenementsPasses.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Aller à l'événement ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Compteur */}
      {evenementsPasses.length > 1 && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/30 backdrop-blur-sm rounded-full text-xs text-white">
          {currentIndex + 1} / {evenementsPasses.length}
        </div>
      )}
    </div>
  )
}

export default EvenementsPassesCarousel

