'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, Users, Calendar, Settings, GraduationCap, Menu, X,
  LogOut, Send, FileText
} from 'lucide-react'
import { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useRole } from '@/hooks/useRole';
import Image from 'next/image';

// 🎯 NAVIGATION SIMPLE ET CLAIRE
const navigation = [
  {
    name: 'Tableau de bord',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Événements',
    href: '/evenements',
    icon: Calendar,
  },
  {
    name: 'Stagiaires',
    href: '/stagiaires',
    icon: GraduationCap,
  },
  {
    name: 'Demandes entreprises',
    href: '/dashboard-admin',
    icon: Users,
  },
  {
    name: 'Paramètres',
    href: '/parametres',
    icon: Settings,
  }
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const { currentUser } = useUser()
  const { isAdmin } = useRole();

  // Filtrer la navigation
  const filteredNavigation = navigation.filter(item => {
    if (item.name === 'Paramètres') {
      return isAdmin;
    }
    return true;
  });

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

  return (
    <>
      {/* Navigation mobile */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">COP</span>
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
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const isCurrent = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={classNames(
                      isCurrent
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-3 py-2 text-sm font-medium border-l-4 rounded-r-md'
                    )}
                  >
                    <Icon
                      className={classNames(
                        isCurrent ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
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
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo + Titre */}
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">COP</span>
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">COP CMC SM</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isCurrent = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    isCurrent
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-sm font-medium border-l-4 rounded-r-md'
                  )}
                >
                  <Icon
                    className={classNames(
                      isCurrent ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-5 w-5'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Profil utilisateur */}
          <div className="flex-shrink-0 px-4 pt-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">{getInitials()}</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{getFullName()}</p>
                <p className="text-xs text-gray-500">{currentUser?.role || 'Utilisateur'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}