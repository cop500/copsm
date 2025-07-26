'use client'

import React, { useState } from 'react';
import { 
  Home, Users, Building2, Calendar, FileText, Settings, Search, Bell,
  TrendingUp, Target, Activity, AlertCircle, CheckCircle, Mail,
  GraduationCap, Menu, X, User, LogOut, PlusCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import NotesModule from './NotesModule';
import { useIndicateursDashboard } from '@/hooks/useIndicateursDashboard';
import { useRole } from '@/hooks/useRole';

// Types
interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<unknown>;
  href: string;
  active: boolean;
}

interface KPICard {
  label: string;
  value: string | number;
  trend: string;
  color: 'green' | 'blue' | 'purple' | 'orange';
  icon: React.ComponentType<unknown>;
}

interface ActivityItem {
  id: number;
  action: string;
  detail: string;
  time: string;
  icon: React.ComponentType<unknown>;
  color: string;
}

interface AlertItem {
  id: number;
  type: 'urgent' | 'info' | 'warning';
  title: string;
  message: string;
  date: string;
  icon: React.ComponentType<unknown>;
}

const COPInterface: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { signOut, profile } = useAuth();

  // Navigation items
  const navigation: NavigationItem[] = [
    { id: 'dashboard', name: 'Tableau de bord', icon: Home, href: '/dashboard', active: true },
    { id: 'entreprises', name: 'Entreprises', icon: Building2, href: '/entreprises-gestion', active: false },
    { id: 'evenements', name: 'Événements', icon: Calendar, href: '/evenements', active: false },
    { id: 'stagiaires', name: 'Stagiaires', icon: GraduationCap, href: '/stagiaires', active: false },
    { id: 'demandes-entreprises', name: 'Demandes entreprises', icon: Users, href: '/dashboard-admin', active: false },
    // Ajout du lien Paramètres pour les admins
    ...(profile?.role === 'business_developer' ? [
      { id: 'parametres', name: 'Paramètres', icon: Settings, href: '/parametres', active: false }
    ] : [])
  ];

  // KPI Data
  const kpiData: KPICard[] = [
    {
      label: 'Taux d\'insertion',
      value: '73%',
      trend: '+5% ce mois',
      color: 'green',
      icon: TrendingUp
    },
    {
      label: 'Total stagiaires',
      value: 248,
      trend: '+12 ce mois',
      color: 'blue',
      icon: Users
    },
    {
      label: 'Entreprises actives',
      value: 42,
      trend: '+3 cette semaine',
      color: 'purple',
      icon: Building2
    },
    {
      label: 'CV envoyés',
      value: 89,
      trend: '+15 cette semaine',
      color: 'orange',
      icon: Mail
    }
  ];

  // Activity data
  const activityData: ActivityItem[] = [
    {
      id: 1,
      action: 'Nouvelle entreprise ajoutée',
      detail: 'Digital Solutions SARL',
      time: 'Il y a 2h',
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      action: 'CV envoyé',
      detail: 'Ahmed Benali → TechCorp',
      time: 'Il y a 4h',
      icon: Mail,
      color: 'bg-green-500'
    },
    {
      id: 3,
      action: 'Stagiaire inséré',
      detail: 'Fatima Alaoui chez StartupTech',
      time: 'Il y a 6h',
      icon: CheckCircle,
      color: 'bg-purple-500'
    },
    {
      id: 4,
      action: 'Événement créé',
      detail: 'Forum emploi septembre',
      time: 'Hier',
      icon: Calendar,
      color: 'bg-orange-500'
    }
  ];

  // Alerts data
  const alertsData: AlertItem[] = [
    {
      id: 1,
      type: 'urgent',
      title: 'Relancer TechSolutions',
      message: 'Stage de développement en attente',
      date: '2024-07-15',
      icon: AlertCircle
    },
    {
      id: 2,
      type: 'info',
      title: 'Entretiens programmés',
      message: '3 candidats demain à 14h',
      date: '2024-07-14',
      icon: Calendar
    },
    {
      id: 3,
      type: 'warning',
      title: 'CV en attente',
      message: '5 CV à valider',
      date: '2024-07-13',
      icon: CheckCircle
    }
  ];

  // Quick actions
  const quickActions = [
    { name: 'Ajouter stagiaire', icon: Users, color: 'bg-blue-500 hover:bg-blue-600', href: '/stagiaires' },
    { name: 'Nouvelle entreprise', icon: Building2, color: 'bg-green-500 hover:bg-green-600', href: '/entreprises-gestion' },
    { name: 'Planifier événement', icon: Calendar, color: 'bg-purple-500 hover:bg-purple-600', href: '/evenements' }
    // Action 'Envoyer CV' supprimée
  ];

  // Handlers
  const handleNavigation = (href: string) => {
    setMobileMenuOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await signOut();
    }
  };

  const getKPIColorClasses = (color: string) => {
    const colorMap = {
      green: {
        text: 'text-green-600',
        bg: 'bg-green-100',
        border: 'border-green-500'
      },
      blue: {
        text: 'text-blue-600',
        bg: 'bg-blue-100',
        border: 'border-blue-500'
      },
      purple: {
        text: 'text-purple-600',
        bg: 'bg-purple-100',
        border: 'border-purple-500'
      },
      orange: {
        text: 'text-orange-600',
        bg: 'bg-orange-100',
        border: 'border-orange-500'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getAlertColorClasses = (type: string) => {
    const alertMap = {
      urgent: 'bg-red-50 border-red-500 hover:bg-red-100',
      warning: 'bg-yellow-50 border-yellow-500 hover:bg-yellow-100',
      info: 'bg-blue-50 border-blue-500 hover:bg-blue-100'
    };
    return alertMap[type as keyof typeof alertMap] || alertMap.info;
  };

  const getAlertIconColor = (type: string) => {
    const iconMap = {
      urgent: 'text-red-600 bg-red-100',
      warning: 'text-yellow-600 bg-yellow-100',
      info: 'text-blue-600 bg-blue-100'
    };
    return iconMap[type as keyof typeof iconMap] || iconMap.info;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-full sm:w-80 bg-white shadow-lg transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="Logo MyWay" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">Centre d’Orientation Professionnelle</h1>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center px-3 sm:px-4 py-3 sm:py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-r-4 border-blue-500 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="relative">
              <button
                onClick={() => { setProfileMenuOpen(false); router.push('/profil'); }}
                className="w-full flex items-center px-4 py-3 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="relative w-10 h-10 mr-3 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" className="w-10 h-10 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                </span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">{profile?.prenom} {profile?.nom}</p>
                  {profile?.role === 'business_developer' && (
                    <p className="text-xs text-gray-500">Administrateur</p>
                  )}
                  <div className="text-xs text-red-500 mt-1">role: {profile?.role}</div>
                </div>
                <Settings className="w-4 h-4 text-gray-400" />
              </button>

              {/* Profile Menu */}
              {profileMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <button
                    onClick={() => { setProfileMenuOpen(false); router.push('/profil'); }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4 mr-3" />
                    Mon Profil
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4 mr-3" />
                    Paramètres
                  </button>
                  <button
                    onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-3 sm:py-4">
            {/* Mobile menu button */}
            <div className="flex items-center justify-between w-full mb-3 sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">COP Dashboard</h2>
              <div className="w-10"></div> {/* Spacer for centering */}
            </div>
            
            <div className="flex flex-col items-center mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">Tableau de bord</h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">Bienvenue dans votre espace COP ! 👋</p>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Mobile search button */}
              <button className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Search className="w-5 h-5" />
              </button>
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {/* Indicateurs dynamiques avec ajout admin */}
          <IndicateursDashboardCards />

          {/* Quick Actions */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
              Actions rapides
            </h3>
            <div className="grid grid-cols-2 sm:flex sm:flex-col md:flex-row justify-center items-center gap-3 sm:gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleNavigation(action.href)}
                    className={`p-4 sm:p-6 rounded-xl text-white ${action.color} transition-all duration-300 flex flex-col items-center text-center group hover:scale-105 hover:shadow-lg`}
                  >
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-xs sm:text-sm font-medium">{action.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone centrale avec fond créatif */}
          <div className="relative flex justify-center items-center min-h-[300px] sm:min-h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-200 opacity-30 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 w-full max-w-2xl">
              <NotesModule />
            </div>
          </div>

          {/* Footer Banner */}
          {/* Bloc supprimé : Footer Banner (Votre COP évolue !, sous-titre, version, système opérationnel, Target, etc.) */}
        </main>
      </div>
    </div>
  );
};

// --- Composant pour les cartes dynamiques, ajout et édition admin ---
function IndicateursDashboardCards() {
  const { indicateurs, loading, error, updateIndicateur, reload } = useIndicateursDashboard();
  const { isAdmin } = useRole();
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editData, setEditData] = useState<unknown[]>([]);
  const [addData, setAddData] = useState({ titre: '', valeur: '', trend: '', couleur: 'blue', icone: 'TrendingUp' });

  // Icônes disponibles
  const iconMap = {
    TrendingUp: <TrendingUp className="w-7 h-7" />,
    Users: <Users className="w-7 h-7" />,
    Building2: <Building2 className="w-7 h-7" />,
    Mail: <Mail className="w-7 h-7" />,
  };

  // Ouvre la modale d'édition avec les valeurs actuelles
  const handleEdit = () => {
    setEditData(indicateurs.map(i => ({ ...i })));
    setEditOpen(true);
  };
  // Gère la modification locale
  const handleChange = (idx: number, field: string, value: string) => {
    setEditData(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  // Sauvegarde toutes les modifs
  const handleSave = async () => {
    for (const ind of editData) {
      await updateIndicateur(ind.id, {
        titre: ind.titre,
        valeur: ind.valeur,
        trend: ind.trend,
        couleur: ind.couleur,
        icone: ind.icone,
      });
    }
    setEditOpen(false);
    reload();
  };
  // Ajout d'un indicateur
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { supabase } = await import('@/lib/supabase');
    await supabase.from('indicateurs_dashboard').insert([
      { ...addData, ordre: indicateurs.length }
    ]);
    setAddOpen(false);
    setAddData({ titre: '', valeur: '', trend: '', couleur: 'blue', icone: 'TrendingUp' });
    reload();
  };
  if (loading) return <div>Chargement…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-bold text-[#1D3557]">Indicateurs clés</div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 border-2 border-dashed border-blue-300 rounded-xl px-4 py-2 text-blue-500 hover:bg-blue-50 transition">
              <PlusCircle className="w-5 h-5" /> Ajouter un indicateur
            </button>
            <button onClick={handleEdit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold transition">Modifier</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {indicateurs.map((ind, idx) => (
          <div key={ind.id} className={`bg-white rounded-xl p-4 sm:p-6 border-l-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group border-${ind.couleur || 'blue'}-500`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{ind.titre}</p>
                <p className={`text-2xl sm:text-3xl font-bold text-${ind.couleur || 'blue'}-600`}>{ind.valeur}</p>
              </div>
              <div className={`rounded-full p-3 bg-${ind.couleur || 'blue'}-100`}>{iconMap[ind.icone as keyof typeof iconMap] || <TrendingUp className="w-7 h-7" />}</div>
            </div>
            <div className={`mt-2 text-sm font-medium text-${ind.couleur || 'blue'}-600 flex items-center`}>{ind.trend}</div>
          </div>
        ))}
        {isAdmin && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-6 text-blue-500 hover:bg-blue-50 transition"
          >
            <span className="text-4xl">+</span>
            <span className="mt-2 font-semibold">Ajouter un indicateur</span>
          </button>
        )}
      </div>
      {/* Modale édition admin */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-8 w-full max-w-2xl flex flex-col gap-4 sm:gap-6">
            <div className="text-xl font-bold text-[#1D3557] mb-4">Modifier les indicateurs</div>
            {editData.map((ind, idx) => (
              <div key={ind.id} className="flex gap-4 items-center mb-2">
                <input className="border rounded p-2 w-40" value={ind.titre} onChange={e => handleChange(idx, 'titre', e.target.value)} />
                <input className="border rounded p-2 w-24" value={ind.valeur} onChange={e => handleChange(idx, 'valeur', e.target.value)} />
                <input className="border rounded p-2 w-32" value={ind.trend || ''} onChange={e => handleChange(idx, 'trend', e.target.value)} placeholder="Tendance" />
                <select className="border rounded p-2 w-28" value={ind.couleur || 'blue'} onChange={e => handleChange(idx, 'couleur', e.target.value)}>
                  <option value="green">Vert</option>
                  <option value="blue">Bleu</option>
                  <option value="purple">Violet</option>
                  <option value="orange">Orange</option>
                  <option value="red">Rouge</option>
                  <option value="gray">Gris</option>
                </select>
                <select className="border rounded p-2 w-32" value={ind.icone || 'TrendingUp'} onChange={e => handleChange(idx, 'icone', e.target.value)}>
                  <option value="TrendingUp">Tendance</option>
                  <option value="Users">Stagiaires</option>
                  <option value="Building2">Entreprise</option>
                  <option value="Mail">CV</option>
                </select>
              </div>
            ))}
            <div className="flex gap-2 justify-end mt-4">
              <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setEditOpen(false)}>Annuler</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleSave}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
      {/* Modale ajout admin */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-xl p-4 sm:p-8 w-full max-w-md flex flex-col gap-4">
            <div className="text-xl font-bold text-[#1D3557] mb-4">Ajouter un indicateur</div>
            <input className="border rounded p-2" placeholder="Titre" value={addData.titre} onChange={e => setAddData(f => ({ ...f, titre: e.target.value }))} required />
            <input className="border rounded p-2" placeholder="Valeur" value={addData.valeur} onChange={e => setAddData(f => ({ ...f, valeur: e.target.value }))} required />
            <input className="border rounded p-2" placeholder="Tendance" value={addData.trend} onChange={e => setAddData(f => ({ ...f, trend: e.target.value }))} />
            <select className="border rounded p-2" value={addData.couleur} onChange={e => setAddData(f => ({ ...f, couleur: e.target.value }))}>
              <option value="green">Vert</option>
              <option value="blue">Bleu</option>
              <option value="purple">Violet</option>
              <option value="orange">Orange</option>
              <option value="red">Rouge</option>
              <option value="gray">Gris</option>
            </select>
            <select className="border rounded p-2" value={addData.icone} onChange={e => setAddData(f => ({ ...f, icone: e.target.value }))}>
              <option value="TrendingUp">Tendance</option>
              <option value="Users">Stagiaires</option>
              <option value="Building2">Entreprise</option>
              <option value="Mail">CV</option>
            </select>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setAddOpen(false)}>Annuler</button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Ajouter</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default COPInterface; 