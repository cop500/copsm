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
  const { isAdmin, isDirecteur } = useRole();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header moderne et élégant */}
      <header className="bg-gradient-to-r from-white via-blue-50/40 to-indigo-50/60 shadow-2xl border-b border-blue-100/50 backdrop-blur-md relative z-50 overflow-hidden">
        {/* Motifs décoratifs modernes */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full blur-sm"></div>
          <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-400 rounded-full blur-sm"></div>
          <div className="absolute bottom-4 left-1/4 w-1 h-1 bg-cyan-400 rounded-full blur-sm"></div>
          <div className="absolute bottom-4 right-1/4 w-1 h-1 bg-blue-300 rounded-full blur-sm"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre modernes */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                <img src="/logo.png" alt="Logo MyWay" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Centre d'Orientation Professionnelle
                </h1>
                <p className="text-sm font-bold text-gray-600">Tableau de bord</p>
              </div>
            </div>

            {/* Navigation et actions simplifiées */}
            <div className="flex items-center space-x-6">
              {/* Barre de recherche moderne */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 shadow-lg transition-all duration-200 placeholder-gray-400"
                />
              </div>

              {/* Profil utilisateur et actions modernes */}
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-800">
                    {profile?.role === 'directeur' ? 'HABIB AADI' : `${profile?.prenom} ${profile?.nom}`}
                  </p>
                  <p className="text-xs font-semibold text-gray-600 capitalize">
                    {profile?.role === 'directeur' ? 'Directeur CMC' : profile?.role?.replace('_', ' ')}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {profile?.role === 'directeur' ? 'HA' : (profile?.prenom?.[0] || profile?.nom?.[0] || 'U')}
                </div>
                      {!isDirecteur && (
                        <button
                          onClick={() => router.push('/dashboard')}
                          className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all duration-200 shadow-sm"
                          title="Vue classique avec sidebar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                        </button>
                      )}
                <button
                  onClick={handleSignOut}
                  className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all duration-200 shadow-sm"
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
        {/* Background moderne et élégant */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 pointer-events-none"></div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent pointer-events-none"></div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-100/25 via-transparent to-transparent pointer-events-none"></div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-50/15 via-transparent to-blue-50/10 pointer-events-none"></div>
        
        {/* Motifs décoratifs colorés et vibrants */}
        <div className="fixed inset-0 opacity-20 pointer-events-none">
          {/* Cercles colorés flous */}
          <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-32 w-32 h-32 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-2xl"></div>
          <div className="absolute bottom-32 left-40 w-36 h-36 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-3xl opacity-40"></div>
          
          {/* Formes géométriques colorées */}
          <div className="absolute top-32 left-1/4 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg blur-xl transform rotate-45"></div>
          <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-lg"></div>
          <div className="absolute top-1/3 right-20 w-12 h-12 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full blur-md"></div>
          <div className="absolute bottom-1/4 left-1/3 w-14 h-14 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-lg blur-lg transform rotate-12"></div>
        </div>
        
        {/* Motifs géométriques colorés et vibrants */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.6) 3px, transparent 3px),
              radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.6) 3px, transparent 3px),
              radial-gradient(circle at 40% 60%, rgba(168, 85, 247, 0.6) 3px, transparent 3px),
              radial-gradient(circle at 60% 40%, rgba(245, 158, 11, 0.6) 3px, transparent 3px),
              radial-gradient(circle at 10% 70%, rgba(236, 72, 153, 0.6) 3px, transparent 3px),
              radial-gradient(circle at 90% 30%, rgba(34, 197, 94, 0.6) 3px, transparent 3px),
              radial-gradient(circle at 70% 80%, rgba(251, 146, 60, 0.6) 3px, transparent 3px),
              radial-gradient(circle at 30% 10%, rgba(139, 92, 246, 0.6) 3px, transparent 3px)
            `,
            backgroundSize: '120px 120px, 150px 150px, 100px 100px, 130px 130px, 110px 110px, 140px 140px, 125px 125px, 135px 135px',
            backgroundPosition: '0 0, 60px 60px, 30px 30px, 90px 90px, 45px 45px, 75px 75px, 15px 15px, 105px 105px'
          }}
        ></div>
        
        {/* Lignes de connexion colorées et dynamiques */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(45deg, rgba(59, 130, 246, 0.4) 2px, transparent 2px),
              linear-gradient(-45deg, rgba(16, 185, 129, 0.4) 2px, transparent 2px),
              linear-gradient(90deg, rgba(168, 85, 247, 0.4) 2px, transparent 2px),
              linear-gradient(0deg, rgba(245, 158, 11, 0.4) 2px, transparent 2px),
              linear-gradient(30deg, rgba(236, 72, 153, 0.4) 1px, transparent 1px),
              linear-gradient(-30deg, rgba(34, 197, 94, 0.4) 1px, transparent 1px),
              linear-gradient(60deg, rgba(251, 146, 60, 0.4) 1px, transparent 1px),
              linear-gradient(-60deg, rgba(139, 92, 246, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px, 100px 100px, 60px 60px, 70px 70px, 90px 90px, 110px 110px, 85px 85px, 95px 95px',
            backgroundPosition: '0 0, 40px 40px, 20px 20px, 50px 50px, 25px 25px, 65px 65px, 10px 10px, 55px 55px'
          }}
        ></div>
        
        {/* Motifs hexagonaux colorés et vibrants */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-18"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.4) 4px, transparent 4px),
              radial-gradient(circle at 75% 25%, rgba(16, 185, 129, 0.4) 4px, transparent 4px),
              radial-gradient(circle at 25% 75%, rgba(168, 85, 247, 0.4) 4px, transparent 4px),
              radial-gradient(circle at 75% 75%, rgba(245, 158, 11, 0.4) 4px, transparent 4px),
              radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.4) 4px, transparent 4px),
              radial-gradient(circle at 10% 50%, rgba(236, 72, 153, 0.4) 4px, transparent 4px),
              radial-gradient(circle at 90% 50%, rgba(34, 197, 94, 0.4) 4px, transparent 4px),
              radial-gradient(circle at 50% 10%, rgba(251, 146, 60, 0.4) 4px, transparent 4px),
              radial-gradient(circle at 50% 90%, rgba(139, 92, 246, 0.4) 4px, transparent 4px)
            `,
            backgroundSize: '200px 200px, 200px 200px, 200px 200px, 200px 200px, 200px 200px, 200px 200px, 200px 200px, 200px 200px, 200px 200px'
          }}
        ></div>
        
        {/* Grille de points connectés colorés */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 0 0, rgba(59, 130, 246, 0.5) 2px, transparent 2px),
              radial-gradient(circle at 50px 50px, rgba(16, 185, 129, 0.5) 2px, transparent 2px),
              radial-gradient(circle at 100px 0, rgba(168, 85, 247, 0.5) 2px, transparent 2px),
              radial-gradient(circle at 0 100px, rgba(245, 158, 11, 0.5) 2px, transparent 2px),
              radial-gradient(circle at 100px 100px, rgba(6, 182, 212, 0.5) 2px, transparent 2px),
              radial-gradient(circle at 25px 25px, rgba(236, 72, 153, 0.5) 2px, transparent 2px),
              radial-gradient(circle at 75px 75px, rgba(34, 197, 94, 0.5) 2px, transparent 2px),
              radial-gradient(circle at 25px 75px, rgba(251, 146, 60, 0.5) 2px, transparent 2px),
              radial-gradient(circle at 75px 25px, rgba(139, 92, 246, 0.5) 2px, transparent 2px)
            `,
            backgroundSize: '100px 100px'
          }}
        ></div>
        
        {/* Motifs de vagues colorées */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-15"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 20%, rgba(59, 130, 246, 0.3) 20px, transparent 20px),
              radial-gradient(ellipse at 80% 80%, rgba(16, 185, 129, 0.3) 25px, transparent 25px),
              radial-gradient(ellipse at 40% 60%, rgba(168, 85, 247, 0.3) 18px, transparent 18px),
              radial-gradient(ellipse at 60% 40%, rgba(245, 158, 11, 0.3) 22px, transparent 22px),
              radial-gradient(ellipse at 10% 70%, rgba(236, 72, 153, 0.3) 16px, transparent 16px),
              radial-gradient(ellipse at 90% 30%, rgba(34, 197, 94, 0.3) 24px, transparent 24px)
            `,
            backgroundSize: '300px 300px, 350px 350px, 280px 280px, 320px 320px, 260px 260px, 340px 340px',
            backgroundPosition: '0 0, 150px 150px, 75px 75px, 225px 225px, 37px 37px, 187px 187px'
          }}
        ></div>
        
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
          {/* Message de bienvenue moderne */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Bienvenue dans votre espace COP ! 
              <span className="ml-3 text-4xl">👋</span>
            </h1>
            <p className="text-xl font-bold text-gray-700 bg-white/90 backdrop-blur-md rounded-2xl px-8 py-4 inline-block shadow-2xl border border-blue-100/50">
              Voici un aperçu des indicateurs clés et actions rapides
            </p>
          </div>

          {/* Actions rapides modernes */}
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-blue-100/30 relative overflow-hidden">
              {/* Effet de brillance */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-gray-900 mb-8 flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mr-4 shadow-lg">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Actions rapides
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleNavigation(action.href)}
                        className={`p-8 rounded-3xl text-white ${action.color} transition-all duration-500 flex flex-col items-center text-center group hover:scale-110 hover:shadow-2xl hover:-translate-y-2 border-2 border-transparent hover:border-white/30 relative overflow-hidden`}
                      >
                        {/* Effet de brillance au survol */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        
                        <div className="relative z-10">
                          <div className="p-4 bg-white/20 rounded-2xl mb-4 group-hover:bg-white/30 transition-all duration-300">
                            <Icon className="w-10 h-10 group-hover:scale-125 transition-transform duration-300" />
                          </div>
                          <span className="text-base font-bold group-hover:text-lg transition-all duration-300">{action.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Indicateurs dynamiques */}
          <div className="mb-8">
            <IndicateursDashboardCards />
          </div>

          {/* Bilan d'Employabilité moderne */}
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-green-100/30 relative overflow-hidden">
              {/* Effet de brillance vert */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-gray-900 mb-8 flex items-center">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mr-4 shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Bilan d'Employabilité
                  </span>
                </h3>
                <EmployabilityDashboard />
              </div>
            </div>
          </div>

          {/* Notes d'équipe modernes */}
          <div className="relative mt-4 mb-8">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-purple-100/30 relative overflow-hidden min-h-[200px]">
              {/* Effet de brillance violet */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500"></div>
              
              <div className="relative z-10">
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
