import { useContext } from 'react';
import { UserContext } from '@/contexts/UserContext';

export function useRole() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useRole doit être utilisé dans UserProvider');
  const { role } = context;
  return {
    role,
    isAdmin: role === 'business_developer',
    isManager: role === 'manager_cop',
    isConseiller: role === 'conseiller_cop',
    isCarriere: role === 'conseillere_carriere',
    isDirecteur: role === 'directeur',
  };
} 