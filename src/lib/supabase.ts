// ========================================
// src/lib/supabase.ts - Configuration Supabase singleton (CORRIGÉ)
// ========================================

import { createClient } from '@supabase/supabase-js'
import type { UserRole, UserPermissions } from '@/types'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Instance unique (singleton)
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Client Supabase singleton
export const createSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // Un verrou d’onglet mort bloque sinon getSession/getUser indéfiniment
        // (spinner jusqu’à navigation privée / déconnexion).
        lock: async (_name, acquireTimeout, fn) => {
          if (typeof navigator === 'undefined' || !navigator.locks?.request) {
            return fn()
          }
          const timeoutMs = Math.min(acquireTimeout || 4000, 4000)
          const ac = new AbortController()
          const timer = setTimeout(() => ac.abort(), timeoutMs)
          try {
            return await navigator.locks.request(
              _name,
              { signal: ac.signal, mode: 'exclusive' },
              fn
            )
          } catch {
            return fn()
          } finally {
            clearTimeout(timer)
          }
        },
      }
    })
  }
  return supabaseInstance
}

// Export direct de l'instance pour éviter les multiples créations
export const supabase = createSupabaseClient()

// Fonction pour obtenir les permissions selon le rôle
export const getUserPermissions = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'business_developer':
      return {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canManageUsers: true,
        canAccessSettings: true,
        canExport: true
      }
    case 'manager_cop':
      return {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canManageUsers: false,
        canAccessSettings: false,
        canExport: true
      }
    case 'conseiller_cop':
      return {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canManageUsers: false,
        canAccessSettings: false,
        canExport: true
      }
    case 'conseillere_carriere':
      return {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canManageUsers: false,
        canAccessSettings: false,
        canExport: false
      }
    case 'directeur':
      return {
        canRead: true,
        canWrite: false, // Lecture seule sauf pour les notes d'équipe
        canDelete: false, // Pas de suppression sauf ses propres notes
        canManageUsers: false,
        canAccessSettings: false,
        canExport: false // Pas d'export
      }
    default:
      return {
        canRead: false,
        canWrite: false,
        canDelete: false,
        canManageUsers: false,
        canAccessSettings: false,
        canExport: false
      }
  }
}