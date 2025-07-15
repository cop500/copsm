import { UserProvider } from '@/contexts/UserContext'
import Navigation from '@/components/Navigation' // 🎯 CETTE LIGNE MANQUE
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <UserProvider>
          <Navigation />
          <main className="lg:pl-64">
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  )
}