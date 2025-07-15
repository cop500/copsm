// ========================================
// src/hooks/useCVEnvoyes.ts - Hook pour gestion des CV envoyés
// ========================================

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const useCVEnvoyes = () => {
  const [cvEnvoyes, setCvEnvoyes] = useState<any[]>([])
  const [cvDetail, setCvDetail] = useState<any>(null)
  const [suiviEvents, setSuiviEvents] = useState<any[]>([])
  const [relances, setRelances] = useState<any[]>([])
  const [demandes, setDemandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger tous les CV envoyés
  const loadCVEnvoyes = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('v_cv_envoyes_complete')
        .select('*')
        .order('date_envoi', { ascending: false })
      
      if (error) throw error
      setCvEnvoyes(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Erreur lors du chargement des CV:', err)
    } finally {
      setLoading(false)
    }
  }

  // Charger les demandes disponibles pour l'envoi
  const loadDemandes = async () => {
    try {
      const { data, error } = await supabase
        .from('demandes_cv')
        .select('*')
        .in('statut', ['nouvelle', 'en_traitement'])
        .order('date_demande', { ascending: false })
      
      if (error) throw error
      setDemandes(data || [])
    } catch (err: any) {
      console.error('Erreur lors du chargement des demandes:', err)
    }
  }

  // Charger un CV spécifique avec son suivi
  const loadCVDetail = async (cvId: string) => {
    try {
      // Charger le CV
      const { data: cvData, error: cvError } = await supabase
        .from('v_cv_envoyes_complete')
        .select('*')
        .eq('id', cvId)
        .single()
      
      if (cvError) throw cvError
      setCvDetail(cvData)

      // Charger les événements de suivi
      const { data: suiviData, error: suiviError } = await supabase
        .from('suivi_candidatures')
        .select('*')
        .eq('cv_envoye_id', cvId)
        .order('date_evenement', { ascending: false })
      
      if (suiviError) throw suiviError
      setSuiviEvents(suiviData || [])

      // Charger les relances
      const { data: relancesData, error: relancesError } = await supabase
        .from('relances_cv')
        .select('*')
        .eq('cv_envoye_id', cvId)
        .order('date_relance_prevue', { ascending: false })
      
      if (relancesError) throw relancesError
      setRelances(relancesData || [])

    } catch (err: any) {
      setError(err.message)
      console.error('Erreur lors du chargement du détail:', err)
    }
  }

  // Envoyer un nouveau CV
  const envoyerCV = async (cvData: any) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      
      const dataToSave = {
        demande_id: cvData.demande_id,
        nom_stagiaire: cvData.nom_stagiaire,
        prenom_stagiaire: cvData.prenom_stagiaire,
        email_stagiaire: cvData.email_stagiaire,
        telephone_stagiaire: cvData.telephone_stagiaire,
        filiere_id: cvData.filiere_id,
        pole_id: cvData.pole_id,
        niveau_formation: cvData.niveau_formation,
        entreprise_nom: cvData.entreprise_nom,
        entreprise_contact: cvData.entreprise_contact,
        entreprise_email: cvData.entreprise_email,
        poste_vise: cvData.poste_vise,
        date_envoi: cvData.date_envoi || new Date().toISOString().split('T')[0],
        methode_envoi: cvData.methode_envoi || 'email',
        envoye_par: cvData.envoye_par || 'Équipe COP',
        envoye_par_id: user?.user?.id,
        cv_version: cvData.cv_version,
        lettre_motivation: cvData.lettre_motivation || false,
        notes_envoi: cvData.notes_envoi,
        date_reponse_attendue: cvData.date_reponse_attendue,
        created_by: user?.user?.id
      }

      const { data, error } = await supabase
        .from('cv_envoyes')
        .insert([dataToSave])
        .select()
      
      if (error) throw error
      
      await loadCVEnvoyes()
      return { success: true, data }
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi du CV:', err)
      return { success: false, error: err.message }
    }
  }

  // Changer le statut d'un CV
  const changerStatutCV = async (cvId: string, nouveauStatut: string, commentaire?: string) => {
    try {
      const { error } = await supabase.rpc('changer_statut_cv', {
        cv_uuid: cvId,
        nouveau_statut: nouveauStatut,
        commentaire: commentaire,
        effectue_par_nom: 'Utilisateur COP'
      })
      
      if (error) throw error
      
      await loadCVEnvoyes()
      if (cvDetail?.id === cvId) {
        await loadCVDetail(cvId)
      }
      
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  // Ajouter un événement de suivi
  const ajouterEvenementSuivi = async (cvId: string, evenementData: any) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      
      const dataToSave = {
        cv_envoye_id: cvId,
        type_evenement: evenementData.type_evenement,
        titre_evenement: evenementData.titre_evenement,
        description: evenementData.description,
        date_evenement: evenementData.date_evenement || new Date().toISOString().split('T')[0],
        heure_evenement: evenementData.heure_evenement,
        contact_entreprise: evenementData.contact_entreprise,
        lieu: evenementData.lieu,
        methode_contact: evenementData.methode_contact,
        action_requise: evenementData.action_requise,
        date_action_prevue: evenementData.date_action_prevue,
        responsable_action: evenementData.responsable_action,
        resultat_positif: evenementData.resultat_positif,
        satisfaction_note: evenementData.satisfaction_note,
        enregistre_par: 'Utilisateur COP',
        enregistre_par_id: user?.user?.id
      }

      const { error } = await supabase
        .from('suivi_candidatures')
        .insert([dataToSave])
      
      if (error) throw error
      
      if (cvDetail?.id === cvId) {
        await loadCVDetail(cvId)
      }
      
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  // Planifier une relance
  const planifierRelance = async (cvId: string, relanceData: any) => {
    try {
      const { error } = await supabase.rpc('planifier_relance', {
        cv_uuid: cvId,
        date_relance: relanceData.date_relance,
        type_relance: relanceData.type_relance || 'email',
        objet: relanceData.objet_relance,
        message: relanceData.message_relance
      })
      
      if (error) throw error
      
      if (cvDetail?.id === cvId) {
        await loadCVDetail(cvId)
      }
      
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  // Supprimer un CV envoyé
  const supprimerCV = async (cvId: string) => {
    try {
      const { error } = await supabase
        .from('cv_envoyes')
        .delete()
        .eq('id', cvId)
      
      if (error) throw error
      
      await loadCVEnvoyes()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  // Charger au démarrage
  useEffect(() => {
    loadCVEnvoyes()
    loadDemandes()
  }, [])

  // Configurer les abonnements temps réel
  useEffect(() => {
    const subscription = supabase
      .channel('cv-envoyes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cv_envoyes' }, () => {
        loadCVEnvoyes()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suivi_candidatures' }, () => {
        if (cvDetail) {
          loadCVDetail(cvDetail.id)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relances_cv' }, () => {
        if (cvDetail) {
          loadCVDetail(cvDetail.id)
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [cvDetail?.id])

  return {
    // États
    cvEnvoyes,
    cvDetail,
    suiviEvents,
    relances,
    demandes,
    loading,
    error,
    // Actions
    loadCVEnvoyes,
    loadDemandes,
    loadCVDetail,
    envoyerCV,
    changerStatutCV,
    ajouterEvenementSuivi,
    planifierRelance,
    supprimerCV,
    setCvDetail
  }
}