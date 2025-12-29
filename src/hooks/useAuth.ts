// ========================================
// src/hooks/useAuth.ts - Hook optimisé utilisant UserContext
// ========================================

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUserPermissions } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import type { Profile, UserPermissions } from '@/types'

interface AuthState {
  user: unknown | null
  profile: Profile | null
  permissions: UserPermissions | null
  loading: boolean
  error: string | null
}

export const useAuth = () => {
  const { currentUser, isLoading: userContextLoading, refreshUser } = useUser()
  const router = useRouter()
  const [authUser, setAuthUser] = useState<unknown | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Récupérer l'utilisateur Supabase une seule fois
  useEffect(() => {
    let mounted = true

    const getAuthUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (mounted) {
          setAuthUser(user)
        }
      } catch (error) {
        console.error('Erreur récupération user auth:', error)
      }
    }

    getAuthUser()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null)
          router.push('/login')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // Utiliser les données de UserContext au lieu de refaire des requêtes
  const authState = useMemo<AuthState>(() => {
    // Si UserContext est en cours de chargement, on attend
    if (userContextLoading) {
      return {
        user: authUser,
        profile: null,
        permissions: null,
        loading: true,
        error: null
      }
    }

    // Si pas d'utilisateur dans le contexte, pas d'authentification
    if (!currentUser) {
      return {
        user: null,
        profile: null,
        permissions: null,
        loading: false,
        error: null
      }
    }

    // Convertir le profil UserContext en Profile
    const profile: Profile = {
      id: currentUser.id,
      email: currentUser.email,
      nom: currentUser.nom,
      prenom: currentUser.prenom,
      telephone: currentUser.telephone,
      poste: currentUser.poste,
      role: currentUser.role,
      created_at: currentUser.created_at,
      updated_at: currentUser.updated_at
    }

    const permissions = getUserPermissions(profile.role || '')

    return {
      user: authUser,
      profile,
      permissions,
      loading: false,
      error: null
    }
  }, [currentUser, authUser, userContextLoading])

  const signIn = async (email: string, password: string) => {
    setAuthLoading(true)
    setAuthError(null)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Rafraîchir l'utilisateur depuis UserContext
      await refreshUser()

    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Erreur de connexion')
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  const signOut = async () => {
    try {
      // Déconnexion Supabase
      await supabase.auth.signOut()

      // Redirection forcée
      window.location.href = '/login'
      
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Même en cas d'erreur, on redirige
      window.location.href = '/login'
    }
  }

  return {
    ...authState,
    loading: authState.loading || authLoading,
    error: authState.error || authError,
    signIn,
    signOut,
    isAuthenticated: !!authState.user && !!authState.profile,
    hasPermission: (permission: keyof UserPermissions) => 
      authState.permissions?.[permission] || false
  }
}