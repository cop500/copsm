// ========================================
// src/hooks/useCandidatures.ts - Hook pour gestion des candidatures
// ========================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchAllPages } from '@/lib/supabaseFetchAll'
import { useRealTime } from './useRealTime'

interface Candidature {
  id: string
  demande_cv_id: string
  stagiaire_id?: string
  cv_envoye_id?: string
  entreprise_nom: string
  poste: string
  type_contrat?: string
  date_candidature?: string
  source_offre?: string
  statut_candidature?: string
  date_derniere_maj?: string
  prochaine_action?: string
  date_prochaine_action?: string
  resultat_final?: string
  date_resultat?: string
  motif_refus?: string
  feedback_entreprise?: string
  cv_url?: string
  nom?: string
  prenom?: string
  email?: string
  telephone?: string
  demande_entreprise_id?: string | null
  poste_index?: number | null
  created_at: string
  updated_at?: string
}

export const useCandidatures = () => {
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newCandidatureCount, setNewCandidatureCount] = useState(0)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  const loadCandidatures = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh || candidatures.length === 0) {
        setLoading(true)
      }
      setError(null)

      const candidaturesData = await fetchAllPages<Candidature>((from, to) =>
        supabase
          .from('candidatures_stagiaires')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to)
      )

      setCandidatures(candidaturesData)
      try {
        localStorage.removeItem('candidatures_cache')
      } catch {
        /* ignore */
      }
    } catch (err: any) {
      console.error('Erreur chargement candidatures:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [candidatures.length])

  // Mettre à jour le statut d'une candidature (optimistic update)
  const updateStatutCandidature = async (candidatureId: string, newStatut: string, notes?: string) => {
    const updateData: any = {
      statut_candidature: newStatut,
      date_derniere_maj: new Date().toISOString().split('T')[0]
    }
    
    if (notes) {
      updateData.feedback_entreprise = notes
    }

    // Mise à jour optimiste : mettre à jour l'interface IMMÉDIATEMENT
    let previousCandidatures: Candidature[] = []
    setCandidatures(prev => {
      previousCandidatures = prev // Sauvegarder l'état précédent en cas d'erreur
      const updated = prev.map(c => 
        c.id === candidatureId 
          ? { ...c, ...updateData }
          : c
      )
      return updated
    })

    try {
      // Ensuite, mettre à jour dans la base de données (en arrière-plan)
      const { error } = await supabase
        .from('candidatures_stagiaires')
        .update(updateData)
        .eq('id', candidatureId)
      
      if (error) {
        // En cas d'erreur, restaurer l'état précédent
        setCandidatures(previousCandidatures)
        throw error
      }
      
      return { success: true }
    } catch (err: any) {
      console.error('Erreur mise à jour statut:', err)
      return { success: false, error: err.message }
    }
  }

  // Supprimer une candidature
  const deleteCandidature = async (candidatureId: string) => {
    try {
      const { error } = await supabase
        .from('candidatures_stagiaires')
        .delete()
        .eq('id', candidatureId)
      
      if (error) throw error
      
      // Mettre à jour localement sans recharger complètement
      const updatedCandidatures = candidatures.filter(c => c.id !== candidatureId)
      setCandidatures(updatedCandidatures)
      
      return { success: true }
    } catch (err: any) {
      console.error('Erreur suppression candidature:', err)
      return { success: false, error: err.message }
    }
  }

  // Charger les candidatures au montage du composant
  useEffect(() => {
    loadCandidatures()
  }, [loadCandidatures])

  // Polling automatique toutes les 5 minutes seulement si temps réel ne fonctionne pas (fallback)
  useEffect(() => {
    if (isRealtimeConnected) {
      console.log('✅ Temps réel actif, polling désactivé')
      return
    }

    const interval = setInterval(() => {
      console.log('🔄 Polling automatique (fallback) - rechargement des candidatures')
      loadCandidatures(true) // Force refresh
    }, 5 * 60 * 1000) // 5 minutes au lieu de 30 secondes

    return () => clearInterval(interval)
  }, [isRealtimeConnected, loadCandidatures])

  // Fonction pour recharger les candidatures
  const refreshCandidatures = useCallback(async () => {
    await loadCandidatures(true) // Force refresh
    setNewCandidatureCount(0) // Reset le compteur après actualisation
  }, [loadCandidatures])

  // Handler stable pour les changements en temps réel
  const handleRealtimeChange = useCallback(({ eventType, new: newRow, old: oldRow }) => {
    console.log(`🔄 Événement temps réel: ${eventType}`, { newRow, oldRow })
    
    setCandidatures((prev) => {
      let updated: Candidature[] = prev
      
      if (eventType === 'INSERT' && newRow) {
        console.log('➕ Nouvelle candidature ajoutée:', newRow)
        setNewCandidatureCount(prev => prev + 1)
        updated = [newRow, ...prev]
      } else if (eventType === 'UPDATE' && newRow) {
        console.log('✏️ Candidature mise à jour:', newRow)
        updated = prev.map((item) => (item.id === newRow.id ? newRow : item))
      } else if (eventType === 'DELETE' && oldRow) {
        console.log('🗑️ Candidature supprimée:', oldRow)
        updated = prev.filter((item) => item.id !== oldRow.id)
      }
      
      return updated
    })
  }, [])

  // Synchronisation en temps réel
  const { isConnected } = useRealTime('candidatures_stagiaires', handleRealtimeChange)
  
  // Mettre à jour le statut de connexion
  useEffect(() => {
    setIsRealtimeConnected(isConnected)
  }, [isConnected])

  return {
    candidatures,
    loading,
    error,
    loadCandidatures,
    updateStatutCandidature,
    deleteCandidature,
    refreshCandidatures,
    newCandidatureCount,
    clearNewCandidatureCount: () => setNewCandidatureCount(0),
    isRealtimeConnected
  }
} 