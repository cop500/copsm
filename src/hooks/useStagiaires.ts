// ========================================
// src/hooks/useStagiaires.ts - Hook pour gestion des stagiaires
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealTime } from './useRealTime';

export function useStagiaires() {
  const [stagiaires, setStagiaires] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStagiaires = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('stagiaires').select('*');
    setStagiaires(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStagiaires();
  }, [fetchStagiaires]);

  useRealTime('stagiaires', ({ eventType, new: newRow, old: oldRow }) => {
    setStagiaires((prev) => {
      if (eventType === 'INSERT' && newRow) return [...prev, newRow];
      if (eventType === 'UPDATE' && newRow) return prev.map((item) => (item.id === newRow.id ? newRow : item));
      if (eventType === 'DELETE' && oldRow) return prev.filter((item) => item.id !== oldRow.id);
      return prev;
    });
  });

  // Ajout ou modification d’un stagiaire
  const saveStagiaire = async (stagiaire: Record<string, unknown>) => {
    if (stagiaire.id) {
      // Mise à jour
      const { error } = await supabase
        .from('stagiaires')
        .update(stagiaire)
        .eq('id', stagiaire.id);
      if (error) throw error;
    } else {
      // Création
      const { error } = await supabase
        .from('stagiaires')
        .insert([stagiaire]);
      if (error) throw error;
    }
    await fetchStagiaires();
  };

  // Suppression d’un stagiaire
  const deleteStagiaire = async (id: string) => {
    const { error } = await supabase
      .from('stagiaires')
      .delete()
      .eq('id', id);
    if (error) return { success: false, error };
    await fetchStagiaires();
    return { success: true };
  };

  return { stagiaires, loading, refresh: fetchStagiaires, saveStagiaire, deleteStagiaire };
}