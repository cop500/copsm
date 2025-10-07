// ========================================
// src/hooks/useCandidatures.ts - Hook pour gestion des candidatures
// ========================================

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
  created_at: string
  updated_at?: string
}

export const useCandidatures = () => {
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newCandidatureCount, setNewCandidatureCount] = useState(0)

  // Charger toutes les candidatures
  const loadCandidatures = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('candidatures_stagiaires')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setCandidatures(data || [])
    } catch (err: any) {
      console.error('Erreur chargement candidatures:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Mettre à jour le statut d'une candidature
  const updateStatutCandidature = async (candidatureId: string, newStatut: string, notes?: string) => {
    try {
      const updateData: any = {
        statut_candidature: newStatut,
        date_derniere_maj: new Date().toISOString().split('T')[0]
      }
      
      if (notes) {
        updateData.feedback_entreprise = notes
      }
      
      const { error } = await supabase
        .from('candidatures_stagiaires')
        .update(updateData)
        .eq('id', candidatureId)
      
      if (error) throw error
      
      // Recharger les candidatures
      await loadCandidatures()
      
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
      
      // Recharger les candidatures
      await loadCandidatures()
      
      return { success: true }
    } catch (err: any) {
      console.error('Erreur suppression candidature:', err)
      return { success: false, error: err.message }
    }
  }

  // Charger les candidatures au montage du composant
  useEffect(() => {
    loadCandidatures()
  }, [])

  // Synchronisation en temps réel
  useRealTime('candidatures_stagiaires', ({ eventType, new: newRow, old: oldRow }) => {
    setCandidatures((prev) => {
      if (eventType === 'INSERT' && newRow) {
        // Ajouter la nouvelle candidature au début de la liste
        setNewCandidatureCount(prev => prev + 1)
        return [newRow, ...prev]
      }
      if (eventType === 'UPDATE' && newRow) {
        // Mettre à jour la candidature existante
        return prev.map((item) => (item.id === newRow.id ? newRow : item))
      }
      if (eventType === 'DELETE' && oldRow) {
        // Supprimer la candidature
        return prev.filter((item) => item.id !== oldRow.id)
      }
      return prev
    })
  })

  return {
    candidatures,
    loading,
    error,
    loadCandidatures,
    updateStatutCandidature,
    deleteCandidature,
    newCandidatureCount,
    clearNewCandidatureCount: () => setNewCandidatureCount(0)
  }
} 