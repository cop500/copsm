'use client'

import { useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

// Pages publiques qui ne nécessitent pas d'authentification
const PUBLIC_PAGES = [
  '/login',
  '/enquete-insertion/public',
  '/cv-connect/public',
  '/candidature',
  '/inscription-ateliers',
  '/evenements',
  '/ambassadeurs',
  '/visites-jpo',
  '/portes',
  '/assistance-stagiaires',
  '/certificat',
]

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname()
  const { loading, user, profile } = useAuth()
  const authed = Boolean(user || profile)

  // Mémoriser le calcul pour éviter les re-renders
  const isPublicPage = useMemo(() => {
    return PUBLIC_PAGES.some(page => pathname?.startsWith(page))
  }, [pathname])

  useEffect(() => {
    if (isPublicPage || loading || authed) return
    window.location.replace('/login/')
  }, [isPublicPage, loading, authed])

  if (isPublicPage) {
    return <>{children}</>
  }

  if (loading && !authed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}

