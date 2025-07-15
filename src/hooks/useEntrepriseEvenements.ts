import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EntrepriseEvenement {
  id: number;
  entreprise_id: number;
  evenement_id: number;
  statut_interet: string;
  date_inscription: string;
  notes?: string;
  entreprises?: {
    nom: string;
    contact_personne: string;
    telephone: string;
    email: string;
  };
  evenements?: {
    titre: string;
    date_debut: string;
    lieu: string;
  };
}

export const useEntrepriseEvenements = () => {
  const [liaisons, setLiaisons] = useState<EntrepriseEvenement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inscrire une entreprise à un événement
  const inscrireEntreprise = async (
    entrepriseId: number, 
    evenementId: number, 
    notes: string = '',
    statutInteret: string = 'Intéressé'
  ) => {
    try {
      const { data, error } = await supabase
        .from('evenement_entreprises')
        .insert([{
          entreprise_id: entrepriseId,
          evenement_id: evenementId,
          statut_interet: statutInteret,
          notes: notes
        }])
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data?.[0] };
    } catch (err: any) {
      console.error('Erreur inscription entreprise:', err);
      return { success: false, error: err.message };
    }
  };

  // Récupérer les entreprises d'un événement
  const getEntreprisesParEvenement = async (evenementId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evenement_entreprises')
        .select(`
          *,
          entreprises (
            nom,
            contact_personne,
            telephone,
            email,
            secteur
          )
        `)
        .eq('evenement_id', evenementId);
      
      if (error) throw error;
      setLiaisons(data || []);
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les événements d'une entreprise
  const getEvenementsParEntreprise = async (entrepriseId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evenement_entreprises')
        .select(`
          *,
          evenements (
            titre,
            date_debut,
            date_fin,
            lieu,
            description
          )
        `)
        .eq('entreprise_id', entrepriseId);
      
      if (error) throw error;
      setLiaisons(data || []);
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Modifier le statut d'intérêt
  const modifierStatutInteret = async (
    liaisonId: number, 
    nouveauStatut: string, 
    notes?: string
  ) => {
    try {
      const updateData: any = { statut_interet: nouveauStatut };
      if (notes !== undefined) updateData.notes = notes;

      const { data, error } = await supabase
        .from('evenement_entreprises')
        .update(updateData)
        .eq('id', liaisonId)
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data?.[0] };
    } catch (err: any) {
      console.error('Erreur modification statut:', err);
      return { success: false, error: err.message };
    }
  };

  // Supprimer une liaison entreprise-événement
  const supprimerLiaison = async (liaisonId: number) => {
    try {
      const { error } = await supabase
        .from('evenement_entreprises')
        .delete()
        .eq('id', liaisonId);
      
      if (error) throw error;
      
      setLiaisons(prev => prev.filter(l => l.id !== liaisonId));
      return { success: true };
    } catch (err: any) {
      console.error('Erreur suppression liaison:', err);
      return { success: false, error: err.message };
    }
  };

  // Vérifier si une entreprise est déjà inscrite à un événement
  const verifierInscription = async (entrepriseId: number, evenementId: number) => {
    try {
      const { data, error } = await supabase
        .from('evenement_entreprises')
        .select('id')
        .eq('entreprise_id', entrepriseId)
        .eq('evenement_id', evenementId);
      
      if (error) throw error;
      
      return { success: true, existe: data && data.length > 0 };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Statistiques
  const getStatistiques = async () => {
    try {
      // Nombre total d'inscriptions
      const { count: totalInscriptions } = await supabase
        .from('evenement_entreprises')
        .select('*', { count: 'exact', head: true });

      // Inscriptions par statut
      const { data: parStatut } = await supabase
        .from('evenement_entreprises')
        .select('statut_interet')
        .neq('statut_interet', null);

      const statistiques = {
        total: totalInscriptions || 0,
        parStatut: parStatut?.reduce((acc: any, item) => {
          acc[item.statut_interet] = (acc[item.statut_interet] || 0) + 1;
          return acc;
        }, {}) || {}
      };

      return { success: true, data: statistiques };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    liaisons,
    loading,
    error,
    inscrireEntreprise,
    getEntreprisesParEvenement,
    getEvenementsParEntreprise,
    modifierStatutInteret,
    supprimerLiaison,
    verifierInscription,
    getStatistiques
  };
};