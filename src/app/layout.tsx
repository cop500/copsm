'use client'
import { UserProvider } from '@/contexts/UserContext'
import { useAuth } from '@/hooks/useAuth'
import { usePathname } from 'next/navigation'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { loading } = useAuth()
  
  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPages = ['/enquete-satisfaction', '/cv-connect/public', '/candidature', '/inscription-ateliers', '/evenements']
  const isPublicPage = publicPages.some(page => pathname?.startsWith(page))
  
  // Pour les pages publiques, ne pas bloquer le rendu mais garder le UserProvider
  if (isPublicPage) {
    return (
      <html lang="fr">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </head>
        <body>
          <UserProvider>
            <main>
              {children}
            </main>
          </UserProvider>
        </body>
      </html>
    )
  }
  
  // Pour les pages privées, attendre l'authentification
  if (loading) {
    return (
      <html lang="fr">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </head>
        <body>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </body>
      </html>
    )
  }
  
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>
        <UserProvider>
          <main>
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  )
}