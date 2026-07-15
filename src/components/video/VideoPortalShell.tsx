import type { ReactNode } from 'react'

interface VideoPortalShellProps {
  title: string
  subtitle: string
  badge?: string
  children: ReactNode
  footer?: ReactNode
  variant?: 'candidate' | 'formateur'
}

export default function VideoPortalShell({
  title,
  subtitle,
  badge,
  children,
  footer,
  variant = 'candidate',
}: VideoPortalShellProps) {
  const accent =
    variant === 'formateur'
      ? 'from-slate-900 via-[#0f3d6c] to-[#1a5a96]'
      : 'from-[#0a2f52] via-[#0f3d6c] to-[#2d6ba8]'

  return (
    <div className={`min-h-screen bg-gradient-to-br ${accent}`}>
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_45%),radial-gradient(circle_at_80%_0%,white_0,transparent_35%)] pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <header className="text-center text-white mb-8">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <img src="/cop-logo.svg" alt="OFPPT" className="w-7 h-7 object-contain" />
            </div>
            <div className="text-left">
              <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100/90">
                OFPPT — Présélection
              </p>
              <p className="text-sm font-medium">Vidéo présentative</p>
            </div>
          </div>
          {badge && (
            <span className="inline-block mb-3 text-xs font-semibold uppercase tracking-wider bg-amber-400/90 text-slate-900 px-3 py-1 rounded-full">
              {badge}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-blue-100/90 mt-2 text-sm sm:text-base max-w-2xl mx-auto">
            {subtitle}
          </p>
        </header>

        <main>{children}</main>

        {footer && <footer className="mt-8 text-center text-blue-100/70 text-xs">{footer}</footer>}
      </div>
    </div>
  )
}
