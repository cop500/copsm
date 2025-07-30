import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Toast from './Toast';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationManagerProps {
  children: React.ReactNode;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Ajouter une notification
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
  };

  // Supprimer une notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Écouter les nouvelles demandes entreprises
  useEffect(() => {
    const channel = supabase
      .channel('demandes_entreprises_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'demandes_entreprises'
        },
        (payload) => {
          const nouvelleDemande = payload.new as any;
          
          // Notification pour nouvelle demande
          addNotification({
            type: 'info',
            title: 'Nouvelle demande entreprise',
            message: `${nouvelleDemande.entreprise_nom} a soumis une nouvelle demande`,
            duration: 8000
          });

          // Jouer un son optionnel (si activé)
          if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
            new Notification('Nouvelle demande entreprise', {
              body: `${nouvelleDemande.entreprise_nom} a soumis une nouvelle demande`,
              icon: '/cop-logo.svg'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      {children}
      
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{
              transform: `translateY(${index * 80}px)`,
              zIndex: 1000 - index
            }}
          >
            <Toast
              {...notification}
              onClose={removeNotification}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default NotificationManager; 