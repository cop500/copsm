// ========================================
// src/app/parametres/page.tsx - Page des paramètres COP
// ========================================

'use client'

import { useState } from 'react';
import { useRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';
import GeneralSettingsModule from '@/components/GeneralSettingsModule';
import { Settings, Mail, Users } from 'lucide-react';

export default function ParametresPage() {
  const { isAdmin } = useRole();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'notifications'>('general');

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-600 font-bold">Accès réservé à l'administrateur</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Paramètres COP</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            Paramètres généraux
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Mail className="w-4 h-4" />
            Notifications Email
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'general' && (
        <div>
          <p className="text-gray-600 mb-4">Configuration des pôles et filières de formation</p>
          <div className="mt-8">
            <GeneralSettingsModule />
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div>
          <p className="text-gray-600 mb-4">Configurez les notifications automatiques pour les nouvelles demandes d'entreprises</p>
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion des Notifications Email</h3>
                <p className="text-gray-600 mb-6">Configurez les emails de notification pour les nouvelles demandes d'entreprises</p>
                <button
                  onClick={() => router.push('/parametres/notifications-email')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                >
                  <Mail className="w-5 h-5" />
                  Ouvrir la configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}