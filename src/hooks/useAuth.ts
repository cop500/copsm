// ========================================
// src/hooks/useAuth.ts - Hook avec déconnexion corrigée
// ========================================

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUserPermissions } from '@/lib/supabase'
import type { Profile, UserPermissions } from '@/types'

interface AuthState {
  user: any | null
  profile: Profile | null
  permissions: UserPermissions | null
  loading: boolean
  error: string | null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    permissions: null,
    loading: true,
    error: null
  })

  const router = useRouter()

  useEffect(() => {
    let mounted = true

    // Récupérer l'utilisateur actuel
    const getUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (userError) throw userError

        if (user) {
          // Récupérer le profil complet
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (!mounted) return

          if (profileError) {
            console.log('Pas de profil trouvé pour cet utilisateur')
            setAuthState({
              user,
              profile: null,
              permissions: null,
              loading: false,
              error: 'Profil non configuré. Contactez l\'administrateur.'
            })
            return
          }

          const permissions = getUserPermissions(profile.role)

          setAuthState({
            user,
            profile,
            permissions,
            loading: false,
            error: null
          })
        } else {
          setAuthState({
            user: null,
            profile: null,
            permissions: null,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        if (!mounted) return
        setAuthState({
          user: null,
          profile: null,
          permissions: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Erreur d\'authentification'
        })
      }
    }

    getUser()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          getUser()
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            profile: null,
            permissions: null,
            loading: false,
            error: null
          })
          // Redirection immédiate vers login
          router.push('/login')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      }))
      throw error
    }
  }

  const signOut = async () => {
    try {
      // Effacer l'état local immédiatement
      setAuthState({
        user: null,
        profile: null,
        permissions: null,
        loading: false,
        error: null
      })

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
    signIn,
    signOut,
    isAuthenticated: !!authState.user && !!authState.profile,
    hasPermission: (permission: keyof UserPermissions) => 
      authState.permissions?.[permission] || false
  }
}