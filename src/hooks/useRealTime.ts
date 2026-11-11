// ========================================
// src/hooks/useRealTime.ts - Hook temps réel robuste
// ========================================

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Type générique pour le handler de changement
type ChangeHandler<T> = (payload: { eventType: string; new: T | null; old: T | null }) => void;

export function useRealTime<T = unknown>(table: string, onChange: ChangeHandler<T>) {
  const onChangeRef = useRef(onChange);
  const channelRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Mettre à jour la référence du callback
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    try {
      const channelName = `realtime:${table}`;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          (payload) => {
            try {
              onChangeRef.current({
                eventType: payload.eventType,
                new: payload.new,
                old: payload.old,
              });
            } catch (error) {
              console.error('Erreur dans le handler onChange:', error);
            }
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });

      channelRef.current = channel;

      return () => {
        try {
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
        } catch (error) {
          console.error('Erreur lors de la déconnexion du canal:', error);
        }
      };
    } catch (error) {
      console.error('Erreur lors de la création du canal temps réel:', error);
      setIsConnected(false);
    }
  }, [table]);

  return { isConnected };
}