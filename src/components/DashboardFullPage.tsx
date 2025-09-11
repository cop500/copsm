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
  const { isAdmin } = useRole();
  const router = useRouter();

  // Actions rapides
  const quickActions: QuickAction[] = [
    {
      name: 'Candidatures',
      icon: Users,
      href: '/stagiaires',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      name: 'Demandes entreprises',
      icon: Building2,
      href: '/dashboard-admin',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      name: 'Événements',
      icon: Calendar,
      href: '/evenements',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    }
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation */}
      <header className="bg-white shadow-2xl border-b border-gray-300 relative z-50 overflow-hidden">
        {/* Motifs décoratifs du header */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.6) 3px, transparent 3px),
              radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.6) 3px, transparent 3px),
              linear-gradient(45deg, transparent 48%, rgba(156, 163, 175, 0.4) 49%, rgba(156, 163, 175, 0.4) 51%, transparent 52%),
              linear-gradient(-45deg, transparent 48%, rgba(156, 163, 175, 0.4) 49%, rgba(156, 163, 175, 0.4) 51%, transparent 52%)
            `,
            backgroundSize: '40px 40px, 60px 60px, 30px 30px, 30px 30px',
            backgroundPosition: '0 0, 20px 20px, 0 0, 15px 15px'
          }}
        ></div>
        
        {/* Lignes décoratives subtiles */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        ></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="Logo MyWay" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black text-black">Centre d'Orientation Professionnelle</h1>
                <p className="text-sm font-bold text-black">Tableau de bord</p>
              </div>
            </div>

            {/* Navigation et actions simplifiées */}
            <div className="flex items-center space-x-6">
              {/* Barre de recherche centrée */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Profil utilisateur et actions */}
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-black">
                    {profile?.prenom} {profile?.nom}
                  </p>
                  <p className="text-xs font-bold text-black capitalize">
                    {profile?.role?.replace('_', ' ')}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {profile?.prenom?.[0] || profile?.nom?.[0] || 'U'}
                </div>
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Vue classique avec sidebar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative pb-20">
        {/* Background avec photo */}
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/background4.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.8
          }}
        ></div>
        {/* Overlay clair pour éclaircir l'image */}
        <div className="fixed inset-0 bg-white/10 pointer-events-none"></div>
        {/* Overlay beige très subtil */}
        <div className="fixed inset-0 bg-gradient-to-br from-amber-50/10 via-stone-50/5 to-orange-50/10 pointer-events-none"></div>
        
        {/* Motifs géométriques pour l'aspect tableau de bord */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(45deg, transparent 48%, rgba(156, 163, 175, 0.05) 49%, rgba(156, 163, 175, 0.05) 51%, transparent 52%),
              linear-gradient(-45deg, transparent 48%, rgba(156, 163, 175, 0.05) 49%, rgba(156, 163, 175, 0.05) 51%, transparent 52%)
            `,
            backgroundSize: '60px 60px, 80px 80px, 40px 40px, 40px 40px',
            backgroundPosition: '0 0, 30px 30px, 0 0, 20px 20px'
          }}
        ></div>
        
        {/* Lignes de grille subtiles */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(156, 163, 175, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(156, 163, 175, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        ></div>
        
        {/* Points de connexion */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-15"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.2) 2px, transparent 2px),
              radial-gradient(circle at 75% 25%, rgba(16, 185, 129, 0.2) 2px, transparent 2px),
              radial-gradient(circle at 25% 75%, rgba(168, 85, 247, 0.2) 2px, transparent 2px),
              radial-gradient(circle at 75% 75%, rgba(245, 158, 11, 0.2) 2px, transparent 2px)
            `,
            backgroundSize: '200px 200px, 200px 200px, 200px 200px, 200px 200px'
          }}
        ></div>
        
        {/* Contenu avec z-index pour être au-dessus du background */}
        <div className="relative z-10">
          {/* Message de bienvenue */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Bienvenue dans votre espace COP ! 👋</h1>
            <p className="text-xl font-bold text-black bg-white/80 backdrop-blur-sm rounded-lg px-6 py-3 inline-block shadow-lg border-2 border-black/20">
              Voici un aperçu des indicateurs clés et actions rapides
            </p>
          </div>

          {/* Actions rapides */}
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl border-2 border-black/30">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="w-6 h-6 text-blue-600 mr-3" />
                Actions rapides
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleNavigation(action.href)}
                      className={`p-6 rounded-2xl text-white ${action.color} transition-all duration-300 flex flex-col items-center text-center group hover:scale-105 hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-white/20`}
                    >
                      <Icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold">{action.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Indicateurs dynamiques */}
          <div className="mb-8">
            <IndicateursDashboardCards />
          </div>

          {/* Bilan d'Employabilité */}
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl border-2 border-black/30">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 text-green-600 mr-3" />
                Bilan d'Employabilité
              </h3>
              <EmployabilityDashboard />
            </div>
          </div>

          {/* Notes d'équipe */}
          <div className="relative mt-4 mb-8">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 shadow-xl border-2 border-black/30 min-h-[200px]">
              <NotesModule />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardFullPage;
