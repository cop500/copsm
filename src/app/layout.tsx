'use client'
import { UserProvider } from '@/contexts/UserContext'
import { useAuth } from '@/hooks/useAuth'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <html lang="fr">
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