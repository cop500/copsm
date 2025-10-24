// ========================================
// src/hooks/useEvenements.ts - Version optimisée avec cache
// ========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealTime } from './useRealTime';

// Cache pour éviter les rechargements inutiles
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes de cache (augmenté pour éviter les timeouts)

export function useEvenements() {
  const [evenements, setEvenements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchEvenements = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = 'evenements';
    const cached = cache.get(cacheKey);

    // Utiliser le cache si disponible et pas expiré
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setEvenements(cached.data);
      setLoading(false);
      return;
    }

    // Vérifier si la session est toujours valide
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('Session expirée, rechargement des données...');
        // Forcer le rechargement même si le cache existe
        forceRefresh = true;
      }
    } catch (error) {
      console.warn('Erreur vérification session:', error);
      forceRefresh = true;
    }

    setLoading(true);
    setError(null);

    try {
      // Requête optimisée - sélectionner seulement les colonnes nécessaires
      const { data, error } = await supabase
        .from('evenements')
        .select(`
          id,
          titre,
          description,
          date_debut,
          date_fin,
          lieu,
          statut,
          volet,
          pole_id,
          filiere_id,
          photos_urls,
          type_evenement,
          type_evenement_id,
          responsable_cop,
          actif,
          created_at,
          nombre_beneficiaires,
          nombre_candidats,
          nombre_candidats_retenus,
          taux_conversion,
          animateur_id,
          animateur_nom,
          animateur_role,
          capacite_maximale,
          capacite_actuelle,
          visible_inscription
        `)
        .order('date_debut', { ascending: false });

      if (error) throw error;

      const evenementsData = data || [];
      
      // Mettre en cache
      cache.set(cacheKey, {
        data: evenementsData,
        timestamp: now
      });

      console.log('🔍 Hook useEvenements - Données récupérées:', evenementsData.length, 'événements');
      console.log('🔍 Hook useEvenements - Données:', evenementsData);
      
      setEvenements(evenementsData);
      lastFetchRef.current = now;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvenements();
  }, [fetchEvenements]);

  // Optimisation du temps réel - mise à jour locale au lieu de recharger
  useRealTime('evenements', ({ eventType, new: newRow, old: oldRow }) => {
    setEvenements((prev) => {
      if (eventType === 'INSERT' && newRow) {
        // Invalider le cache
        cache.delete('evenements');
        return [...prev, newRow];
      }
      if (eventType === 'UPDATE' && newRow) {
        // Invalider le cache
        cache.delete('evenements');
        return prev.map((item) => (item.id === newRow.id ? newRow : item));
      }
      if (eventType === 'DELETE' && oldRow) {
        // Invalider le cache
        cache.delete('evenements');
        return prev.filter((item) => item.id !== oldRow.id);
      }
      return prev;
    });
  });

  // Ajout ou modification d'un événement - optimisé
  const saveEvenement = async (evenement: any) => {
    try {
      // Vérifier la session avant de sauvegarder
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
      }

      if (evenement.id) {
        // Mise à jour
        const { error } = await supabase
          .from('evenements')
          .update(evenement)
          .eq('id', evenement.id);
        if (error) throw error;
      } else {
        // Création
        const { error } = await supabase
          .from('evenements')
          .insert([evenement]);
        if (error) throw error;
      }
      
      // Invalider le cache seulement - le rechargement se fera automatiquement
      cache.delete('evenements');
      
      // Retourner un objet avec success: true
      return { success: true };
    } catch (err: any) {
      console.error('Erreur sauvegarde événement:', err);
      
      // Si erreur de session, invalider le cache
      if (err.message?.includes('session') || err.message?.includes('auth')) {
        cache.delete('evenements');
      }
      
      // Retourner un objet avec success: false et l'erreur
      return { success: false, error: err.message || 'Erreur inconnue' };
    }
  };

  // Fonction pour forcer le rafraîchissement
  const refresh = useCallback(() => {
    fetchEvenements(true);
  }, [fetchEvenements]);

  // Fonction pour vérifier et recharger si nécessaire
  const ensureDataFresh = useCallback(async () => {
    const now = Date.now();
    const cacheKey = 'evenements';
    const cached = cache.get(cacheKey);
    
    // Si pas de cache ou cache expiré, recharger
    if (!cached || (now - cached.timestamp) > CACHE_DURATION) {
      console.log('🔄 Données expirées, rechargement automatique...');
      await fetchEvenements(true);
    }
  }, [fetchEvenements]);

  return { 
    evenements, 
    loading, 
    error,
    refresh, 
    saveEvenement,
    ensureDataFresh
  };
}