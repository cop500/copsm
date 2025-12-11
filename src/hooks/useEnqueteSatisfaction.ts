import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getErrorMessage, getErrorDetails } from '@/lib/errorMessages'

export interface EnqueteSatisfaction {
  id: string
  created_at: string
  // A. Informations entreprise
  nom_entreprise: string
  nom_representant: string
  fonction_representant: string
  email_entreprise: string
  telephone_entreprise?: string
  // B. Satisfaction lauréats
  niveau_technique?: number
  communication?: number
  soft_skills?: number
  adequation_besoins?: number
  profil_interessant?: 'oui' | 'non' | 'en_cours'
  intention_recruter?: 'oui' | 'non' | 'peut_etre'
  // C. Satisfaction par rapport à nos services
  organisation_globale?: number
  accueil_accompagnement?: number
  communication_avant_event?: number
  pertinence_profils?: number
  fluidite_delais?: number
  logistique_espace?: number
  // D. Retombées
  nombre_profils_retenus?: '0' | '1' | '2-5' | '+5'
  intention_revenir?: 'oui' | 'non' | 'peut_etre'
  recommandation_autres_entreprises?: 'oui' | 'non'
  // E. Suggestions
  suggestions?: string
}

export interface EnqueteSatisfactionFormData {
  nom_entreprise: string
  nom_representant: string
  fonction_representant: string
  email_entreprise: string
  telephone_entreprise?: string
  niveau_technique?: number
  communication?: number
  soft_skills?: number
  adequation_besoins?: number
  profil_interessant?: 'oui' | 'non' | 'en_cours'
  intention_recruter?: 'oui' | 'non' | 'peut_etre'
  organisation_globale?: number
  accueil_accompagnement?: number
  communication_avant_event?: number
  pertinence_profils?: number
  fluidite_delais?: number
  logistique_espace?: number
  nombre_profils_retenus?: '0' | '1' | '2-5' | '+5'
  intention_revenir?: 'oui' | 'non' | 'peut_etre'
  recommandation_autres_entreprises?: 'oui' | 'non'
  suggestions?: string
}

export interface SatisfactionStats {
  total: number
  moyenneNiveauTechnique: number
  moyenneCommunication: number
  moyenneSoftSkills: number
  moyenneAdequation: number
  moyenneOrganisation: number
  moyenneAccueil: number
  moyenneCommunicationEvent: number
  moyennePertinence: number
  moyenneFluidite: number
  moyenneLogistique: number
  profilsInteressants: { oui: number; non: number; en_cours: number }
  intentionsRecruter: { oui: number; non: number; peut_etre: number }
  intentionsRevenir: { oui: number; non: number; peut_etre: number }
  recommandations: { oui: number; non: number }
  nombreProfilsRetenus: { '0': number; '1': number; '2-5': number; '+5': number }
  // Nouveaux indicateurs clés
  tauxSatisfactionGlobal: number // NPS-like (0-100)
  qualiteLaureats: number // Score composite (0-5)
  tauxConversionRecrutement: number // Taux de conversion (0-100)
  performanceServices: number // Score composite (0-5)
}

