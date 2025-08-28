import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealTime } from './useRealTime';

// Cache pour éviter les rechargements inutiles
const cache = new Map();
const CACHE_DURATION = 0; // Désactiver le cache pour forcer le rechargement

export function useEntreprises() {
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchEntreprises = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = 'entreprises';
    const cached = cache.get(cacheKey);

    // Utiliser le cache si disponible et pas expiré
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setEntreprises(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Requête optimisée - sélectionner seulement les colonnes nécessaires
      const { data, error } = await supabase
        .from('entreprises')
        .select(`
          id,
          nom,
          secteur,
          adresse,
          contact_principal_nom,
          contact_principal_email,
          contact_principal_telephone,
          statut,
          niveau_interet,
          notes_bd,
          contrat_url,
          created_at
        `)
        .order('nom', { ascending: true });

      if (error) throw error;

      const entreprisesData = data || [];
      
      // Mettre en cache
      cache.set(cacheKey, {
        data: entreprisesData,
        timestamp: now
      });

      setEntreprises(entreprisesData);
      lastFetchRef.current = now;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur chargement entreprises:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntreprises();
  }, [fetchEntreprises]);

  // Optimisation du temps réel - mise à jour locale au lieu de recharger
  useRealTime('entreprises', ({ eventType, new: newRow, old: oldRow }) => {
    setEntreprises((prev) => {
      if (eventType === 'INSERT' && newRow) {
        // Invalider le cache
        cache.delete('entreprises');
        return [...prev, newRow];
      }
      if (eventType === 'UPDATE' && newRow) {
        // Invalider le cache
        cache.delete('entreprises');
        return prev.map((item) => (item.id === newRow.id ? newRow : item));
      }
      if (eventType === 'DELETE' && oldRow) {
        // Invalider le cache
        cache.delete('entreprises');
        return prev.filter((item) => item.id !== oldRow.id);
      }
      return prev;
    });
  });

  // Ajout ou modification d'une entreprise - optimisé
  const saveEntreprise = async (entreprise: any) => {
    console.log('💾 Début sauvegarde entreprise:', entreprise.nom);
    console.log('📝 Données complètes:', entreprise);
    
    try {
      if (entreprise.id) {
        // Mise à jour
        console.log('🔄 Mise à jour entreprise existante ID:', entreprise.id);
        const { data, error } = await supabase
          .from('entreprises')
          .update(entreprise)
          .eq('id', entreprise.id)
          .select();
        
        if (error) {
          console.error('❌ Erreur mise à jour:', error);
          return { success: false, error: error.message };
        }
        
        console.log('✅ Mise à jour réussie:', data);
      } else {
        // Création
        console.log('➕ Création nouvelle entreprise');
        const { data, error } = await supabase
          .from('entreprises')
          .insert([entreprise])
          .select();
        
        if (error) {
          console.error('❌ Erreur création:', error);
          console.error('❌ Détails erreur Supabase:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          return { success: false, error: error.message };
        }
        
        console.log('✅ Création réussie:', data);
      }
      
      // Invalider le cache au lieu de recharger
      cache.delete('entreprises');
      console.log('🗑️ Cache invalidé');
      return { success: true };
    } catch (err: any) {
      console.error('❌ Exception lors de la sauvegarde:', err);
      console.error('❌ Stack trace:', err.stack);
      return { success: false, error: err.message };
    }
  };

  // Suppression d'une entreprise - optimisé
  const deleteEntreprise = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entreprises')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error };
      
      // Invalider le cache au lieu de recharger
      cache.delete('entreprises');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Fonction pour forcer le rafraîchissement
  const refresh = useCallback(() => {
    fetchEntreprises(true);
  }, [fetchEntreprises]);

  return { 
    entreprises, 
    loading, 
    error,
    refresh, 
    saveEntreprise, 
    deleteEntreprise 
  };
}