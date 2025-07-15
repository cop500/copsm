// ========================================
// src/hooks/useEvenements.ts - Version simplifiée qui fonctionne
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealTime } from './useRealTime';

export function useEvenements() {
  const [evenements, setEvenements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvenements = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('evenements').select('*');
    setEvenements(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvenements();
  }, [fetchEvenements]);

  useRealTime('evenements', ({ eventType, new: newRow, old: oldRow }) => {
    setEvenements((prev) => {
      if (eventType === 'INSERT' && newRow) return [...prev, newRow];
      if (eventType === 'UPDATE' && newRow) return prev.map((item) => (item.id === newRow.id ? newRow : item));
      if (eventType === 'DELETE' && oldRow) return prev.filter((item) => item.id !== oldRow.id);
      return prev;
    });
  });

  // Ajout ou modification d’un événement
  const saveEvenement = async (evenement: any) => {
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
    await fetchEvenements();
  };

  return { evenements, loading, refresh: fetchEvenements, saveEvenement };
}