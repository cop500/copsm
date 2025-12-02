import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealTime } from './useRealTime';

// Cache pour éviter les rechargements inutiles
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes de cache

export interface PersonneRencontree {
  nom: string;
  fonction: string;
  email?: string;
  telephone?: string;
}

export interface ActionSuivi {
  tache: string;
  date_limite: string;
  statut: 'en_attente' | 'en_cours' | 'termine' | 'annule';
}

export interface VisiteEntreprise {
  id: string;
  entreprise_id: string;
  entreprise?: {
    id: string;
    nom: string;
    secteur?: string;
  };
  date_visite: string;
  heure_visite?: string;
  objectif?: string;
  personnes_rencontrees: PersonneRencontree[];
  compte_rendu?: string;
  points_discutes?: string;
  besoins_detectes?: string;
  actions_a_prevues?: string;
  statut_relation?: 'faible' | 'moyen' | 'fort';
  etat_relation?: 'prospect' | 'actif' | 'partenaire';
  actions_suivi: ActionSuivi[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useVisitesEntreprises() {
  const [visites, setVisites] = useState<VisiteEntreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchVisites = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = 'visites_entreprises';
    const cached = cache.get(cacheKey);

    // Utiliser le cache si disponible et pas expiré
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setVisites(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('visites_entreprises')
        .select(`
          *,
          entreprise:entreprises(id, nom, secteur)
        `)
        .order('date_visite', { ascending: false });

      if (error) throw error;

      const visitesData = (data || []).map((v: any) => ({
        ...v,
        personnes_rencontrees: Array.isArray(v.personnes_rencontrees) 
          ? v.personnes_rencontrees 
          : [],
        actions_suivi: Array.isArray(v.actions_suivi) 
          ? v.actions_suivi 
          : [],
      }));
      
      // Mettre en cache
      cache.set(cacheKey, {
        data: visitesData,
        timestamp: now
      });

      setVisites(visitesData);
      lastFetchRef.current = now;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisites();
  }, [fetchVisites]);

  // Optimisation du temps réel - mise à jour locale
  useRealTime('visites_entreprises', ({ eventType, new: newRow, old: oldRow }) => {
    setVisites((prev) => {
      if (eventType === 'INSERT' && newRow) {
        cache.delete('visites_entreprises');
        return [newRow, ...prev];
      }
      if (eventType === 'UPDATE' && newRow) {
        cache.delete('visites_entreprises');
        return prev.map((item) => (item.id === newRow.id ? newRow : item));
      }
      if (eventType === 'DELETE' && oldRow) {
        cache.delete('visites_entreprises');
        return prev.filter((item) => item.id !== oldRow.id);
      }
      return prev;
    });
  });

  // Sauvegarder une visite
  const saveVisite = async (visite: Partial<VisiteEntreprise>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Utilisateur non authentifié' };
      }

      const visiteData = {
        ...visite,
        created_by: visite.created_by || user.id,
        personnes_rencontrees: visite.personnes_rencontrees || [],
        actions_suivi: visite.actions_suivi || [],
      };

      if (visite.id) {
        // Mise à jour
        const { data, error } = await supabase
          .from('visites_entreprises')
          .update(visiteData)
          .eq('id', visite.id)
          .select(`
            *,
            entreprise:entreprises(id, nom, secteur)
          `);
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        cache.delete('visites_entreprises');
        return { success: true, data: data?.[0] };
      } else {
        // Création
        const { data, error } = await supabase
          .from('visites_entreprises')
          .insert([visiteData])
          .select(`
            *,
            entreprise:entreprises(id, nom, secteur)
          `);
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        cache.delete('visites_entreprises');
        return { success: true, data: data?.[0] };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Supprimer une visite
  const deleteVisite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('visites_entreprises')
        .delete()
        .eq('id', id);
      
      if (error) return { success: false, error: error.message };
      
      cache.delete('visites_entreprises');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Obtenir les statistiques
  const getStats = useCallback(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const visitesEffectuees = visites.filter(
      v => new Date(v.date_visite) >= startOfMonth && new Date(v.date_visite) <= now
    ).length;
    
    const visitesPlanifiees = visites.filter(
      v => new Date(v.date_visite) > now
    ).length;
    
    const actionsEnRetard = visites.reduce((acc, v) => {
      return acc + (v.actions_suivi || []).filter(
        (a: ActionSuivi) => 
          a.statut !== 'termine' && 
          a.statut !== 'annule' && 
          new Date(a.date_limite) < now
      ).length;
    }, 0);
    
    // Entreprises prioritaires (avec niveau d'intérêt fort)
    const entreprisesPrioritaires = visites
      .filter(v => v.statut_relation === 'fort')
      .map(v => v.entreprise_id)
      .filter((id, index, self) => self.indexOf(id) === index).length;
    
    return {
      visitesEffectuees,
      visitesPlanifiees,
      entreprisesPrioritaires,
      actionsEnRetard,
    };
  }, [visites]);

  // Fonction pour forcer le rafraîchissement
  const refresh = useCallback(() => {
    fetchVisites(true);
  }, [fetchVisites]);

  return { 
    visites, 
    loading, 
    error,
    refresh, 
    saveVisite, 
    deleteVisite,
    getStats
  };
}

