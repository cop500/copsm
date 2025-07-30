'use client'
import { UserProvider } from '@/contexts/UserContext'
import { useAuth } from '@/hooks/useAuth'
import NotificationManager from '@/components/ui/NotificationManager'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()
  
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
          <NotificationManager>
            <main>
              {children}
            </main>
          </NotificationManager>
        </UserProvider>
      </body>
    </html>
  )
}