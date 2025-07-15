'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCurrentUser(profile);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const updateUserProfile = (updates: Partial<Profile>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
    }
  };

  useEffect(() => {
    loadUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUser();
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
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