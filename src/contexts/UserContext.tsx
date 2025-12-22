'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  poste?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserContextType {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  refreshUser: () => Promise<void>;
  updateUserProfile: (updates: Partial<Profile>) => void;
  isLoading: boolean;
  role: string | null; // Ajouté pour accès direct au rôle
  profile: Profile | null; // Alias pour currentUser
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Clé pour le localStorage
const USER_CACHE_KEY = 'cop_app_user_cache';
const SESSION_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Charger l'utilisateur depuis le cache au démarrage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(USER_CACHE_KEY);
        if (cached) {
          const cachedUser = JSON.parse(cached);
          // Utiliser le cache seulement si moins de 24h
          const cacheAge = Date.now() - (cachedUser.timestamp || 0);
          if (cacheAge < 24 * 60 * 60 * 1000) {
            setCurrentUser(cachedUser.user);
            setIsLoading(false);
            console.log('📦 Utilisation du cache utilisateur');
          }
        }
      } catch (error) {
        console.error('Erreur lecture cache utilisateur:', error);
      }
    }
  }, []);

  const loadUser = async (forceRefresh = false) => {
    // Éviter les appels multiples simultanés
    if (isRefreshingRef.current && !forceRefresh) {
      return;
    }
    
    isRefreshingRef.current = true;
    
    try {
      // Vérifier et rafraîchir la session si nécessaire
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erreur session:', sessionError);
        // Si erreur de session, essayer de récupérer depuis le cache
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem(USER_CACHE_KEY);
            if (cached) {
              const cachedUser = JSON.parse(cached);
              setCurrentUser(cachedUser.user);
              return;
            }
          } catch (e) {
            console.error('Erreur lecture cache:', e);
          }
        }
        return;
      }

      // Si pas de session, garder le cache si disponible
      if (!session) {
        console.warn('⚠️ Pas de session active');
        return;
      }

      // Rafraîchir le token si nécessaire (Supabase le fait automatiquement mais on force)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Erreur récupération utilisateur:', userError);
        return;
      }

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Erreur récupération profil:', profileError);
          return;
        }
        
        if (profile) {
          const userProfile: Profile = {
            id: String(profile.id || ''),
            email: String(profile.email || ''),
            nom: String(profile.nom || ''),
            prenom: String(profile.prenom || ''),
            telephone: profile.telephone ? String(profile.telephone) : undefined,
            poste: profile.poste ? String(profile.poste) : undefined,
            role: profile.role ? String(profile.role) : undefined,
            created_at: profile.created_at ? String(profile.created_at) : undefined,
            updated_at: profile.updated_at ? String(profile.updated_at) : undefined
          };
          
          setCurrentUser(userProfile);
          
          // Mettre en cache dans localStorage
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(USER_CACHE_KEY, JSON.stringify({
                user: userProfile,
                timestamp: Date.now()
              }));
            } catch (e) {
              console.error('Erreur écriture cache:', e);
            }
          }
          
          console.log('✅ Utilisateur chargé:', userProfile.email);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du profil:', error);
      // En cas d'erreur, essayer de garder le cache
      if (typeof window !== 'undefined' && !currentUser) {
        try {
          const cached = localStorage.getItem(USER_CACHE_KEY);
          if (cached) {
            const cachedUser = JSON.parse(cached);
            setCurrentUser(cachedUser.user);
          }
        } catch (e) {
          console.error('Erreur lecture cache de secours:', e);
        }
      }
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  };

  const refreshUser = async () => {
    await loadUser(true);
  };

  const updateUserProfile = (updates: Partial<Profile>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      
      // Mettre à jour le cache
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify({
            user: updatedUser,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Erreur mise à jour cache:', e);
        }
      }
    }
  };

  useEffect(() => {
    // Charger l'utilisateur au montage
    loadUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Événement auth:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUser(true);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(USER_CACHE_KEY);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Rafraîchir les données utilisateur après rafraîchissement du token
          console.log('🔄 Token rafraîchi, rechargement utilisateur...');
          await loadUser(true);
        }
      }
    );

    // Rafraîchir la session périodiquement pour éviter l'expiration
    refreshIntervalRef.current = setInterval(() => {
      console.log('🔄 Rafraîchissement périodique de la session...');
      loadUser(true);
    }, SESSION_REFRESH_INTERVAL);

    return () => {
      subscription.unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return (
    <UserContext.Provider value={{
      currentUser,
      setCurrentUser,
      refreshUser,
      updateUserProfile,
      isLoading,
      role: currentUser?.role ?? null, // Ajouté
      profile: currentUser // Ajouté
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export { UserContext };