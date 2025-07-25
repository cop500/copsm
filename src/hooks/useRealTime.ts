// ========================================
// src/hooks/useRealTime.ts - Hook temps réel corrigé
// ========================================

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Type générique pour le handler de changement
// T = type de la ligne (ex: Stagiaire, Entreprise, etc.)
type ChangeHandler<T> = (payload: { eventType: string; new: T | null; old: T | null }) => void;

export function useRealTime<T = unknown>(table: string, onChange: ChangeHandler<T>) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          onChange({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onChange]);
}