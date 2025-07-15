import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealTime } from './useRealTime';

export function useEntreprises() {
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntreprises = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('entreprises').select('*');
    setEntreprises(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntreprises();
  }, [fetchEntreprises]);

  useRealTime('entreprises', ({ eventType, new: newRow, old: oldRow }) => {
    setEntreprises((prev) => {
      if (eventType === 'INSERT' && newRow) return [...prev, newRow];
      if (eventType === 'UPDATE' && newRow) return prev.map((item) => (item.id === newRow.id ? newRow : item));
      if (eventType === 'DELETE' && oldRow) return prev.filter((item) => item.id !== oldRow.id);
      return prev;
    });
  });

  // Ajout ou modification d’une entreprise
  const saveEntreprise = async (entreprise: any) => {
    if (entreprise.id) {
      // Mise à jour
      const { error } = await supabase
        .from('entreprises')
        .update(entreprise)
        .eq('id', entreprise.id);
      if (error) return { success: false, error };
    } else {
      // Création
      const { error } = await supabase
        .from('entreprises')
        .insert([entreprise]);
      if (error) return { success: false, error };
    }
    await fetchEntreprises();
    return { success: true };
  };

  // Suppression d’une entreprise
  const deleteEntreprise = async (id: string) => {
    const { error } = await supabase
      .from('entreprises')
      .delete()
      .eq('id', id);
    if (error) return { success: false, error };
    await fetchEntreprises();
    return { success: true };
  };

  return { entreprises, loading, refresh: fetchEntreprises, saveEntreprise, deleteEntreprise };
}