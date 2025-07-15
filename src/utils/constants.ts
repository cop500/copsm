// ========================================
// src/utils/constants.ts - Constantes
// ========================================

export const ROLES = {
  BUSINESS_DEVELOPER: 'business_developer' as const,
  MANAGER_COP: 'manager_cop' as const,
  CONSEILLER_COP: 'conseiller_cop' as const,
  CONSEILLERE_CARRIERE: 'conseillere_carriere' as const,
}

export const ROLE_LABELS = {
  [ROLES.BUSINESS_DEVELOPER]: 'Business Developer',
  [ROLES.MANAGER_COP]: 'Manager COP',
  [ROLES.CONSEILLER_COP]: 'Conseiller COP',
  [ROLES.CONSEILLERE_CARRIERE]: 'Conseillère Carrière',
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