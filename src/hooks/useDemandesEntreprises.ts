// ========================================
// src/hooks/useDemandesEntreprises.ts - Hook pour gestion des demandes d'entreprises
// ========================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchAllPages } from '@/lib/supabaseFetchAll'
import { useRealTime } from './useRealTime'
import type { CvTriStatut } from '@/lib/cvTriStatut'
import {
  countPendingCvTriSync,
  listPendingCvTriSync,
  markCvTriSynced,
  mergeCvTriFromCache,
  setCvTriInCache,
} from '@/lib/cvTriLocalCache'

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
  const [cvTriPersistenceWarning, setCvTriPersistenceWarning] = useState<string | null>(null)

  const getStaffAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Session expirée — reconnectez-vous')
    }
    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }, [])

  const persistCvTriToServer = useCallback(
    async (candidatureId: string, cvTriStatut: CvTriStatut): Promise<Partial<Candidature>> => {
      try {
        const headers = await getStaffAuthHeaders()
        const res = await fetch('/api/candidatures/cv-tri', {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ candidatureId, cv_tri_statut: cvTriStatut }),
        })
        const data = await res.json()
        if (res.ok && data.candidature?.id) {
          return data.candidature as Partial<Candidature>
        }
        throw new Error(data.error || data.details || 'Échec sauvegarde tri CV')
      } catch (apiErr) {
        console.warn('API cv-tri indisponible, repli Supabase direct:', apiErr)
        const { data: row, error } = await supabase
          .from('candidatures_stagiaires')
          .update({ cv_tri_statut: cvTriStatut })
          .eq('id', candidatureId)
          .select('id, cv_tri_statut, cv_telecharge_le, cv_dernier_envoi_le, cv_nb_envois')
          .single()
        if (error) {
          throw new Error(
            error.message?.includes('cv_tri_statut') || error.code === '42703'
              ? `${error.message} — exécutez add_cv_telecharge_le_to_candidatures.sql sur Supabase.`
              : error.message
          )
        }
        return row as Partial<Candidature>
      }
    },
    [getStaffAuthHeaders]
  )

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

      // Enrichir les demandes avec les candidatures (+ cache local de repli)
      const demandesEnrichies = demandesData?.map(demande => {
        const candidatures = mergeCvTriFromCache(
          candidaturesByDemande[demande.id] || candidaturesByDemande[demande.entreprise_nom] || []
        )
        return {
          ...demande,
          candidatures_count: candidatures.length,
          candidatures,
        }
      }) || []

      setDemandes(demandesEnrichies)
      void syncPendingCvTriToServer()
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

  const syncPendingCvTriToServer = useCallback(async () => {
    const pending = listPendingCvTriSync()
    if (!pending.length) {
      setCvTriPersistenceWarning(null)
      return
    }

    for (const { id, entry } of pending) {
      try {
        const savedRow = await persistCvTriToServer(id, entry.cv_tri_statut)
        if (savedRow?.id) {
          markCvTriSynced(savedRow.id, entry.cv_tri_statut)
          patchCandidatureInDemandes(savedRow.id, savedRow)
        }
      } catch {
        /* retry au prochain chargement */
      }
    }

    const remaining = countPendingCvTriSync()
    if (remaining > 0) {
      setCvTriPersistenceWarning(
        `${remaining} tri(s) CV conservé(s) localement — exécutez add_cv_telecharge_le_to_candidatures.sql sur Supabase si le message persiste.`
      )
    } else {
      setCvTriPersistenceWarning(null)
    }
  }, [persistCvTriToServer, patchCandidatureInDemandes])

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
    void loadDemandes()
  }, [])

  useEffect(() => {
    const onFocus = () => {
      void loadDemandes({ silent: true })
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
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

  // Tri CV : accepté / refusé — persistance base (API admin + repli Supabase)
  const updateCvTriStatut = async (
    candidatureId: string,
    cvTriStatut: 'en_attente' | 'accepte' | 'refuse'
  ) => {
    const previousDemandes = patchCandidatureInDemandes(candidatureId, {
      cv_tri_statut: cvTriStatut,
    })

    try {
      const savedRow = await persistCvTriToServer(candidatureId, cvTriStatut)
      if (savedRow?.id) {
        markCvTriSynced(savedRow.id, cvTriStatut)
        patchCandidatureInDemandes(savedRow.id, savedRow)
        setCvTriPersistenceWarning(null)
      }
      return { success: true }
    } catch (err: unknown) {
      if (cvTriStatut === 'accepte' || cvTriStatut === 'refuse') {
        setCvTriInCache(candidatureId, cvTriStatut, { pendingSync: true })
        setCvTriPersistenceWarning(
          'Tri enregistré sur cet appareil ; synchronisation serveur en attente (migration Supabase ou clé service).'
        )
        return { success: true, offline: true }
      }
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
      let savedRows: Partial<Candidature>[] = []

      try {
        const headers = await getStaffAuthHeaders()
        const res = await fetch('/api/candidatures/cv-envoi', {
          method: 'POST',
          headers,
          body: JSON.stringify({ candidatureIds: uniqueIds }),
        })
        const data = await res.json()
        if (res.ok) {
          savedRows = (data.candidatures as Partial<Candidature>[]) ?? []
        } else {
          throw new Error(data.error || 'Échec enregistrement envoi CV')
        }
      } catch (apiErr) {
        console.warn('API cv-envoi indisponible, repli Supabase direct:', apiErr)
        const { data: currentRows, error: fetchErr } = await supabase
          .from('candidatures_stagiaires')
          .select('id, cv_nb_envois, cv_telecharge_le')
          .in('id', uniqueIds)
        if (fetchErr) throw fetchErr

        for (const row of currentRows ?? []) {
          const prevNb = row.cv_nb_envois ?? (row.cv_telecharge_le ? 1 : 0)
          const nextNb = prevNb + 1
          const { error: updErr } = await supabase
            .from('candidatures_stagiaires')
            .update({
              cv_nb_envois: nextNb,
              cv_dernier_envoi_le: now,
              cv_telecharge_le: row.cv_telecharge_le ?? now,
            })
            .eq('id', row.id)
          if (updErr) {
            throw new Error(
              updErr.message?.includes('cv_nb_envois')
                ? `${updErr.message} — exécutez add_cv_telecharge_le_to_candidatures.sql sur Supabase.`
                : updErr.message
            )
          }
        }

        const { data: refreshed, error: refreshErr } = await supabase
          .from('candidatures_stagiaires')
          .select('id, cv_tri_statut, cv_telecharge_le, cv_dernier_envoi_le, cv_nb_envois')
          .in('id', uniqueIds)
        if (refreshErr) throw refreshErr
        savedRows = (refreshed as Partial<Candidature>[]) ?? []
      }

      savedRows.forEach((row) => {
        if (row.id) patchCandidatureInDemandes(row.id, row)
      })

      return { success: true, marked: savedRows.length || uniqueIds.length }
    } catch (err: unknown) {
      setDemandes(previousDemandes)
      console.error('Erreur enregistrement envoi CV:', err)
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      return { success: false, error: message, marked: 0 }
    }
  }

  const handleCandidatureRealtimeChange = useCallback(
    ({ eventType, new: newRow }: { eventType: string; new: Candidature | null; old: Candidature | null }) => {
      if (eventType !== 'UPDATE' || !newRow?.id) return
      patchCandidatureInDemandes(newRow.id, {
        cv_tri_statut: newRow.cv_tri_statut,
        cv_telecharge_le: newRow.cv_telecharge_le,
        cv_dernier_envoi_le: newRow.cv_dernier_envoi_le,
        cv_nb_envois: newRow.cv_nb_envois,
        statut_candidature: newRow.statut_candidature,
      })
    },
    [patchCandidatureInDemandes]
  )

  // Synchronisation en temps réel
  const { isConnected } = useRealTime('demandes_entreprises', handleRealtimeChange)
  useRealTime('candidatures_stagiaires', handleCandidatureRealtimeChange)

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
    isRealtimeConnected: isConnected,
    cvTriPersistenceWarning,
  }
}
