'use client'

import type { ReactNode } from 'react'
import {
  BarChart3,
  Clapperboard,
  ShieldCheck,
  Sparkles,
  Star,
  Video,
} from 'lucide-react'
import { COP_LOGO_URL, FORMATEUR_LOGIN_BG } from '@/lib/videoPortalAssets'

export type VideoPortalVariant = 'formateur' | 'candidat'

interface VideoPortalLayoutProps {
  children: ReactNode
  badge?: string
  title?: string
  subtitle?: string
  showHero?: boolean
  footer?: ReactNode
  variant?: VideoPortalVariant
  wide?: boolean
}

function FloatingDecor({ variant }: { variant: VideoPortalVariant }) {
  const MainIcon = variant === 'candidat' ? Video : Clapperboard

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute top-[12%] left-[8%] animate-portal-float opacity-20">
        <MainIcon className="w-16 h-16 text-white" strokeWidth={1.2} />
      </div>
      <div className="absolute top-[22%] right-[10%] animate-portal-float-delayed opacity-15">
        <BarChart3 className="w-14 h-14 text-cyan-200" strokeWidth={1.2} />
      </div>
      <div
        className="absolute bottom-[28%] left-[12%] animate-portal-float opacity-20"
        style={{ animationDelay: '0.5s' }}
      >
        <Star className="w-12 h-12 text-amber-200" strokeWidth={1.2} />
      </div>
      <div className="absolute bottom-[18%] right-[14%] animate-portal-float-slow opacity-15">
        <Sparkles className="w-10 h-10 text-white" strokeWidth={1.2} />
      </div>

      <svg
        className="absolute bottom-0 left-0 w-full h-40 opacity-25"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,80 C240,20 480,100 720,60 C960,20 1200,90 1440,40 L1440,120 L0,120 Z"
          fill="rgba(255,255,255,0.12)"
        />
        <path
          d="M0,95 C320,55 640,110 960,70 C1200,40 1320,85 1440,65 L1440,120 L0,120 Z"
          fill="rgba(56,189,248,0.08)"
        />
      </svg>

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  )
}

function defaultFooter(variant: VideoPortalVariant) {
  if (variant === 'candidat') {
    return (
      <p className="inline-flex items-center gap-2 text-xs text-blue-100/70">
        <ShieldCheck className="w-3.5 h-3.5" />
        1 dépôt par CINE — vidéo de 2 minutes maximum
      </p>
    )
  }
  return (
    <p className="inline-flex items-center gap-2 text-xs text-blue-100/70">
      <ShieldCheck className="w-3.5 h-3.5" />
      Vos évaluations sont sécurisées et confidentielles
    </p>
  )
}

export default function VideoPortalLayout({
  children,
  badge,
  title,
  subtitle,
  showHero = true,
  footer,
  variant = 'formateur',
  wide = false,
}: VideoPortalLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url('${FORMATEUR_LOGIN_BG}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#041a33]/92 via-[#0a3560]/88 to-[#0f4c81]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(15,61,108,0.35),transparent_50%)]" />

      <FloatingDecor variant={variant} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-4 sm:px-8 pt-6 pb-2">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg shadow-black/10 border border-white/40">
              <img
                src={COP_LOGO_URL}
                alt="CMC Souss-Massa — Centre d'Orientation Professionnelle COP"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>
            {badge && (
              <span className="shrink-0 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] bg-gradient-to-r from-amber-300 to-amber-400 text-slate-900 px-4 py-2 rounded-full shadow-lg shadow-amber-500/20">
                {badge}
              </span>
            )}
          </div>
        </header>

        {showHero && (title || subtitle) && (
          <div className="text-center px-4 pt-4 pb-6">
            {title && (
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-sm">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-blue-100/85 mt-2 text-sm sm:text-base max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <main className="flex-1 px-4 sm:px-8 pb-8">
          <div className={`mx-auto ${wide ? 'max-w-[90rem]' : 'max-w-6xl'}`}>{children}</div>
        </main>

        <footer className="px-4 pb-6 text-center">
          {footer ?? defaultFooter(variant)}
        </footer>
      </div>
    </div>
  )
}
