// ========================================
// src/hooks/useRealTime.ts - Hook temps réel robuste
// ========================================

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// Type générique pour le handler de changement
type ChangeHandler<T> = (payload: { eventType: string; new: T | null; old: T | null }) => void;

export function useRealTime<T = unknown>(table: string, onChange: ChangeHandler<T>) {
  const onChangeRef = useRef(onChange);
  const channelRef = useRef<any>(null);

  // Mettre à jour la référence du callback
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    try {
      // Créer le canal avec un nom unique
      const channelName = `realtime:${table}:${Date.now()}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: table 
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
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Canal temps réel connecté pour ${table}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Erreur canal temps réel pour ${table}`);
          }
        });

      channelRef.current = channel;

      return () => {
        try {
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            console.log(`🔌 Canal temps réel déconnecté pour ${table}`);
          }
        } catch (error) {
          console.error('Erreur lors de la déconnexion du canal:', error);
        }
      };
    } catch (error) {
      console.error('Erreur lors de la création du canal temps réel:', error);
    }
  }, [table]);
}