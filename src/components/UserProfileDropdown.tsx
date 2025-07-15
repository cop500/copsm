import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Shield, ChevronDown, Sliders } from 'lucide-react';
import MonProfil from './MonProfil';
import { useRole } from '@/hooks/useRole';
import Image from 'next/image';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showProfil, setShowProfil] = useState(false);
  const { isAdmin } = useRole();

  // Données utilisateur simulées - à remplacer par useAuth()
  const user = {
    nom: 'Benjelloun',
    prenom: 'Ahmed', 
    email: 'ahmed.benjelloun@cop.ma',
    role: 'business_developer',
    avatar: null
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'business_developer': return 'Administrateur';
      case 'manager_cop': return 'Manager COP';
      case 'conseiller_cop': return 'Conseiller COP';
      case 'conseillere_carriere': return 'Conseillère Carrière';
      default: return 'Utilisateur';
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'business_developer': return 'bg-red-100 text-red-800';
      case 'manager_cop': return 'bg-blue-100 text-blue-800';
      case 'conseiller_cop': return 'bg-green-100 text-green-800';
      case 'conseillere_carriere': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      window.location.href = '/login';
    }
  };

  const menuItems = [
    {
      label: 'Mon Profil',
      icon: User,
      onClick: () => {
        setShowProfil(true);
        setIsOpen(false);
      }
    },
    // Afficher les deux types de paramètres pour admin
    ...(user.role === 'business_developer' ? [
      {
        label: 'Dashboard Admin',
        icon: Sliders,
        onClick: () => {
          window.location.href = '/dashboard-admin';
          setIsOpen(false);
        }
      },
      {
        label: 'Paramètres COP',
        icon: Settings,
        onClick: () => {
          window.location.href = '/parametres';
          setIsOpen(false);
        }
      }
    ] : []),
    {
      label: 'Déconnexion',
      icon: LogOut,
      onClick: handleLogout,
      className: 'text-red-600 hover:bg-red-50'
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton profil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          {/* Remplacement de l’avatar par une icône Lucide User */}
          <User className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900">
            {user.prenom} {user.nom}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {getRoleLabel(user.role)}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Info utilisateur */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                {/* Remplacement de l’avatar par une icône Lucide User */}
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleColor(user.role)}`}>
                  <Shield className="w-3 h-3" />
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${item.className || 'text-gray-700'}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* Modal profil */}
      {showProfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowProfil(false)}
            >
              ×
            </button>
            <MonProfil />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;