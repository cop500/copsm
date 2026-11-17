'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Users,
  Building2,
  Calendar,
  LogOut,
  ClipboardList,
  TrendingUp,
  Settings,
  MapPin,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import IndicateursDashboardCards from './IndicateursDashboardCards'
import { useRole } from '@/hooks/useRole'
import { EmployabilityDashboard } from './EmployabilityDashboard'
import { getRoleLabel } from '@/utils/constants'
import NouvellesDemandesEntreprises from './NouvellesDemandesEntreprises'
import EvenementsPassesCarousel from './EvenementsPassesCarousel'

const NAVY = '#0f3d6c'
const TZ = 'Africa/Casablanca'

const LIGNES = [
  'Chaque entretien ouvre un métier.',
  'Orienter. Accompagner. Connecter.',
  'Le COP, un bureau ouvert sur la région.',
]

function maintenantMaroc() {
  const now = new Date()
  const heure = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(now)
  )
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'
  const date = now.toLocaleDateString('fr-FR', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const heureStr = now.toLocaleTimeString('fr-FR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return { salut, date, heureStr }
}

const DashboardFullPage: React.FC = () => {
  const { profile, signOut } = useAuth()
  const { isAdmin, isDirecteur, isManager } = useRole()
  const router = useRouter()
  const canAccessAdmission = isAdmin || isManager
  const [horloge, setHorloge] = useState(maintenantMaroc)
  const [ligne, setLigne] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => setHorloge(maintenantMaroc()), 30000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    const t = window.setInterval(() => setLigne((i) => (i + 1) % LIGNES.length), 5600)
    return () => window.clearInterval(t)
  }, [])

  const prenomAffiche = profile?.role === 'directeur' ? 'Habib' : profile?.prenom || ''
  const nomAffiche = profile?.role === 'directeur' ? 'Aadi' : profile?.nom || ''
  const roleAffiche =
    profile?.role === 'directeur'
      ? 'Directeur CMC'
      : getRoleLabel(profile?.role || '', profile?.prenom)
  const initiales =
    profile?.role === 'directeur'
      ? 'HA'
      : `${prenomAffiche?.[0] || ''}${nomAffiche?.[0] || ''}`.toUpperCase() || 'U'

  const quickActions = useMemo(
    () => [
      {
        name: 'Candidatures',
        hint: 'Offres partenaires et CV',
        icon: Users,
        href: '/stagiaires',
      },
      ...(canAccessAdmission
        ? [
            {
              name: 'Admission',
              hint: 'Parcours et dossiers',
              icon: ClipboardList,
              href: '/admission',
            },
          ]
        : []),
      {
        name: 'Demandes',
        hint: 'Entreprises qui sollicitent le COP',
        icon: Building2,
        href: '/dashboard-admin',
      },
      {
        name: 'Événements',
        hint: 'Ateliers, JPO, ambassadeurs',
        icon: Calendar,
        href: '/evenements',
      },
      ...(isAdmin
        ? [
            {
              name: 'Visites entreprises',
              hint: 'Annuaire partenaires et visites',
              icon: MapPin,
              href: '/entreprises-gestion/',
            },
          ]
        : []),
    ],
    [canAccessAdmission, isAdmin]
  )

  const handleNavigation = (href: string) => {
    if (isDirecteur) router.push(`${href}?mode=lecture`)
    else router.push(href)
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-slate-800">
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 0% -10%, rgba(15,61,108,0.12), transparent 55%), radial-gradient(ellipse 50% 30% at 100% 0%, rgba(15,61,108,0.08), transparent 50%)',
        }}
      />

      <header className="sticky top-0 z-50 border-b border-[#0f3d6c]/15 bg-[#0f3d6c] text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/cop-space-logo.jpg" alt="COP Space" className="h-10 w-auto rounded-md bg-white object-contain p-0.5" />
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold tracking-wide">COP Space</p>
              <p className="text-[11px] text-white/70">CMC Souss-Massa</p>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center leading-none">
            <span className="font-serif text-xl tabular-nums tracking-wide">{horloge.heureStr}</span>
            <span className="mt-1 text-[11px] capitalize text-white/70">{horloge.date}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right lg:block">
              <p className="text-sm font-medium">
                {prenomAffiche} {nomAffiche}
              </p>
              <p className="text-[11px] text-white/70">{roleAffiche}</p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold"
              style={{ color: NAVY }}
            >
              {initiales}
            </div>
            {isAdmin && (
              <button
                onClick={() => handleNavigation('/parametres')}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
                title="Paramètres"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => void signOut()}
              className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
              title="Se déconnecter"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#0f3d6c]/70">
              Votre bureau
            </p>
            <h1 className="mt-2 font-serif text-3xl text-[#0f3d6c] sm:text-4xl">
              {horloge.salut}
              {prenomAffiche ? `, ${prenomAffiche}` : ''}.
            </h1>
            <p
              key={ligne}
              className="cop-ligne mt-2 min-h-[1.5rem] text-sm italic text-slate-600"
            >
              {LIGNES[ligne]}
            </p>
          </div>
          <p className="text-sm text-slate-500 md:hidden capitalize">{horloge.date}</p>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.href}
                type="button"
                onClick={() => handleNavigation(action.href)}
                className="group flex items-start gap-3 rounded-2xl border border-[#0f3d6c]/10 bg-white p-4 text-left shadow-[0_1px_0_rgba(15,61,108,0.06)] transition hover:-translate-y-0.5 hover:border-[#0f3d6c]/30 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f3d6c] text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#0f3d6c]">{action.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{action.hint}</span>
                </span>
              </button>
            )
          })}
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border border-[#0f3d6c]/10 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
            <Calendar className="h-4 w-4 text-[#0f3d6c]" />
            <div>
              <h2 className="text-sm font-semibold text-[#0f3d6c]">Mémoire du COP</h2>
              <p className="text-xs text-slate-500">Événements déjà réalisés</p>
            </div>
          </div>
          <div className="p-5" style={{ minHeight: 280 }}>
            <EvenementsPassesCarousel />
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-[#0f3d6c]/10 bg-white lg:col-span-2">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
              <TrendingUp className="h-4 w-4 text-[#0f3d6c]" />
              <div>
                <h2 className="text-sm font-semibold text-[#0f3d6c]">Bilan d’employabilité</h2>
                <p className="text-xs text-slate-500">Insertion et performances</p>
              </div>
            </div>
            <div className="p-5">
              <EmployabilityDashboard />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-2xl border border-[#0f3d6c]/10 bg-white">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
                <Building2 className="h-4 w-4 text-[#0f3d6c]" />
                <div>
                  <h2 className="text-sm font-semibold text-[#0f3d6c]">File des demandes</h2>
                  <p className="text-xs text-slate-500">Priorité : en attente, puis en cours</p>
                </div>
              </div>
              <div className="p-5">
                <NouvellesDemandesEntreprises limite={8} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#0f3d6c]/10 bg-white p-5">
          <IndicateursDashboardCards />
        </div>
      </main>

      <style>{`
        @keyframes copLigne {
          0% { opacity: 0; transform: translateY(6px); }
          14% { opacity: 1; transform: translateY(0); }
          82% { opacity: 1; }
          100% { opacity: 0; }
        }
        .cop-ligne { animation: copLigne 5.4s ease; }
      `}</style>
    </div>
  )
}

export default DashboardFullPage
