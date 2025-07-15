// ========================================
// src/hooks/useDemandesCV.ts - Hook pour gestion des demandes CV
// ========================================

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useDemandesCV() {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les demandes
  const fetchDemandes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('demandes_cv')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    setDemandes(data || []);
    setLoading(false);
  };

  // Ajouter une demande
  const addDemande = async (demande: any) => {
    const { error } = await supabase
      .from('demandes_cv')
      .insert([demande]);
    if (error) return { success: false, error };
    await fetchDemandes();
    return { success: true };
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  return { demandes, loading, error, addDemande, fetchDemandes };
}