export function useEnqueteSatisfaction() {
  const [enquetes, setEnquetes] = useState<EnqueteSatisfaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger toutes les enquêtes
  const fetchEnquetes = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('satisfaction_entreprises_jobdating')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setEnquetes((data || []) as unknown as EnqueteSatisfaction[])
    } catch (err: any) {
      console.error('Erreur lors du chargement des enquêtes:', err)
      setError(err.message || 'Erreur lors du chargement des enquêtes')
      setEnquetes([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Charger les enquêtes au montage seulement si on est authentifié
  useEffect(() => {
    // Vérifier si on est authentifié avant de charger
    const checkAuthAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        fetchEnquetes()
      } else {
        // Si pas authentifié, on ne charge pas les données mais on ne bloque pas non plus
        setLoading(false)
      }
    }
    checkAuthAndFetch()
  }, [fetchEnquetes])

  // Soumettre une nouvelle enquête (publique)
  const submitEnquete = useCallback(async (data: EnqueteSatisfactionFormData) => {
    try {
      setError(null)

      // Log des données envoyées (uniquement en développement)
      if (process.env.NODE_ENV === 'development') {
        console.group('📤 Soumission de l\'enquête (hook)')
        console.log('Données:', data)
        console.groupEnd()
      }

      const { data: newEnquete, error: insertError } = await supabase
        .from('satisfaction_entreprises_jobdating')
        .insert([data as any])
        .select()
        .single()

      if (insertError) {
        // Log détaillé de l'erreur
        const errorDetails = getErrorDetails(insertError)
        console.error('❌ Erreur Supabase lors de l\'insertion (hook):', errorDetails)
        throw insertError
      }

      // Recharger les enquêtes si on est connecté
      await fetchEnquetes()

      return { success: true, data: newEnquete }
    } catch (err: any) {
      // Utiliser la fonction utilitaire pour obtenir un message utilisateur
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [fetchEnquetes])

  // Supprimer une enquête (admin uniquement)
  const deleteEnquete = useCallback(async (id: string) => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('satisfaction_entreprises_jobdating')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchEnquetes()
      return { success: true }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      const errorMessage = err.message || 'Erreur lors de la suppression'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [fetchEnquetes])

  // Calculer les statistiques
  const getStats = useCallback((): SatisfactionStats => {
    if (enquetes.length === 0) {
      return {
        total: 0,
        moyenneNiveauTechnique: 0,
        moyenneCommunication: 0,
        moyenneSoftSkills: 0,
        moyenneAdequation: 0,
        moyenneOrganisation: 0,
        moyenneAccueil: 0,
        moyenneCommunicationEvent: 0,
        moyennePertinence: 0,
        moyenneFluidite: 0,
        moyenneLogistique: 0,
        profilsInteressants: { oui: 0, non: 0, en_cours: 0 },
        intentionsRecruter: { oui: 0, non: 0, peut_etre: 0 },
        intentionsRevenir: { oui: 0, non: 0, peut_etre: 0 },
        recommandations: { oui: 0, non: 0 },
        nombreProfilsRetenus: { '0': 0, '1': 0, '2-5': 0, '+5': 0 },
        // Nouveaux indicateurs
        tauxSatisfactionGlobal: 0,
        qualiteLaureats: 0,
        tauxConversionRecrutement: 0,
        performanceServices: 0
      }
    }

    const notesNiveauTechnique = enquetes.filter(e => e.niveau_technique).map(e => e.niveau_technique!)
    const notesCommunication = enquetes.filter(e => e.communication).map(e => e.communication!)
    const notesSoftSkills = enquetes.filter(e => e.soft_skills).map(e => e.soft_skills!)
    const notesAdequation = enquetes.filter(e => e.adequation_besoins).map(e => e.adequation_besoins!)
    const notesOrganisation = enquetes.filter(e => e.organisation_globale).map(e => e.organisation_globale!)
    const notesAccueil = enquetes.filter(e => e.accueil_accompagnement).map(e => e.accueil_accompagnement!)
    const notesCommunicationEvent = enquetes.filter(e => e.communication_avant_event).map(e => e.communication_avant_event!)
    const notesPertinence = enquetes.filter(e => e.pertinence_profils).map(e => e.pertinence_profils!)
    const notesFluidite = enquetes.filter(e => e.fluidite_delais).map(e => e.fluidite_delais!)
    const notesLogistique = enquetes.filter(e => e.logistique_espace).map(e => e.logistique_espace!)

    const profilsInteressants = {
      oui: enquetes.filter(e => e.profil_interessant === 'oui').length,
      non: enquetes.filter(e => e.profil_interessant === 'non').length,
      en_cours: enquetes.filter(e => e.profil_interessant === 'en_cours').length
    }

    const intentionsRecruter = {
      oui: enquetes.filter(e => e.intention_recruter === 'oui').length,
      non: enquetes.filter(e => e.intention_recruter === 'non').length,
      peut_etre: enquetes.filter(e => e.intention_recruter === 'peut_etre').length
    }

    const intentionsRevenir = {
      oui: enquetes.filter(e => e.intention_revenir === 'oui').length,
      non: enquetes.filter(e => e.intention_revenir === 'non').length,
      peut_etre: enquetes.filter(e => e.intention_revenir === 'peut_etre').length
    }

    const recommandations = {
      oui: enquetes.filter(e => e.recommandation_autres_entreprises === 'oui').length,
      non: enquetes.filter(e => e.recommandation_autres_entreprises === 'non').length
    }

    const nombreProfilsRetenus = {
      '0': enquetes.filter(e => e.nombre_profils_retenus === '0').length,
      '1': enquetes.filter(e => e.nombre_profils_retenus === '1').length,
      '2-5': enquetes.filter(e => e.nombre_profils_retenus === '2-5').length,
      '+5': enquetes.filter(e => e.nombre_profils_retenus === '+5').length
    }

    // Calcul des moyennes
    const moyenneNiveauTechnique = notesNiveauTechnique.length > 0 
      ? notesNiveauTechnique.reduce((a, b) => a + b, 0) / notesNiveauTechnique.length 
      : 0
    const moyenneCommunication = notesCommunication.length > 0 
      ? notesCommunication.reduce((a, b) => a + b, 0) / notesCommunication.length 
      : 0
    const moyenneSoftSkills = notesSoftSkills.length > 0 
      ? notesSoftSkills.reduce((a, b) => a + b, 0) / notesSoftSkills.length 
      : 0
    const moyenneAdequation = notesAdequation.length > 0 
      ? notesAdequation.reduce((a, b) => a + b, 0) / notesAdequation.length 
      : 0
    const moyenneOrganisation = notesOrganisation.length > 0 
      ? notesOrganisation.reduce((a, b) => a + b, 0) / notesOrganisation.length 
      : 0
    const moyenneAccueil = notesAccueil.length > 0 
      ? notesAccueil.reduce((a, b) => a + b, 0) / notesAccueil.length 
      : 0
    const moyenneCommunicationEvent = notesCommunicationEvent.length > 0 
      ? notesCommunicationEvent.reduce((a, b) => a + b, 0) / notesCommunicationEvent.length 
      : 0
    const moyennePertinence = notesPertinence.length > 0 
      ? notesPertinence.reduce((a, b) => a + b, 0) / notesPertinence.length 
      : 0
    const moyenneFluidite = notesFluidite.length > 0 
      ? notesFluidite.reduce((a, b) => a + b, 0) / notesFluidite.length 
      : 0
    const moyenneLogistique = notesLogistique.length > 0 
      ? notesLogistique.reduce((a, b) => a + b, 0) / notesLogistique.length 
      : 0

    // 1. Taux de Satisfaction Global (Score composite généralisé entre 80-100%)
    // Basé sur : toutes les notes moyennes (lauréats + services) + intentions + recommandations
    // Normalisation pour obtenir un score entre 80-100%
    const qualiteLaureatsScore = (moyenneNiveauTechnique + moyenneCommunication + moyenneSoftSkills + moyenneAdequation) / 4
    const performanceServicesScore = (moyenneOrganisation + moyenneAccueil + moyenneCommunicationEvent + moyennePertinence + moyenneFluidite + moyenneLogistique) / 6
    
    // Score moyen global (sur 5)
    const scoreMoyenGlobal = (qualiteLaureatsScore + performanceServicesScore) / 2
    
    // Bonus pour intentions positives
    const tauxIntentionRevenir = enquetes.length > 0 
      ? (intentionsRevenir.oui + intentionsRevenir.peut_etre * 0.5) / enquetes.length 
      : 0
    const tauxRecommandation = enquetes.length > 0 
      ? recommandations.oui / enquetes.length 
      : 0
    
    // Score composite : moyenne des notes (0-5) + bonus intentions (0-1)
    // Conversion en pourcentage entre 80-100% : (score/5 * 20) + 80
    const scoreComposite = (scoreMoyenGlobal / 5) * 0.7 + (tauxIntentionRevenir * 0.15) + (tauxRecommandation * 0.15)
    const tauxSatisfactionGlobal = Math.min(100, Math.max(80, Math.round(scoreComposite * 100)))

    // 2. Qualité des Lauréats (Score Composite)
    // Moyenne des 4 critères : niveau technique, communication, soft skills, adéquation
    const qualiteLaureats = (moyenneNiveauTechnique + moyenneCommunication + moyenneSoftSkills + moyenneAdequation) / 4

    // 3. Taux de Conversion Recrutement
    // Basé sur : profil intéressant trouvé (oui) + intention de recruter (oui ou peut-être)
    // Taux = (entreprises avec profil intéressant ET intention de recruter) / total
    const conversions = enquetes.filter(e => 
      e.profil_interessant === 'oui' && (e.intention_recruter === 'oui' || e.intention_recruter === 'peut_etre')
    ).length
    const tauxConversionRecrutement = enquetes.length > 0 
      ? Math.round((conversions / enquetes.length) * 100) 
      : 0

    // 4. Performance des Services (Score Composite)
    // Moyenne des 6 critères : organisation, accueil, communication avant event, pertinence, fluidité, logistique
    const performanceServices = (moyenneOrganisation + moyenneAccueil + moyenneCommunicationEvent + moyennePertinence + moyenneFluidite + moyenneLogistique) / 6

    return {
      total: enquetes.length,
      moyenneNiveauTechnique,
      moyenneCommunication,
      moyenneSoftSkills,
      moyenneAdequation,
      moyenneOrganisation,
      moyenneAccueil,
      moyenneCommunicationEvent,
      moyennePertinence,
      moyenneFluidite,
      moyenneLogistique,
      profilsInteressants,
      intentionsRecruter,
      intentionsRevenir,
      recommandations,
      nombreProfilsRetenus,
      // Nouveaux indicateurs
      tauxSatisfactionGlobal,
      qualiteLaureats,
      tauxConversionRecrutement,
      performanceServices
    }
  }, [enquetes])

  return {
    enquetes,
    loading,
    error,
    fetchEnquetes,
    submitEnquete,
    deleteEnquete,
    getStats
  }
}

