// ========================================
// src/hooks/useSettings.ts - Hook pour gestion des paramètres COP
// ========================================

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Types adaptés à votre structure française
interface Pole {
  id: string
  nom: string
  code: string
  description?: string
  couleur: string
  actif: boolean
  created_at: string
  updated_at: string
}

interface Filiere {
  id: string
  nom: string
  code: string
  description?: string
  color: string
  pole_id: string
  level?: string
  actif: boolean
  created_at: string
  updated_at: string
  // Données du pôle (depuis la vue)
  pole_name: string
  pole_code: string
  pole_color: string
}

interface EventType {
  id: string
  nom: string
  code: string
  description?: string
  couleur: string
  icon: string
  actif: boolean
  created_at: string
  updated_at: string
}

interface CvStatus {
  id: string
  nom: string
  code: string
  description?: string
  couleur: string
  position: number
  actif: boolean
  created_at: string
  updated_at: string
}

export const useSettings = () => {
  const [poles, setPoles] = useState<Pole[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [cvStatus, setCvStatus] = useState<CvStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger toutes les données
  const loadSettings = async () => {
    try {
      setLoading(true)
      
      // Charger toutes les données en parallèle pour améliorer les performances
      const [polesResult, filieresResult, eventTypesResult, cvStatusResult] = await Promise.all([
        supabase.from('poles').select('*').order('nom'),
        supabase.from('filieres').select('*').order('nom'),
        supabase.from('event_types').select('*').order('nom'),
        supabase.from('cv_status').select('*').order('position')
      ])
      
      if (polesResult.error) throw polesResult.error
      if (filieresResult.error) throw filieresResult.error
      if (eventTypesResult.error) throw eventTypesResult.error
      if (cvStatusResult.error) throw cvStatusResult.error
      
      setPoles(polesResult.data || [])
      setFilieres(filieresResult.data || [])
      setEventTypes(eventTypesResult.data || [])
      setCvStatus(cvStatusResult.data || [])

    } catch (err: unknown) {
      if (err instanceof Error) {
      setError(err.message)
      console.error('Erreur lors du chargement des paramètres:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  // Sauvegarder un pôle
  const savePole = async (poleData: Partial<Pole>) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      
      const dataToSave = {
        nom: poleData.nom,
        code: poleData.code,
        description: poleData.description,
        couleur: poleData.couleur || '#1E3A8A',
        actif: poleData.actif !== undefined ? poleData.actif : true,
        created_by: user?.user?.id,
        updated_by: user?.user?.id
      }

      if (poleData.id) {
        // Mise à jour
        const { data, error } = await supabase
          .from('poles')
          .update(dataToSave)
          .eq('id', poleData.id)
          .select()
        
        if (error) throw error
        
        setPoles(prev => prev.map(p => p.id === poleData.id ? data[0] : p))
      } else {
        // Création
        const { data, error } = await supabase
          .from('poles')
          .insert([dataToSave])
          .select()
        
        if (error) throw error
        
        setPoles(prev => [...prev, data[0]])
      }
      
      return { success: true }
    } catch (err: unknown) {
      if (err instanceof Error) {
      console.error('Erreur lors de la sauvegarde du pôle:', err)
      return { success: false, error: err.message }
      }
    }
  }

  // Fonction similaire pour les autres entités...
  const saveFiliere = async (filiereData: Partial<Filiere>) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      
      const dataToSave = {
        nom: filiereData.nom,
        code: filiereData.code,
        description: filiereData.description,
        color: filiereData.color || '#3B82F6',
        pole_id: filiereData.pole_id,
        level: filiereData.level,
        actif: filiereData.actif !== undefined ? filiereData.actif : true,
        created_by: user?.user?.id,
        updated_by: user?.user?.id
      }

      if (filiereData.id) {
        const { data, error } = await supabase
          .from('filieres')
          .update(dataToSave)
          .eq('id', filiereData.id)
          .select()
        
        if (error) throw error
        
        // Recharger depuis la vue complète
        await loadSettings()
      } else {
        const { data, error } = await supabase
          .from('filieres')
          .insert([dataToSave])
          .select()
        
        if (error) throw error
        
        // Recharger depuis la vue complète
        await loadSettings()
      }
      
      return { success: true }
    } catch (err: unknown) {
      if (err instanceof Error) {
      return { success: false, error: err.message }
      }
    }
  }

  // Supprimer un élément
  const deleteItem = async (table: string, itemId: string) => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', itemId)
      
      if (error) throw error
      
      // Recharger les données
      await loadSettings()
      
      return { success: true }
    } catch (err: unknown) {
      if (err instanceof Error) {
      return { success: false, error: err.message }
      }
    }
  }

  // Activer/désactiver
  const toggleActive = async (table: string, itemId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ actif: !currentActive })
        .eq('id', itemId)
      
      if (error) throw error
      
      // Recharger les données
      await loadSettings()
      
      return { success: true }
    } catch (err: unknown) {
      if (err instanceof Error) {
      return { success: false, error: err.message }
      }
    }
  }

  // Configurer les abonnements temps réel
  useEffect(() => {
    loadSettings()

    // Abonnements Realtime optimisés - mise à jour locale au lieu de recharger tout
    const subscription = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poles' }, (payload) => {
        setPoles(prev => [...prev, payload.new as Pole])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'poles' }, (payload) => {
        setPoles(prev => prev.map(p => p.id === payload.new.id ? payload.new as Pole : p))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'poles' }, (payload) => {
        setPoles(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'filieres' }, (payload) => {
        setFilieres(prev => [...prev, payload.new as Filiere])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'filieres' }, (payload) => {
        setFilieres(prev => prev.map(f => f.id === payload.new.id ? payload.new as Filiere : f))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'filieres' }, (payload) => {
        setFilieres(prev => prev.filter(f => f.id !== payload.old.id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_types' }, (payload) => {
        setEventTypes(prev => [...prev, payload.new as EventType])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_types' }, (payload) => {
        setEventTypes(prev => prev.map(e => e.id === payload.new.id ? payload.new as EventType : e))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'event_types' }, (payload) => {
        setEventTypes(prev => prev.filter(e => e.id !== payload.old.id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cv_status' }, (payload) => {
        setCvStatus(prev => [...prev, payload.new as CvStatus])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cv_status' }, (payload) => {
        setCvStatus(prev => prev.map(c => c.id === payload.new.id ? payload.new as CvStatus : c))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cv_status' }, (payload) => {
        setCvStatus(prev => prev.filter(c => c.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    // États
    poles,
    filieres,
    eventTypes,
    cvStatus,
    loading,
    error,
    // Actions
    loadSettings,
    savePole,
    saveFiliere,
    deleteItem,
    toggleActive
  }
}