'use client'
import { memo } from 'react'
import { UserProvider } from '@/contexts/UserContext'
import AuthGuard from '@/components/AuthGuard'
import './globals.css'

// Mémoriser le layout pour éviter les re-renders inutiles
const RootLayout = memo(function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>
        <UserProvider>
          <AuthGuard>
            <main>
              {children}
            </main>
          </AuthGuard>
        </UserProvider>
      </body>
    </html>
  )
})

export default RootLayout