'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'

export interface Atelier {
  id: string
  titre: string
  description?: string
  date_debut: string
  date_fin: string
  capacite_max: number
  capacite_actuelle: number
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  lieu?: string
  animateur_id?: string
  animateur_nom?: string
  pole?: string
  filliere?: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface InscriptionAtelier {
  id: string
  atelier_id: string
  stagiaire_nom: string
  stagiaire_email: string
  stagiaire_pole?: string
  stagiaire_filliere?: string
  date_inscription: string
  statut: 'confirme' | 'en_attente' | 'annule'
  created_at: string
  updated_at: string
}

export const useAteliers = () => {
  const [ateliers, setAteliers] = useState<Atelier[]>([])
  const [inscriptions, setInscriptions] = useState<InscriptionAtelier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { currentUser } = useUser()

  // Charger tous les ateliers
  const loadAteliers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('ateliers')
        .select('*')
        .eq('actif', true)
        .order('date_debut', { ascending: true })

      if (error) throw error
      setAteliers(data || [])
    } catch (err: any) {
      console.error('Erreur chargement ateliers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Charger les ateliers d'un animateur spécifique
  const loadAteliersByAnimateur = async (animateurId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('ateliers')
        .select('*')
        .eq('animateur_id', animateurId)
        .eq('actif', true)
        .order('date_debut', { ascending: true })

      if (error) throw error
      setAteliers(data || [])
    } catch (err: any) {
      console.error('Erreur chargement ateliers animateur:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Créer un nouvel atelier
  const createAtelier = async (atelierData: Omit<Atelier, 'id' | 'created_at' | 'updated_at' | 'capacite_actuelle'>) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('ateliers')
        .insert([{
          ...atelierData,
          animateur_id: currentUser?.id,
          animateur_nom: `${currentUser?.prenom} ${currentUser?.nom}`.trim()
        }])
        .select()

      if (error) throw error
      
      // Recharger la liste
      await loadAteliers()
      return data?.[0]
    } catch (err: any) {
      console.error('Erreur création atelier:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Modifier un atelier
  const updateAtelier = async (id: string, updates: Partial<Atelier>) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('ateliers')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      
      // Recharger la liste
      await loadAteliers()
      return data?.[0]
    } catch (err: any) {
      console.error('Erreur modification atelier:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Supprimer un atelier (admin seulement)
  const deleteAtelier = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('ateliers')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Recharger la liste
      await loadAteliers()
    } catch (err: any) {
      console.error('Erreur suppression atelier:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Charger les inscriptions d'un atelier
  const loadInscriptionsByAtelier = async (atelierId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('inscriptions_ateliers')
        .select('*')
        .eq('atelier_id', atelierId)
        .order('date_inscription', { ascending: false })

      if (error) throw error
      setInscriptions(data || [])
    } catch (err: any) {
      console.error('Erreur chargement inscriptions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Créer une inscription (page publique)
  const createInscription = async (inscriptionData: Omit<InscriptionAtelier, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true)
    setError(null)
    
    try {
      // Vérifier si l'atelier a encore de la place
      const atelier = ateliers.find(a => a.id === inscriptionData.atelier_id)
      if (!atelier) {
        throw new Error('Atelier non trouvé')
      }
      
      if (atelier.capacite_actuelle >= atelier.capacite_max) {
        throw new Error('Atelier complet')
      }

      // Vérifier si l'utilisateur n'est pas déjà inscrit
      const { data: existingInscription } = await supabase
        .from('inscriptions_ateliers')
        .select('id')
        .eq('atelier_id', inscriptionData.atelier_id)
        .eq('stagiaire_email', inscriptionData.stagiaire_email)
        .single()

      if (existingInscription) {
        throw new Error('Vous êtes déjà inscrit à cet atelier')
      }

      const { data, error } = await supabase
        .from('inscriptions_ateliers')
        .insert([inscriptionData])
        .select()

      if (error) throw error
      
      return data?.[0]
    } catch (err: any) {
      console.error('Erreur création inscription:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Modifier le statut d'une inscription
  const updateInscriptionStatus = async (id: string, statut: InscriptionAtelier['statut']) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('inscriptions_ateliers')
        .update({ statut })
        .eq('id', id)
        .select()

      if (error) throw error
      
      // Recharger les inscriptions si on est sur une page d'atelier
      if (inscriptions.length > 0) {
        await loadInscriptionsByAtelier(inscriptions[0].atelier_id)
      }
      
      return data?.[0]
    } catch (err: any) {
      console.error('Erreur modification inscription:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Charger les ateliers au montage du composant
  useEffect(() => {
    loadAteliers()
  }, [])

  return {
    ateliers,
    inscriptions,
    loading,
    error,
    loadAteliers,
    loadAteliersByAnimateur,
    createAtelier,
    updateAtelier,
    deleteAtelier,
    loadInscriptionsByAtelier,
    createInscription,
    updateInscriptionStatus
  }
} 