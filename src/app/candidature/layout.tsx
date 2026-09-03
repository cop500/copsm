import type { Metadata, Viewport } from 'next'
import './candidature-kiosk.css'

export const metadata: Metadata = {
  title: 'Candidatures — COP CMC Souss-Massa',
  description: 'Déposez votre candidature aux offres d\'emploi et de stage',
}

/** Optimisé écrans tactiles / i3TOUCH (Android 8, grands formats). */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 2,
  userScalable: true,
  themeColor: '#0f3d6c',
}

export default function CandidatureLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="candidature-page" data-kiosk="true">
      {children}
    </div>
  )
}
