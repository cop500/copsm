'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, Users, Building2, Calendar, FileText, Settings,
  GraduationCap, UserCheck, Mail, Bell, Menu, X,
  User, LogOut, Send, FileDown
} from 'lucide-react'
import { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useRole } from '@/hooks/useRole';
import Image from 'next/image';

// 🎯 NAVIGATION MISE À JOUR (suppression des onglets non utilisés)
const navigation = [
  {
    name: 'Tableau de bord',
    href: '/dashboard',
    icon: Home,
    current: false
  },
  {
    name: 'Entreprises',
    href: '/entreprises',
    icon: Building2,
    current: false
  },
  {
    name: 'Événements',
    href: '/evenements',
    icon: Calendar,
    current: false
  },
  {
    name: 'Stagiaires',
    href: '/stagiaires',
    icon: GraduationCap,
    current: false
  },
  {
    name: 'Candidature',
    href: '/candidature',
    icon: Send,
    current: false
  },
  {
    name: 'CV envoyés',
    href: '/cv-envoyes',
    icon: FileDown,
    current: false
  },
  {
    name: 'Demandes entreprises',
    href: '/dashboard-admin',
    icon: Users,
    current: false
  },
  {
    name: 'Paramètres',
    href: '/parametres',
    icon: Settings,
    current: false
  }
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  
  const { currentUser, isLoading } = useUser()
  const { isAdmin, role } = useRole();

  // Mise à jour de l'état "current" basé sur le pathname
  const navigationWithCurrent = navigation
    .filter(item => item.name !== 'Paramètres' || isAdmin) // Onglet Paramètres seulement pour admin
    .map(item => ({
      ...item,
      current: pathname === item.href
    }))

  // 🎯 FONCTION POUR GÉRER LA DÉCONNEXION
  const handleLogout = async () => {
    if (window.confirm('Se déconnecter ?')) {
      try {
        const { supabase } = await import('@/lib/supabase')
        await supabase.auth.signOut()
        window.location.href = '/login'
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
        window.location.href = '/login'
      }
    }
  }

  // 🎯 GÉNÉRATION DES INITIALES
  const getInitials = () => {
    if (!currentUser) return 'COP'
    const prenom = currentUser.prenom?.charAt(0) || ''
    const nom = currentUser.nom?.charAt(0) || ''
    return (prenom + nom) || 'U'
  }

  // 🎯 NOM COMPLET DE L'UTILISATEUR
  const getFullName = () => {
    if (!currentUser) return 'Utilisateur'
    return `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() || 'Utilisateur'
  }

  // 🎯 RÔLE DE L'UTILISATEUR
  const getUserRole = () => {
    if (!currentUser) return 'Utilisateur'
    
    switch (currentUser.role) {
      case 'business_developer':
        return 'Administrateur'
      case 'manager_cop':
        return 'Manager COP'
      case 'conseiller_cop':
        return 'Conseiller COP'
      case 'conseillere_carriere':
        return 'Conseillère Carrière'
      default:
        return currentUser.poste || 'Utilisateur'
    }
  }

  return (
    <>
      {/* Navigation mobile */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                <Image src="/cop-logo.svg" alt="Logo COP" width={32} height={32} />
              </div>
            </div>
            <h1 className="ml-3 text-xl font-semibold text-gray-900">COP SM</h1>
          </div>
          <button
            type="button"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="bg-white border-r border-gray-200">
            <nav className="px-4 py-2 space-y-1">
              {navigationWithCurrent.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={classNames(
                      item.current
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-3 py-2 text-sm font-medium border-l-4 rounded-r-md'
                    )}
                  >
                    <Icon
                      className={classNames(
                        item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Navigation desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-white via-gray-50 to-gray-200/80 backdrop-blur-md border-r border-gray-200 pt-7 pb-6 px-2 shadow-xl rounded-r-3xl overflow-y-auto transition-all duration-300">
          {/* Logo + Titre */}
          <div className="flex items-center flex-shrink-0 px-4 mb-8 gap-3">
            <Image src="https://www.myway.ac.ma/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-myway.489d146c.png&w=256&q=75" alt="Logo MyWay" width={48} height={48} className="rounded-xl shadow-lg border-2 border-white/60" />
            <span className="text-2xl font-extrabold tracking-wider font-sans uppercase bg-gradient-to-r from-blue-500 via-purple-500 to-blue-700 bg-clip-text text-transparent drop-shadow-xl flex items-center">
              COP CMC SM
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-400 text-xs font-bold text-white shadow-md animate-pulse border border-white/30">Nouveau</span>
            </span>
          </div>
          {/* Décoration : ligne dégradée */}
          <div className="px-4 mb-8">
            <div className="h-1 rounded bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 opacity-80" />
          </div>
          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-2">
            {navigationWithCurrent.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-4 px-5 py-3 rounded-xl font-bold text-base uppercase tracking-wider transition-all duration-200 relative
                    ${item.current ? 'bg-gradient-to-r from-blue-500/90 to-purple-500/90 text-white shadow-2xl scale-105 ring-2 ring-blue-400/60' : 'text-blue-800 hover:bg-blue-50 hover:scale-105'}
                  `}
                  style={{ boxShadow: item.current ? '0 6px 32px 0 rgba(80,80,200,0.18)' : undefined }}
                >
                  <span className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                    ${item.current ? 'bg-white/30 text-blue-700 shadow-lg ring-2 ring-blue-300/60 animate-glow' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200 group-hover:text-blue-800'}`}
                  >
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="tracking-wider drop-shadow-sm">{item.name}</span>
                  {item.current && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 via-purple-400 to-blue-400 rounded-full animate-pulse shadow-lg" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Barre de notification */}
      {/* Je ne réaffiche pas la barre supérieure dans la version mobile non plus */}
      {/* Profil utilisateur (en bas de la sidebar) */}
      <div className="mt-auto px-4 pt-8">
        <div className="flex items-center gap-3 bg-white rounded-xl shadow p-3">
          {/* ... avatar ... */}
          <div>
            <div className="font-bold text-[#1D3557]">{getFullName()}</div>
            <div className="text-xs text-gray-500">{getUserRole()}</div>
            <div className="text-xs text-red-500 mt-1">role: {role}</div>
          </div>
        </div>
      </div>
    </>
  )
}