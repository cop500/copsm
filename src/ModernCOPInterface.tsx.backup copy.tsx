import React, { useState } from 'react';
import { 
  Home, Users, Building2, Calendar, FileText, Settings,
  GraduationCap, UserCheck, Mail, ArrowRightLeft, Bell,
  LogOut, User, Menu, X, Plus, TrendingUp, Target,
  Activity, BarChart3, ChevronDown, Search, AlertCircle,
  Clock, CheckCircle
} from 'lucide-react';

const ModernCOPInterface = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Données du dashboard
  const [stats] = useState({
    tauxInsertion: 73,
    totalStagiaires: 248,
    entreprisesActives: 42,
    cvEnvoyesMois: 89
  });

  const navigation = [
    { name: 'Tableau de bord', id: 'dashboard', icon: Home, color: 'bg-blue-500' },
    { name: 'Stagiaires', id: 'stagiaires', icon: GraduationCap, color: 'bg-green-500' },
    { name: 'Entreprises', id: 'entreprises', icon: Building2, color: 'bg-purple-500' },
    { name: 'Événements', id: 'evenements', icon: Calendar, color: 'bg-orange-500' },
    { name: 'Liaisons E-E', id: 'liaisons', icon: ArrowRightLeft, color: 'bg-teal-500' },
    { name: 'Demandes CV', id: 'demandes-cv', icon: FileText, color: 'bg-indigo-500' },
    { name: 'CV Envoyés', id: 'cv-envoyes', icon: Mail, color: 'bg-red-500' },
    { name: 'Entretiens', id: 'entretiens', icon: UserCheck, color: 'bg-yellow-500' },
    { name: 'Paramètres', id: 'parametres', icon: Settings, color: 'bg-gray-500' }
  ];

  const rappels = [
    { 
      id: 1, 
      type: 'urgent', 
      message: 'Relancer TechSolutions pour le stage de développement', 
      date: '2024-07-15',
      icon: AlertCircle
    },
    { 
      id: 2, 
      type: 'info', 
      message: 'Entretien prévu demain avec 3 candidats', 
      date: '2024-07-14',
      icon: Calendar
    },
    { 
      id: 3, 
      type: 'warning', 
      message: '5 CV en attente de validation', 
      date: '2024-07-13',
      icon: Clock
    }
  ];

  const activiteRecente = [
    { 
      id: 1, 
      action: 'Nouvelle entreprise ajoutée', 
      detail: 'Digital Innovations SARL', 
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

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      window.location.href = '/login';
    }
  };

  const handleNavClick = (navId: string) => {
    if (navId === 'entreprises') {
      window.location.href = '/entreprises';
    } else if (navId === 'parametres') {
      window.location.href = '/parametres-generaux';
    } else if (navId === 'stagiaires') {
      window.location.href = '/stagiaires';
    } else if (navId === 'evenements') {
      window.location.href = '/evenements';
    } else if (navId === 'liaisons') {
      window.location.href = '/liaisons-entreprises-evenements';
    } else if (navId === 'demandes-cv') {
      window.location.href = '/demandes-cv';
    } else if (navId === 'cv-envoyes') {
      window.location.href = '/cv-envoyes';
    } else if (navId === 'entretiens') {
      window.location.href = '/entretiens';
    } else {
      setActiveView(navId);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header moderne */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center ml-4 lg:ml-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">COP</span>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">Centre COP</h1>
                  <p className="text-sm text-gray-500 hidden sm:block">Centre d'Orientation Professionnelle</p>
                </div>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Actions utilisateur */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profil utilisateur */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">AB</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">Ahmed Benjelloun</p>
                    <p className="text-xs text-gray-500">Administrateur</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Menu déroulant profil */}
                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {handleNavClick('parametres'); setProfileMenuOpen(false);}}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Mon Profil
                    </button>
                    <button
                      onClick={() => {handleNavClick('parametres'); setProfileMenuOpen(false);}}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Paramètres Généraux
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
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
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-40 w-64 h-screen lg:h-auto bg-white shadow-lg transition-transform duration-300 ease-in-out`}>
          <div className="p-6 pt-8">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${isActive ? item.color : 'bg-gray-100'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <span className="font-medium">{item.name}</span>
                    {isActive && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay pour mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Contenu principal */}
        <main className="flex-1 min-h-screen">
          {activeView === 'dashboard' && (
            <div className="p-6">
              {/* En-tête du dashboard */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
                <p className="text-gray-600 text-lg">Bienvenue dans votre espace COP ! 👋</p>
              </div>

              {/* Métriques principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Taux d'insertion</p>
                      <p className="text-3xl font-bold text-green-600">{stats.tauxInsertion}%</p>
                      <div className="w-full bg-green-100 rounded-full h-2 mt-3">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-1000 group-hover:animate-pulse" 
                          style={{width: `${stats.tauxInsertion}%`}}
                        ></div>
                      </div>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total stagiaires</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.totalStagiaires}</p>
                      <p className="text-sm text-blue-600 mt-2 font-medium">+12 ce mois</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Entreprises actives</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.entreprisesActives}</p>
                      <p className="text-sm text-purple-600 mt-2 font-medium">+3 cette semaine</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">CV envoyés ce mois</p>
                      <p className="text-3xl font-bold text-orange-600">{stats.cvEnvoyesMois}</p>
                      <p className="text-sm text-orange-600 mt-2 font-medium">+15 cette semaine</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-xl group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Actions rapides
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Ajouter stagiaire', icon: Users, color: 'bg-blue-500 hover:bg-blue-600', action: 'stagiaires' },
                    { name: 'Nouvelle entreprise', icon: Building2, color: 'bg-green-500 hover:bg-green-600', action: 'entreprises' },
                    { name: 'Planifier événement', icon: Calendar, color: 'bg-purple-500 hover:bg-purple-600', action: 'evenements' },
                    { name: 'Envoyer CV', icon: Mail, color: 'bg-orange-500 hover:bg-orange-600', action: 'cv-envoyes' }
                  ].map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleNavClick(action.action)}
                      className={`p-6 rounded-xl text-white ${action.color} transition-all duration-300 flex flex-col items-center text-center group hover:scale-105 hover:shadow-lg`}
                    >
                      <action.icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">{action.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections informations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informations et rappels */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      Informations et rappels
                    </h3>
                    <button 
                      onClick={() => handleNavClick('parametres')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {rappels.map((rappel) => {
                      const IconComponent = rappel.icon;
                      return (
                        <div
                          key={rappel.id}
                          className={`p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                            rappel.type === 'urgent' ? 'bg-red-50 border-red-500 hover:bg-red-100' :
                            rappel.type === 'warning' ? 'bg-yellow-50 border-yellow-500 hover:bg-yellow-100' :
                            'bg-blue-50 border-blue-500 hover:bg-blue-100'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              rappel.type === 'urgent' ? 'bg-red-100' :
                              rappel.type === 'warning' ? 'bg-yellow-100' :
                              'bg-blue-100'
                            }`}>
                              <IconComponent className={`w-4 h-4 ${
                                rappel.type === 'urgent' ? 'text-red-600' :
                                rappel.type === 'warning' ? 'text-yellow-600' :
                                'text-blue-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{rappel.message}</p>
                              <p className="text-sm text-gray-600 mt-1">{rappel.date}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Activité récente */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Activité récente
                  </h3>
                  <div className="space-y-4">
                    {activiteRecente.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                          <div className={`p-2 ${item.color} rounded-xl group-hover:scale-110 transition-transform`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.action}</p>
                            <p className="text-sm text-gray-600">{item.detail}</p>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                            {item.time}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Message d'accueil */}
              <div className="mt-8 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">🚀 Votre COP évolue !</h3>
                    <p className="text-blue-100 text-lg">
                      Interface moderne et intuitive pour une gestion optimale de l'insertion professionnelle.
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Target className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Autres vues */}
          {activeView !== 'dashboard' && (
            <div className="p-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {(() => {
                    const currentNav = navigation.find(nav => nav.id === activeView);
                    const Icon = currentNav?.icon || Home;
                    return <Icon className="w-8 h-8 text-gray-600" />;
                  })()}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {navigation.find(nav => nav.id === activeView)?.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  Module en cours de développement avec la nouvelle interface moderne.
                </p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retour au tableau de bord
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ModernCOPInterface;