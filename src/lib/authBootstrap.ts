import { supabase } from '@/lib/supabase'

export const USER_CACHE_KEY = 'cop_app_user_cache'
const AUTH_BOOT_MS = 6000

export function withTimeout<T>(promise: Promise<T>, ms = AUTH_BOOT_MS, label = 'auth'): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

export function isInvalidSessionError(error: unknown): boolean {
  const message = String(
    (error as { message?: string })?.message || error || ''
  ).toLowerCase()
  return (
    message.includes('refresh token') ||
    message.includes('invalid jwt') ||
    message.includes('jwt expired') ||
    message.includes('session missing') ||
    message.includes('not authenticated') ||
    message.includes('auth session missing') ||
    message.includes('timeout')
  )
}

export async function clearBrokenLocalSession() {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    /* session déjà morte */
  }
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(USER_CACHE_KEY)
  } catch {
    /* ignore */
  }
}
