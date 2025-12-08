// ========================================
// Hook pour gérer le calendrier collaboratif
// ========================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRealTime } from './useRealTime'

export interface CalendrierEvent {
  id: string
  user_id: string
  titre: string
  description?: string
  date_debut: string
  date_fin: string
  couleur: string
  created_at: string
  updated_at: string
  animateur_id?: string
  salle?: string
  // Informations utilisateur (créateur)
  profiles?: {
    nom: string
    prenom: string
    email: string
  }
  // Informations animateur
  animateur?: {
    nom: string
    prenom: string
    email: string
    role: string
  }
}

export const useCalendrierCollaboratif = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendrierEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger tous les événements du calendrier
  const loadEvents = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('calendrier_collaboratif')
        .select('*')
        .order('date_debut', { ascending: true })

      // Filtrer par plage de dates si fournie
      if (startDate && endDate) {
        query = query
          .gte('date_debut', startDate.toISOString())
          .lte('date_debut', endDate.toISOString())
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Récupérer les profils séparément (créateur et animateur)
      const eventsWithProfiles = await Promise.all(
        (data || []).map(async (event) => {
          const [profileResult, animateurResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('nom, prenom, email')
              .eq('id', event.user_id)
              .single(),
            event.animateur_id
              ? supabase
                  .from('profiles')
                  .select('nom, prenom, email, role')
                  .eq('id', event.animateur_id)
                  .single()
              : Promise.resolve({ data: null })
          ])

          return {
            ...event,
            profiles: profileResult.data || null,
            animateur: animateurResult.data || null
          }
        })
      )

      setEvents(eventsWithProfiles)
    } catch (err: any) {
      console.error('Erreur chargement événements calendrier:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Créer un événement
  const createEvent = async (event: {
    titre: string
    description?: string
    date_debut: string
    date_fin: string
    couleur?: string
    animateur_id?: string
    salle?: string
  }) => {
    try {
      if (!user?.id) throw new Error('Utilisateur non authentifié')

      // Vérifier les chevauchements pour le même utilisateur
      const { data: existingEvents } = await supabase
        .from('calendrier_collaboratif')
        .select('id, date_debut, date_fin')
        .eq('user_id', user.id)

      if (existingEvents) {
        const hasOverlap = existingEvents.some((existing) => {
          const existingStart = new Date(existing.date_debut)
          const existingEnd = new Date(existing.date_fin)
          const newStart = new Date(event.date_debut)
          const newEnd = new Date(event.date_fin)
          
          // Vérifier si les créneaux se chevauchent
          return (newStart < existingEnd && newEnd > existingStart)
        })

        if (hasOverlap) {
          throw new Error('Vous avez déjà un événement à ce créneau horaire')
        }
      }

      const { data: newEvent, error: insertError } = await supabase
        .from('calendrier_collaboratif')
        .insert([
          {
            user_id: user.id,
            titre: event.titre,
            description: event.description || null,
            date_debut: event.date_debut,
            date_fin: event.date_fin,
            couleur: event.couleur || '#3B82F6',
            animateur_id: event.animateur_id || null,
            salle: event.salle || null
          }
        ])
        .select('*')
        .single()

      if (insertError) throw insertError

      // Récupérer les profils (créateur et animateur)
      const [profileResult, animateurResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('nom, prenom, email')
          .eq('id', user.id)
          .single(),
        newEvent.animateur_id
          ? supabase
              .from('profiles')
              .select('nom, prenom, email, role')
              .eq('id', newEvent.animateur_id)
              .single()
          : Promise.resolve({ data: null })
      ])

      const eventWithProfile = {
        ...newEvent,
        profiles: profileResult.data || null,
        animateur: animateurResult.data || null
      }

      // Ajouter à la liste locale
      setEvents((prev) => [...prev, eventWithProfile].sort((a, b) => 
        new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()
      ))

      return { success: true, data: eventWithProfile }
    } catch (err: any) {
      console.error('Erreur création événement:', err)
      return { success: false, error: err.message }
    }
  }

  // Modifier un événement
  const updateEvent = async (eventId: string, updates: {
    titre?: string
    description?: string
    date_debut?: string
    date_fin?: string
    couleur?: string
    animateur_id?: string
    salle?: string
  }) => {
    try {
      if (!user?.id) throw new Error('Utilisateur non authentifié')

      // Vérifier que l'événement appartient à l'utilisateur
      const { data: existingEvent } = await supabase
        .from('calendrier_collaboratif')
        .select('user_id')
        .eq('id', eventId)
        .single()

      if (!existingEvent) throw new Error('Événement non trouvé')
      if (existingEvent.user_id !== user.id) {
        throw new Error('Vous ne pouvez modifier que vos propres événements')
      }

      // Vérifier les chevauchements si les dates changent
      if (updates.date_debut || updates.date_fin) {
        const dateDebut = updates.date_debut || existingEvent.date_debut
        const dateFin = updates.date_fin || existingEvent.date_fin

        const { data: otherEvents } = await supabase
          .from('calendrier_collaboratif')
          .select('id, date_debut, date_fin')
          .eq('user_id', user.id)
          .neq('id', eventId)

        if (otherEvents) {
          const hasOverlap = otherEvents.some((other) => {
            const otherStart = new Date(other.date_debut)
            const otherEnd = new Date(other.date_fin)
            const newStart = new Date(dateDebut)
            const newEnd = new Date(dateFin)
            
            // Vérifier si les créneaux se chevauchent
            return (newStart < otherEnd && newEnd > otherStart)
          })

          if (hasOverlap) {
            throw new Error('Vous avez déjà un événement à ce créneau horaire')
          }
        }
      }

      const { data: updatedEvent, error: updateError } = await supabase
        .from('calendrier_collaboratif')
        .update(updates)
        .eq('id', eventId)
        .select('*')
        .single()

      if (updateError) throw updateError

      // Récupérer les profils (créateur et animateur)
      const [profileResult, animateurResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('nom, prenom, email')
          .eq('id', updatedEvent.user_id)
          .single(),
        updatedEvent.animateur_id
          ? supabase
              .from('profiles')
              .select('nom, prenom, email, role')
              .eq('id', updatedEvent.animateur_id)
              .single()
          : Promise.resolve({ data: null })
      ])

      const eventWithProfile = {
        ...updatedEvent,
        profiles: profileResult.data || null,
        animateur: animateurResult.data || null
      }

      // Mettre à jour la liste locale
      setEvents((prev) =>
        prev
          .map((e) => (e.id === eventId ? eventWithProfile : e))
          .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime())
      )

      return { success: true, data: eventWithProfile }
    } catch (err: any) {
      console.error('Erreur modification événement:', err)
      return { success: false, error: err.message }
    }
  }

  // Supprimer un événement
  const deleteEvent = async (eventId: string) => {
    try {
      if (!user?.id) throw new Error('Utilisateur non authentifié')

      // Vérifier que l'événement appartient à l'utilisateur
      const { data: existingEvent } = await supabase
        .from('calendrier_collaboratif')
        .select('user_id')
        .eq('id', eventId)
        .single()

      if (!existingEvent) throw new Error('Événement non trouvé')
      if (existingEvent.user_id !== user.id) {
        throw new Error('Vous ne pouvez supprimer que vos propres événements')
      }

      const { error: deleteError } = await supabase
        .from('calendrier_collaboratif')
        .delete()
        .eq('id', eventId)

      if (deleteError) throw deleteError

      // Retirer de la liste locale
      setEvents((prev) => prev.filter((e) => e.id !== eventId))

      return { success: true }
    } catch (err: any) {
      console.error('Erreur suppression événement:', err)
      return { success: false, error: err.message }
    }
  }

  // Charger les événements au montage
  useEffect(() => {
    if (user?.id) {
      // Charger les événements du mois en cours
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      loadEvents(startOfMonth, endOfMonth)
    }
  }, [user?.id]) // Retirer loadEvents de la dépendance pour éviter les re-renders infinis

  // Synchronisation en temps réel
  const handleRealtimeChange = useCallback(({ eventType, new: newRow, old: oldRow }) => {
    if (eventType === 'INSERT' && newRow) {
      setEvents((prev) => [...prev, newRow].sort((a, b) => 
        new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()
      ))
    }
    if (eventType === 'UPDATE' && newRow) {
      setEvents((prev) =>
        prev
          .map((e) => (e.id === newRow.id ? newRow : e))
          .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime())
      )
    }
    if (eventType === 'DELETE' && oldRow) {
      setEvents((prev) => prev.filter((e) => e.id !== oldRow.id))
    }
  }, [])

  const { isConnected } = useRealTime('calendrier_collaboratif', handleRealtimeChange)

  return {
    events,
    loading,
    error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    isRealtimeConnected: isConnected
  }
}
