import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Toast from './Toast';
import { Bell } from 'lucide-react';

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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Demander la permission pour les notifications
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        addNotification({
          type: 'success',
          title: 'Notifications activées',
          message: 'Vous recevrez maintenant des notifications pour les nouvelles demandes',
          duration: 5000
        });
      }
    }
  };

  // Ajouter une notification
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
    
    // Notification du navigateur si autorisée
    if (typeof window !== 'undefined' && window.Notification && notificationPermission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/cop-logo.svg'
      });
    }
  };

  // Supprimer une notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Test des notifications
  const testNotification = () => {
    addNotification({
      type: 'info',
      title: 'Test de notification',
      message: 'Le système de notifications fonctionne correctement !',
      duration: 5000
    });
  };

  // Vérifier la permission au chargement
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notificationPermission]);

  // Écouter les événements de test
  useEffect(() => {
    const handleTestNotification = (event: CustomEvent) => {
      addNotification({
        type: event.detail.type,
        title: event.detail.title,
        message: event.detail.message,
        duration: 5000
      });
    };

    window.addEventListener('test-notification', handleTestNotification as EventListener);

    return () => {
      window.removeEventListener('test-notification', handleTestNotification as EventListener);
    };
  }, []);

  return (
    <>
      {children}
      
      {/* Bouton de test des notifications */}
      {notificationPermission !== 'granted' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={requestNotificationPermission}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center space-x-2"
            title="Activer les notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="text-sm">Notifications</span>
          </button>
        </div>
      )}
      
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