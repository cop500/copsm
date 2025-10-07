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
    let timeoutId: NodeJS.Timeout;
    
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
              console.log(`🔄 Événement Realtime reçu pour ${table}:`, payload.eventType);
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
          console.log(`📡 Statut Realtime pour ${table}:`, status);
          
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Canal temps réel connecté pour ${table}`);
            setIsConnected(true);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Erreur canal temps réel pour ${table}`);
            setIsConnected(false);
          } else if (status === 'TIMED_OUT') {
            console.error(`⏰ Timeout canal temps réel pour ${table}`);
            setIsConnected(false);
          } else {
            setIsConnected(false);
          }
        });

      channelRef.current = channel;

      // Timeout de sécurité pour détecter les connexions qui ne se font pas
      timeoutId = setTimeout(() => {
        if (!isConnected) {
          console.warn(`⚠️ Timeout de connexion Realtime pour ${table}`);
          setIsConnected(false);
        }
      }, 10000); // 10 secondes

      return () => {
        try {
          if (timeoutId) clearTimeout(timeoutId);
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            console.log(`🔌 Canal temps réel déconnecté pour ${table}`);
            setIsConnected(false);
          }
        } catch (error) {
          console.error('Erreur lors de la déconnexion du canal:', error);
        }
      };
    } catch (error) {
      console.error('Erreur lors de la création du canal temps réel:', error);
      setIsConnected(false);
    }
  }, [table, isConnected]);

  return { isConnected };
}