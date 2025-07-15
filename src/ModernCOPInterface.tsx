import React, { useState } from 'react';
import { 
  TrendingUp, Users, Building2, Calendar, Mail, Target, AlertCircle, Activity, 
  CheckCircle, FileText, Settings
} from 'lucide-react';

const ModernCOPInterface = () => {
  // Données du dashboard
  const [stats] = useState({
    tauxInsertion: 73,
    totalStagiaires: 248,
    entreprisesActives: 42,
    demandesCV: 89
  });

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
      icon: CheckCircle
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

  // 🎯 FONCTION DE NAVIGATION VERS LES AUTRES PAGES
  const handleNavClick = (navId: string) => {
    if (navId === 'entreprises') {
      window.location.href = '/entreprises';
    } else if (navId === 'parametres') {
      window.location.href = '/parametres';
    } else if (navId === 'stagiaires') {
      window.location.href = '/stagiaires';
    } else if (navId === 'evenements') {
      window.location.href = '/evenements';
    } else if (navId === 'demandes-cv') {
      window.location.href = '/demandes-cv';
    }
  };

  return (
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
              <p className="text-sm font-medium text-gray-600 mb-1">Demandes CV</p>
              <p className="text-3xl font-bold text-orange-600">{stats.demandesCV}</p>
              <p className="text-sm text-orange-600 mt-2 font-medium">+15 cette semaine</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-orange-600" />
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
            { name: 'Gérer demandes CV', icon: FileText, color: 'bg-orange-500 hover:bg-orange-600', action: 'demandes-cv' }
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
  );
};

export default ModernCOPInterface;