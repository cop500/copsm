'use client'

import React, { useState, useEffect } from 'react';
import { 
  Home, Users, Building2, Calendar, FileText, Settings, 
  Search, Bell, TrendingUp, Target, Activity, AlertCircle, 
  CheckCircle, Mail, GraduationCap, Menu, X, User, LogOut, 
  PlusCircle, Send, Trash2, MessageSquare, MoreVertical
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import NotesModule from './NotesModule';
import IndicateursDashboardCards from './IndicateursDashboardCards';
import { useRole } from '@/hooks/useRole';
import { EmployabilityDashboard } from './EmployabilityDashboard';
import { getRoleLabel } from '@/utils/constants';
import NouvellesDemandesEntreprises from './NouvellesDemandesEntreprises';
import EvenementsPassesCarousel from './EvenementsPassesCarousel';

// Types
interface QuickAction {
  name: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
}

const DashboardFullPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { profile, signOut } = useAuth();
  const { isAdmin, isDirecteur } = useRole();
  const router = useRouter();

  // Actions rapides - Style professionnel éducatif
  const quickActions: QuickAction[] = [
    {
      name: 'Candidatures',
      icon: Users,
      href: '/stagiaires',
      color: 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg'
    },
    {
      name: 'Demandes entreprises',
      icon: Building2,
      href: '/dashboard-admin',
      color: 'bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg'
    },
    {
      name: 'Événements',
      icon: Calendar,
      href: '/evenements',
      color: 'bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg'
    }
  ];

  const handleNavigation = (href: string) => {
    if (isDirecteur) {
      // Pour le directeur, ajouter un paramètre pour indiquer le mode lecture seule
      router.push(`${href}?mode=lecture`);
    } else {
      router.push(href);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-white">
      {/* Header fixe - Recommandation 1 & 3 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Titre à gauche */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm">
                <img src="/logo.png" alt="Logo COP" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900">
                  Centre d'Orientation Professionnelle
                </h1>
                <p className="text-xs text-gray-500">Tableau de bord</p>
              </div>
            </div>

            {/* Avatar + infos utilisateur à droite */}
            <div className="flex items-center gap-4">
              {/* Barre de recherche */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              {/* Profil utilisateur */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.role === 'directeur' ? 'HABIB AADI' : `${profile?.prenom} ${profile?.nom}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profile?.role === 'directeur' 
                      ? 'Directeur CMC' 
                      : getRoleLabel(profile?.role || '', profile?.prenom)}
                  </p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                  {profile?.role === 'directeur' ? 'HA' : (profile?.prenom?.[0] || profile?.nom?.[0] || 'U')}
                </div>
                {!isDirecteur && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 min-w-[44px] min-h-[44px]"
                    title="Vue classique"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 min-w-[44px] min-h-[44px]"
                  title="Se déconnecter"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal - Recommandation 1: Layout asymétrique 2/3 + 1/3 */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        {/* Message de bienvenue centré */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-blue-700">Tableau de bord</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Bienvenue dans votre espace COP
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Gérez et suivez toutes vos actions en un seul endroit
          </p>
        </div>

        {/* Grid responsive KPI - Recommandation 1: 4 colonnes desktop → 2 tablette → 1 mobile */}
        <div className="mb-8">
          <IndicateursDashboardCards />
        </div>

        {/* Layout asymétrique - Recommandation 1: 2/3 gauche + 1/3 droite */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
          {/* Colonne principale - 2/3 */}
          <div className="lg:col-span-2 space-y-6 flex flex-col">
            {/* Actions rapides - Recommandation 3 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex-shrink-0">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleNavigation(action.href)}
                      className={`group relative p-5 rounded-lg ${action.color} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] min-h-[100px]`}
                    >
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="p-3 bg-white/20 rounded-lg mb-2 group-hover:bg-white/30 transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold">{action.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bilan d'Employabilité */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex-1 min-h-0 flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-900">Bilan d'Employabilité</h2>
                    <p className="text-xs text-gray-600">Métriques et performances d'insertion professionnelle</p>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto min-h-0">
                <EmployabilityDashboard />
              </div>
            </div>

            {/* Événements passés - Carousel (déplacé dans la colonne de gauche) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col flex-shrink-0" style={{ minHeight: '320px', maxHeight: '320px' }}>
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50 flex-shrink-0">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-violet-700" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-900">Événements passés</h2>
                    <p className="text-xs text-gray-600">Retour sur nos événements récents</p>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-hidden">
                <EvenementsPassesCarousel />
              </div>
            </div>

          </div>

          {/* Colonne droite - 1/3 - Recommandation 1 & 7: Zone d'Activité/Notifications */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Section 1: Nouvelles demandes d'entreprises (hauteur fixe) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col flex-shrink-0" style={{ minHeight: '400px', maxHeight: '400px' }}>
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-900">Nouvelles demandes entreprises</h2>
                    <p className="text-xs text-gray-600">Dernières demandes reçues</p>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <NouvellesDemandesEntreprises />
              </div>
            </div>

            {/* Section 3: Notes d'équipe - Alignée avec la fin du Bilan d'Employabilité */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-indigo-700" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-900">Informations & Notes d'équipe</h2>
                    <p className="text-xs text-gray-600">Partagez des informations avec l'équipe</p>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto min-h-0">
                <NotesModule />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardFullPage;
