// ========================================
// src/app/parametres/page.tsx - Page des paramètres COP
// ========================================

'use client'

import { useRole } from '@/hooks/useRole';
import GeneralSettingsModule from '@/components/GeneralSettingsModule';

export default function ParametresPage() {
  const { isAdmin } = useRole();
  if (!isAdmin) {
    return <div className="p-8 text-center text-red-600 font-bold">Accès réservé à l’administrateur</div>;
  }
  // ... contenu des paramètres admin (configuration pôles, filières, etc.)
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Paramètres COP</h1>
      <p>Configuration des pôles et filières de formation</p>
      <div className="mt-8">
        <GeneralSettingsModule />
      </div>
      {/* ... autres paramètres ... */}
    </div>
  );
}