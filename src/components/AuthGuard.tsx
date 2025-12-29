'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

// Pages publiques qui ne nécessitent pas d'authentification
const PUBLIC_PAGES = [
  '/login',
  '/enquete-insertion/public',
  '/enquete-satisfaction',
  '/cv-connect/public',
  '/candidature',
  '/inscription-ateliers',
  '/evenements',
  '/ambassadeurs'
]

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname()
  const { loading } = useAuth()

  // Mémoriser le calcul pour éviter les re-renders
  const isPublicPage = useMemo(() => {
    return PUBLIC_PAGES.some(page => pathname?.startsWith(page))
  }, [pathname])

  // Pour les pages publiques, ne pas bloquer le rendu
  if (isPublicPage) {
    return <>{children}</>
  }

  // Pour les pages privées, attendre l'authentification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}

