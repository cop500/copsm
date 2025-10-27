// ========================================
// src/hooks/useDemandesEntreprises.ts - Hook pour gestion des demandes d'entreprises
// ========================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealTime } from './useRealTime'

interface DemandeEntreprise {
  id: string
  entreprise_nom: string
  secteur: string
  entreprise_ville: string
  contact_nom: string
  contact_email: string
  contact_tel: string
  profils: any[]
  evenement_type?: string
  evenement_date?: string
  fichier_url?: string
  type_demande: string
  statut: string
  created_at: string
  updated_at?: string
  candidatures_count?: number
  candidatures?: Candidature[]
}

interface Candidature {
  id: string
  demande_cv_id?: string
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

export const useDemandesEntreprises = () => {
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger toutes les demandes d'entreprises avec leurs candidatures
  const loadDemandes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Charger les demandes d'entreprises
      const { data: demandesData, error: demandesError } = await supabase
        .from('demandes_entreprises')
        .select('*')
        .in('type_demande', ['cv', 'evenement'])
        .order('created_at', { ascending: false })
      
      if (demandesError) throw demandesError

      // Charger les candidatures
      const { data: candidaturesData, error: candidaturesError } = await supabase
        .from('candidatures_stagiaires')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (candidaturesError) throw candidaturesError

      // Grouper les candidatures par entreprise
      const candidaturesByEntreprise = candidaturesData?.reduce((acc, candidature) => {
        const entrepriseNom = candidature.entreprise_nom
        if (!acc[entrepriseNom]) {
          acc[entrepriseNom] = []
        }
        acc[entrepriseNom].push(candidature)
        return acc
      }, {} as Record<string, Candidature[]>) || {}

      // Enrichir les demandes avec les candidatures
      const demandesEnrichies = demandesData?.map(demande => ({
        ...demande,
        candidatures_count: candidaturesByEntreprise[demande.entreprise_nom]?.length || 0,
        candidatures: candidaturesByEntreprise[demande.entreprise_nom] || []
      })) || []

      setDemandes(demandesEnrichies)
    } catch (err: any) {
      console.error('Erreur chargement demandes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Charger les candidatures d'une demande spécifique
  const loadCandidaturesByDemande = async (demandeId: string) => {
    try {
      const { data: demande } = await supabase
        .from('demandes_entreprises')
        .select('entreprise_nom')
        .eq('id', demandeId)
        .single()

      if (!demande) return []

      const { data: candidatures, error } = await supabase
        .from('candidatures_stagiaires')
        .select('*')
        .eq('entreprise_nom', demande.entreprise_nom)
        .order('created_at', { ascending: false })

      if (error) throw error
      return candidatures || []
    } catch (err: any) {
      console.error('Erreur chargement candidatures par demande:', err)
      return []
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
      
      // Recharger les demandes
      await loadDemandes()
      
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
      
      // Recharger les demandes
      await loadDemandes()
      
      return { success: true }
    } catch (err: any) {
      console.error('Erreur suppression candidature:', err)
      return { success: false, error: err.message }
    }
  }

  // Charger au montage du composant
  useEffect(() => {
    loadDemandes()
  }, [])

  // Fonction pour recharger les demandes
  const refreshDemandes = useCallback(async () => {
    await loadDemandes()
  }, [])

  // Handler stable pour les changements en temps réel
  const handleRealtimeChange = useCallback(({ eventType, new: newRow, old: oldRow }) => {
    console.log(`🔄 Événement temps réel: ${eventType}`, { newRow, oldRow })
    
    setDemandes((prev) => {
      if (eventType === 'INSERT' && newRow) {
        console.log('➕ Nouvelle demande ajoutée:', newRow)
        return [newRow, ...prev]
      }
      if (eventType === 'UPDATE' && newRow) {
        console.log('✏️ Demande mise à jour:', newRow)
        return prev.map((item) => (item.id === newRow.id ? newRow : item))
      }
      if (eventType === 'DELETE' && oldRow) {
        console.log('🗑️ Demande supprimée:', oldRow)
        return prev.filter((item) => item.id !== oldRow.id)
      }
      return prev
    })
  }, [])

  // Synchronisation en temps réel
  const { isConnected } = useRealTime('demandes_entreprises', handleRealtimeChange)

  return {
    demandes,
    loading,
    error,
    loadDemandes,
    loadCandidaturesByDemande,
    updateStatutCandidature,
    deleteCandidature,
    refreshDemandes,
    isRealtimeConnected: isConnected
  }
}
