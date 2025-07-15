import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface Rappel {
  id: string;
  titre: string;
  contenu: string;
  type: string;
  created_at: string;
  created_by: string;
}

export const useRappels = () => {
  const { profile } = useAuth();
  const [rappels, setRappels] = useState<Rappel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les rappels (ordre antéchronologique)
  const loadRappels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rappels')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRappels(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un rappel
  const addRappel = async (rappel: Partial<Rappel>) => {
    try {
      const { data, error } = await supabase
        .from('rappels')
        .insert([{ ...rappel, created_by: profile?.id }])
        .select();
      if (error) throw error;
      await loadRappels();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Supprimer un rappel (admin)
  const deleteRappel = async (id: string) => {
    try {
      await supabase.from('rappels').delete().eq('id', id);
      await loadRappels();
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    loadRappels();
  }, []);

  return {
    rappels,
    loading,
    error,
    addRappel,
    deleteRappel,
    reload: loadRappels,
  };
}; 