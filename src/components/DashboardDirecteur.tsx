import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
import DashboardFullPage from './DashboardFullPage';

export default function DashboardDirecteur() {
  const { isDirecteur, role } = useRole();
  const router = useRouter();

  // Debug: Afficher le rôle détecté
  useEffect(() => {
    console.log('🔍 Rôle détecté:', role);
    console.log('🔍 isDirecteur:', isDirecteur);
  }, [role, isDirecteur]);

  // Rediriger si ce n'est pas un directeur
  useEffect(() => {
    if (!isDirecteur) {
      console.log('❌ Pas directeur, redirection vers /dashboard');
      router.push('/dashboard');
    }
  }, [isDirecteur, router]);

  if (!isDirecteur) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header spécifique pour le directeur */}

      {/* Contenu principal - Dashboard en mode plein écran */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardFullPage />
      </main>
    </div>
  );
}
