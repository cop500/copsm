import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Rapport {
  id: string
  evenement_id: string
  type_rapport: 'rapport' | 'compte-rendu' | 'flash-info'
  contenu: string
  titre_rapport?: string
  date_generation: string
  created_by?: string
  updated_at: string
}

export const useRapports = (evenementId?: string) => {
  const [rapports, setRapports] = useState<Rapport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Charger les rapports d'un événement
  const loadRapports = async (eventId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('rapports_evenements')
        .select('*')
        .eq('evenement_id', eventId)
        .order('date_generation', { ascending: false })

      if (error) throw error
      setRapports(data || [])
    } catch (err: any) {
      console.error('Erreur chargement rapports:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Sauvegarder un nouveau rapport
  const saveRapport = async (rapport: Omit<Rapport, 'id' | 'date_generation' | 'created_by' | 'updated_at'>) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('rapports_evenements')
        .insert([rapport])
        .select()
        .single()

      if (error) throw error
      
      // Ajouter le nouveau rapport à la liste
      setRapports(prev => [data, ...prev])
      return { success: true, data }
    } catch (err: any) {
      console.error('Erreur sauvegarde rapport:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Modifier un rapport existant
  const updateRapport = async (rapportId: string, updates: Partial<Rapport>) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('rapports_evenements')
        .update(updates)
        .eq('id', rapportId)
        .select()
        .single()

      if (error) throw error
      
      // Mettre à jour le rapport dans la liste
      setRapports(prev => prev.map(r => r.id === rapportId ? data : r))
      return { success: true, data }
    } catch (err: any) {
      console.error('Erreur modification rapport:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Supprimer un rapport
  const deleteRapport = async (rapportId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase
        .from('rapports_evenements')
        .delete()
        .eq('id', rapportId)

      if (error) throw error
      
      // Retirer le rapport de la liste
      setRapports(prev => prev.filter(r => r.id !== rapportId))
      return { success: true }
    } catch (err: any) {
      console.error('Erreur suppression rapport:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Charger les rapports au démarrage si un evenementId est fourni
  useEffect(() => {
    if (evenementId) {
      loadRapports(evenementId)
    }
  }, [evenementId])

  return {
    rapports,
    loading,
    error,
    loadRapports,
    saveRapport,
    updateRapport,
    deleteRapport
  }
} 