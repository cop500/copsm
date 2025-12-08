// ========================================
// src/utils/constants.ts - Constantes
// ========================================

export const ROLES = {
  BUSINESS_DEVELOPER: 'business_developer' as const,
  MANAGER_COP: 'manager_cop' as const,
  CONSEILLER_COP: 'conseiller_cop' as const,
  CONSEILLERE_CARRIERE: 'conseillere_carriere' as const,
  DIRECTEUR: 'directeur' as const,
}

// Fonction pour obtenir le label du rôle avec support du genre
export const getRoleLabel = (role: string, prenom?: string): string => {
  switch(role) {
    case ROLES.BUSINESS_DEVELOPER: return 'Business Developer';
    case ROLES.MANAGER_COP: return 'Manager COP';
    case ROLES.CONSEILLER_COP: 
      // Afficher "Conseillère d'orientation" pour SARA
      if (prenom && prenom.toUpperCase().includes('SARA')) {
        return 'Conseillère d\'orientation';
      }
      return 'Conseiller d\'orientation';
    case ROLES.CONSEILLERE_CARRIERE: return 'Conseillère Carrière';
    case ROLES.DIRECTEUR: return 'Directeur';
    default: return 'Utilisateur';
  }
}

export const ROLE_LABELS = {
  [ROLES.BUSINESS_DEVELOPER]: 'Business Developer',
  [ROLES.MANAGER_COP]: 'Manager COP',
  [ROLES.CONSEILLER_COP]: 'Conseiller d\'orientation',
  [ROLES.CONSEILLERE_CARRIERE]: 'Conseillère Carrière',
  [ROLES.DIRECTEUR]: 'Directeur',
}

export const STATUTS_ENTREPRISE = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'partenaire', label: 'Partenaire' },
]

export const TAILLES_ENTREPRISE = [
  { value: 'TPE', label: 'TPE (1-9 salariés)' },
  { value: 'PME', label: 'PME (10-249 salariés)' },
  { value: 'ETI', label: 'ETI (250-4999 salariés)' },
  { value: 'GE', label: 'Grande Entreprise (5000+ salariés)' },
]