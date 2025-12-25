// ========================================
// src/hooks/useEvenements.ts - Version optimisée avec cache
// ========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealTime } from './useRealTime';

// Cache pour éviter les rechargements inutiles
const cache = new Map();
const CACHE_DURATION = 8 * 60 * 60 * 1000; // 8 heures de cache (augmenté pour éviter les timeouts)
const CACHE_KEY = 'cop_app_evenements_cache';
const REQUEST_TIMEOUT = 30000; // 30 secondes de timeout pour les requêtes

export function useEvenements() {
  const [evenements, setEvenements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Charger le cache depuis localStorage
  const loadFromLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const cacheData = JSON.parse(cached);
      const now = Date.now();
      if (now - cacheData.timestamp < CACHE_DURATION) {
        return cacheData;
      }
      // Cache expiré, le supprimer
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch (err) {
      console.error('Erreur lecture cache localStorage:', err);
      return null;
    }
  }, []);

  // Sauvegarder dans localStorage
  const saveToLocalStorage = useCallback((data: any[], timestamp: number) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp }));
    } catch (err) {
      console.error('Erreur sauvegarde cache localStorage:', err);
    }
  }, []);

  const fetchEvenements = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = 'evenements';
    
    // Vérifier d'abord le cache en mémoire
    let cached = cache.get(cacheKey);
    
    // Si pas de cache en mémoire, vérifier localStorage
    if (!cached) {
      const localStorageCache = loadFromLocalStorage();
      if (localStorageCache) {
        cached = localStorageCache;
        // Mettre aussi en cache mémoire
        cache.set(cacheKey, cached);
      }
    }

    // Utiliser le cache si disponible et pas expiré
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Utilisation du cache:', cached.data.length, 'événements');
      setEvenements(cached.data);
      setLoading(false);
      return;
    }
    
    console.log('🔄 Rechargement des données (cache expiré ou forceRefresh)');

    // Ne pas mettre loading à true si on a déjà des données (pour éviter le flash blanc)
    // Seulement mettre loading à true si on n'a pas de données
    if (evenements.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      // Créer une promesse avec timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La requête a pris trop de temps')), REQUEST_TIMEOUT);
      });

      // Requête avec colonnes photos, type_evenement et capacités pour l'affichage
      const queryPromise = supabase
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

      // Race entre la requête et le timeout
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Erreur fetchEvenements:', error);
        // Si erreur de session, utiliser cache si disponible
        if (error.message?.includes('session') || error.message?.includes('auth') || error.message?.includes('JWT')) {
          if (cached) {
            console.log('⚠️ Erreur session, utilisation du cache');
            setEvenements(cached.data);
            setLoading(false);
            return;
          }
        }
        throw error;
      }

      const evenementsData = data || [];
      console.log('📊 Événements récupérés:', evenementsData.length);
      
      // Mettre en cache (mémoire et localStorage)
      const cacheData = {
        data: evenementsData,
        timestamp: now
      };
      cache.set(cacheKey, cacheData);
      saveToLocalStorage(evenementsData, now);

      console.log('🔍 Hook useEvenements - Données récupérées:', evenementsData.length, 'événements');
      
      setEvenements(evenementsData);
      lastFetchRef.current = now;
    } catch (err: any) {
      console.error('❌ Erreur fetchEvenements:', err);
      // En cas d'erreur, utiliser le cache si disponible
      if (cached) {
        console.log('⚠️ Erreur, utilisation du cache de secours');
        setEvenements(cached.data);
      } else {
        setError(err.message || 'Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  }, [evenements.length, loadFromLocalStorage, saveToLocalStorage]);

  useEffect(() => {
    // Charger les données seulement si elles ne sont pas déjà en cache
    const cacheKey = 'evenements';
    let cached = cache.get(cacheKey);
    const now = Date.now();
    
    // Si pas de cache en mémoire, vérifier localStorage
    if (!cached) {
      const localStorageCache = loadFromLocalStorage();
      if (localStorageCache) {
        cached = localStorageCache;
        cache.set(cacheKey, cached);
      }
    }
    
    // Si le cache est valide, utiliser les données en cache
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Utilisation du cache au montage:', cached.data.length, 'événements');
      setEvenements(cached.data);
      setLoading(false);
      // Recharger en arrière-plan pour mettre à jour le cache
      setTimeout(() => {
        fetchEvenements(true).catch(err => {
          console.error('Erreur rechargement arrière-plan:', err);
        });
      }, 1000);
    } else {
      // Sinon, charger les données
      fetchEvenements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Seulement au montage, pas de dépendance sur fetchEvenements pour éviter les rechargements

  // Sauvegarder dans localStorage (fonction réutilisable via ref)
  const saveToLocalStorageRef = useRef(saveToLocalStorage);
  useEffect(() => {
    saveToLocalStorageRef.current = saveToLocalStorage;
  }, [saveToLocalStorage]);

  // Optimisation du temps réel - mise à jour locale au lieu de recharger
  useRealTime('evenements', ({ eventType, new: newRow, old: oldRow }) => {
    setEvenements((prev) => {
      // S'assurer que prev est un tableau valide
      if (!Array.isArray(prev)) {
        console.warn('⚠️ prev n\'est pas un tableau, réinitialisation');
        return [];
      }
      
      const cacheKey = 'evenements';
      const cached = cache.get(cacheKey);
      
      if (eventType === 'INSERT' && newRow) {
        // Mettre à jour le cache avec la nouvelle donnée
        const newData = [...prev, newRow];
        if (cached) {
          const updatedCache = {
            data: newData,
            timestamp: cached.timestamp
          };
          cache.set(cacheKey, updatedCache);
          saveToLocalStorageRef.current(newData, cached.timestamp);
        }
        return newData;
      }
      if (eventType === 'UPDATE' && newRow) {
        // Mettre à jour le cache
        const newData = prev.map((item) => (item.id === newRow.id ? newRow : item));
        if (cached) {
          const updatedCache = {
            data: newData,
            timestamp: cached.timestamp
          };
          cache.set(cacheKey, updatedCache);
          saveToLocalStorageRef.current(newData, cached.timestamp);
        }
        return newData;
      }
      if (eventType === 'DELETE' && oldRow) {
        // Mettre à jour le cache
        const newData = prev.filter((item) => item.id !== oldRow.id);
        if (cached) {
          const updatedCache = {
            data: newData,
            timestamp: cached.timestamp
          };
          cache.set(cacheKey, updatedCache);
          saveToLocalStorageRef.current(newData, cached.timestamp);
        }
        return newData;
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CACHE_KEY);
      }
      
      // Retourner un objet avec success: true
      return { success: true };
    } catch (err: any) {
      console.error('Erreur sauvegarde événement:', err);
      
      // Si erreur de session, invalider le cache
      if (err.message?.includes('session') || err.message?.includes('auth')) {
        cache.delete('evenements');
        if (typeof window !== 'undefined') {
          localStorage.removeItem(CACHE_KEY);
        }
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