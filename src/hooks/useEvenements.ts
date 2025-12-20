// ========================================
// src/hooks/useEvenements.ts - Version optimisée avec cache
// ========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealTime } from './useRealTime';

// Cache pour éviter les rechargements inutiles
const cache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes de cache (augmenté pour éviter les timeouts)

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
      console.log('📦 Utilisation du cache:', cached.data.length, 'événements');
      setEvenements(cached.data);
      setLoading(false);
      return;
    }
    
    console.log('🔄 Rechargement des données (cache expiré ou forceRefresh)');

    // Ne pas vérifier la session ici car cela peut causer des problèmes
    // La session sera vérifiée par Supabase lors de la requête
    // Si la session est invalide, Supabase retournera une erreur qu'on gérera

    // Ne pas mettre loading à true si on a déjà des données (pour éviter le flash blanc)
    // Seulement mettre loading à true si on n'a pas de données
    if (evenements.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      // Requête avec colonnes photos, type_evenement et capacités pour l'affichage
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
          responsable_cop,
          actif,
          created_at,
          photos_urls,
          image_url,
          type_evenement,
          type_evenement_id,
          capacite_maximale,
          capacite_actuelle,
          visible_inscription,
          nombre_beneficiaires,
          nombre_candidats,
          nombre_candidats_retenus,
          event_types(nom, couleur)
        `)
        .order('date_debut', { ascending: false });

      if (error) {
        console.error('❌ Erreur fetchEvenements:', error);
        throw error;
      }

      const evenementsData = data || [];
      console.log('📊 Événements récupérés:', evenementsData.length);
      
      // Mettre en cache
      cache.set(cacheKey, {
        data: evenementsData,
        timestamp: now
      });

      console.log('🔍 Hook useEvenements - Données récupérées:', evenementsData.length, 'événements');
      
      setEvenements(evenementsData);
      lastFetchRef.current = now;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Charger les données seulement si elles ne sont pas déjà en cache
    const cacheKey = 'evenements';
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    // Si le cache est valide, utiliser les données en cache
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Utilisation du cache au montage:', cached.data.length, 'événements');
      setEvenements(cached.data);
      setLoading(false);
    } else {
      // Sinon, charger les données
      fetchEvenements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Seulement au montage, pas de dépendance sur fetchEvenements pour éviter les rechargements

  // Optimisation du temps réel - mise à jour locale au lieu de recharger
  useRealTime('evenements', ({ eventType, new: newRow, old: oldRow }) => {
    setEvenements((prev) => {
      // S'assurer que prev est un tableau valide
      if (!Array.isArray(prev)) {
        console.warn('⚠️ prev n\'est pas un tableau, réinitialisation');
        return [];
      }
      
      if (eventType === 'INSERT' && newRow) {
        // Mettre à jour le cache avec la nouvelle donnée
        const cacheKey = 'evenements';
        const cached = cache.get(cacheKey);
        if (cached) {
          cache.set(cacheKey, {
            data: [...prev, newRow],
            timestamp: cached.timestamp
          });
        }
        return [...prev, newRow];
      }
      if (eventType === 'UPDATE' && newRow) {
        // Mettre à jour le cache
        const cacheKey = 'evenements';
        const cached = cache.get(cacheKey);
        if (cached) {
          cache.set(cacheKey, {
            data: prev.map((item) => (item.id === newRow.id ? newRow : item)),
            timestamp: cached.timestamp
          });
        }
        return prev.map((item) => (item.id === newRow.id ? newRow : item));
      }
      if (eventType === 'DELETE' && oldRow) {
        // Mettre à jour le cache
        const cacheKey = 'evenements';
        const cached = cache.get(cacheKey);
        if (cached) {
          cache.set(cacheKey, {
            data: prev.filter((item) => item.id !== oldRow.id),
            timestamp: cached.timestamp
          });
        }
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
    ensureDataFresh,
    fetchEvenements
  };
}