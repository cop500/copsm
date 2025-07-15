import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface IndicateurDashboard {
  id: string;
  titre: string;
  valeur: string;
  trend?: string;
  couleur?: string;
  icone?: string;
  ordre?: number;
}

export const useIndicateursDashboard = () => {
  const [indicateurs, setIndicateurs] = useState<IndicateurDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIndicateurs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('indicateurs_dashboard')
        .select('*')
        .order('ordre', { ascending: true });
      if (error) throw error;
      setIndicateurs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateIndicateur = async (id: string, updates: Partial<IndicateurDashboard>) => {
    try {
      const { error } = await supabase
        .from('indicateurs_dashboard')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      await loadIndicateurs();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    loadIndicateurs();
  }, []);

  return {
    indicateurs,
    loading,
    error,
    reload: loadIndicateurs,
    updateIndicateur,
  };
}; 