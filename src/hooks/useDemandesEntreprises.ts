// ========================================
// src/hooks/useDemandesEntreprises.ts - Hook pour gestion des demandes d'entreprises
// ========================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchAllPages } from '@/lib/supabaseFetchAll'
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
  demande_entreprise_id?: string
  poste_index?: number
  cv_tri_statut?: string
  cv_telecharge_le?: string | null
  cv_dernier_envoi_le?: string | null
  cv_nb_envois?: number
}

export const useDemandesEntreprises = () => {
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger toutes les demandes d'entreprises avec leurs candidatures
  const loadDemandes = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    try {
      if (!silent) {
        setLoading(true)
      }
      setError(null)
      
      // Charger les demandes d'entreprises
      const { data: demandesData, error: demandesError } = await supabase
        .from('demandes_entreprises')
        .select('*')
        .in('type_demande', ['cv', 'evenement'])
        .order('created_at', { ascending: false })
      
      if (demandesError) throw demandesError

      // Charger les candidatures (pagination pour dépasser la limite Supabase de 1000)
      const candidaturesData = await fetchAllPages<Candidature>((from, to) =>
        supabase
          .from('candidatures_stagiaires')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to)
      )

      // Grouper les candidatures par demande_entreprise_id (nouveau) ou par entreprise_nom (fallback)
      const candidaturesByDemande = candidaturesData?.reduce((acc, candidature) => {
        // Priorité à demande_entreprise_id si disponible
        const key = candidature.demande_entreprise_id || candidature.entreprise_nom
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(candidature)
        return acc
      }, {} as Record<string, Candidature[]>) || {}

      // Enrichir les demandes avec les candidatures
      const demandesEnrichies = demandesData?.map(demande => {
        // Chercher les candidatures par demande_entreprise_id d'abord, puis par entreprise_nom
        const candidatures = candidaturesByDemande[demande.id] || candidaturesByDemande[demande.entreprise_nom] || []
        return {
          ...demande,
          candidatures_count: candidatures.length,
          candidatures: candidatures
        }
      }) || []

      setDemandes(demandesEnrichies)
    } catch (err: any) {
      console.error('Erreur chargement demandes:', err)
      setError(err.message)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const patchCandidatureInDemandes = useCallback(
    (
      candidatureId: string,
      patch: Partial<Candidature> | null
    ): DemandeEntreprise[] => {
      let previous: DemandeEntreprise[] = []
      setDemandes((prev) => {
        previous = prev
        return prev.map((demande) => {
          if (!demande.candidatures?.some((c) => c.id === candidatureId)) {
            return demande
          }
          const candidatures = patch
            ? demande.candidatures.map((c) =>
                c.id === candidatureId ? { ...c, ...patch } : c
              )
            : demande.candidatures.filter((c) => c.id !== candidatureId)
          return {
            ...demande,
            candidatures,
            candidatures_count: candidatures.length,
          }
        })
      })
      return previous
    },
    []
  )

  // Charger les candidatures d'une demande spécifique
  const loadCandidaturesByDemande = async (demandeId: string) => {
    try {
      // D'abord, récupérer le nom de l'entreprise pour le fallback
      const { data: demande } = await supabase
        .from('demandes_entreprises')
        .select('entreprise_nom')
        .eq('id', demandeId)
        .single()

      // Charger les candidatures par demande_entreprise_id (priorité)
      const { data: candidaturesByDemandeId, error: error1 } = await supabase
        .from('candidatures_stagiaires')
        .select('*')
        .eq('demande_entreprise_id', demandeId)
        .order('created_at', { ascending: false })

      // Si pas de résultats et qu'on a le nom de l'entreprise, chercher par nom (fallback)
      if ((!candidaturesByDemandeId || candidaturesByDemandeId.length === 0) && demande?.entreprise_nom) {
        const { data: candidaturesByNom, error: error2 } = await supabase
          .from('candidatures_stagiaires')
          .select('*')
          .eq('entreprise_nom', demande.entreprise_nom)
          .order('created_at', { ascending: false })
        
        if (error2) throw error2
        return candidaturesByNom || []
      }

      if (error1) throw error1
      return candidaturesByDemandeId || []
    } catch (err: any) {
      console.error('Erreur chargement candidatures par demande:', err)
      return []
    }
  }

  // Mettre à jour le statut d'une candidature
  const updateStatutCandidature = async (candidatureId: string, newStatut: string, notes?: string) => {
    const updateData: Partial<Candidature> = {
      statut_candidature: newStatut,
      date_derniere_maj: new Date().toISOString().split('T')[0],
    }
    if (notes) {
      updateData.feedback_entreprise = notes
    }

    const previousDemandes = patchCandidatureInDemandes(candidatureId, updateData)

    try {
      const { error } = await supabase
        .from('candidatures_stagiaires')
        .update(updateData)
        .eq('id', candidatureId)

      if (error) throw error
      return { success: true }
    } catch (err: unknown) {
      setDemandes(previousDemandes)
      console.error('Erreur mise à jour statut:', err)
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      return { success: false, error: message }
    }
  }

  // Supprimer une candidature
  const deleteCandidature = async (candidatureId: string) => {
    const previousDemandes = patchCandidatureInDemandes(candidatureId, null)

    try {
      const { error } = await supabase
        .from('candidatures_stagiaires')
        .delete()
        .eq('id', candidatureId)

      if (error) throw error
      return { success: true }
    } catch (err: unknown) {
      setDemandes(previousDemandes)
      console.error('Erreur suppression candidature:', err)
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      return { success: false, error: message }
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

  // Tri CV : accepté / refusé (mise à jour instantanée, sans rechargement complet)
  const updateCvTriStatut = async (
    candidatureId: string,
    cvTriStatut: 'en_attente' | 'accepte' | 'refuse'
  ) => {
    const previousDemandes = patchCandidatureInDemandes(candidatureId, {
      cv_tri_statut: cvTriStatut,
      date_derniere_maj: new Date().toISOString().split('T')[0],
    })

    try {
      const { error } = await supabase
        .from('candidatures_stagiaires')
        .update({
          cv_tri_statut: cvTriStatut,
          date_derniere_maj: new Date().toISOString().split('T')[0],
        })
        .eq('id', candidatureId)

      if (error) throw error
      return { success: true }
    } catch (err: unknown) {
      setDemandes(previousDemandes)
      console.error('Erreur tri CV:', err)
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      return { success: false, error: message }
    }
  }

  // Enregistrer un envoi / téléchargement ZIP (1er, 2e, 3e…)
  const markCvsTelecharges = async (candidatureIds: string[]) => {
    const uniqueIds = [...new Set(candidatureIds.filter(Boolean))]
    if (uniqueIds.length === 0) return { success: true, marked: 0 }

    const now = new Date().toISOString()
    let previousDemandes: DemandeEntreprise[] = []

    setDemandes((prev) => {
      previousDemandes = prev
      return prev.map((demande) => {
        if (!demande.candidatures?.some((c) => uniqueIds.includes(c.id))) {
          return demande
        }
        return {
          ...demande,
          candidatures: demande.candidatures.map((c) => {
            if (!uniqueIds.includes(c.id)) return c
            const prevNb = c.cv_nb_envois ?? (c.cv_telecharge_le ? 1 : 0)
            const nextNb = prevNb + 1
            return {
              ...c,
              cv_nb_envois: nextNb,
              cv_telecharge_le: c.cv_telecharge_le ?? now,
              cv_dernier_envoi_le: now,
            }
          }),
        }
      })
    })

    try {
      const { data: currentRows, error: fetchError } = await supabase
        .from('candidatures_stagiaires')
        .select('id, cv_nb_envois, cv_telecharge_le')
        .in('id', uniqueIds)

      if (fetchError) throw fetchError

      const results = await Promise.all(
        (currentRows ?? []).map((row) => {
          const prevNb = row.cv_nb_envois ?? (row.cv_telecharge_le ? 1 : 0)
          const nextNb = prevNb + 1
          return supabase
            .from('candidatures_stagiaires')
            .update({
              cv_nb_envois: nextNb,
              cv_dernier_envoi_le: now,
              cv_telecharge_le: row.cv_telecharge_le ?? now,
            })
            .eq('id', row.id)
            .select('id')
        })
      )

      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error

      return { success: true, marked: currentRows?.length ?? 0 }
    } catch (err: unknown) {
      setDemandes(previousDemandes)
      console.error('Erreur enregistrement envoi CV:', err)
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      return { success: false, error: message, marked: 0 }
    }
  }

  // Synchronisation en temps réel
  const { isConnected } = useRealTime('demandes_entreprises', handleRealtimeChange)

  return {
    demandes,
    loading,
    error,
    loadDemandes,
    loadCandidaturesByDemande,
    updateStatutCandidature,
    updateCvTriStatut,
    markCvsTelecharges,
    deleteCandidature,
    refreshDemandes,
    isRealtimeConnected: isConnected
  }
}
