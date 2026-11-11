'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  USER_CACHE_KEY,
  clearBrokenLocalSession,
  isInvalidSessionError,
  withTimeout,
} from '@/lib/authBootstrap';

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

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    if (isRefreshingRef.current && !forceRefresh) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      const { data: { session }, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        6000,
        'getSession'
      );

      if (sessionError || !session?.user) {
        setCurrentUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(USER_CACHE_KEY);
        }
        if (sessionError && isInvalidSessionError(sessionError)) {
          await clearBrokenLocalSession();
        }
        return;
      }

      const { data: profile, error: profileError } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        8000,
        'profil'
      );

      if (profileError) {
        if (isInvalidSessionError(profileError)) {
          setCurrentUser(null);
          await clearBrokenLocalSession();
        }
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
          updated_at: profile.updated_at ? String(profile.updated_at) : undefined,
        };

        setCurrentUser(userProfile);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              USER_CACHE_KEY,
              JSON.stringify({ user: userProfile, timestamp: Date.now() })
            );
          } catch {
            /* quota localStorage */
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      if (isInvalidSessionError(error)) {
        setCurrentUser(null);
        await clearBrokenLocalSession();
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
    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        void loadUser(true);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsLoading(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(USER_CACHE_KEY);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      refreshUser,
      updateUserProfile,
      isLoading,
      role: currentUser?.role ?? null,
      profile: currentUser,
    }),
    [currentUser, isLoading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export { UserContext };