// ========================================
// src/types/index.ts - Types principaux COP
// ========================================

export type UserRole = 'business_developer' | 'manager_cop' | 'conseiller_cop' | 'conseillere_carriere' | 'directeur'

export interface Profile {
  id: string
  email: string
  nom: string
  prenom: string
  role: UserRole
  avatar_url?: string
  telephone?: string
  poste?: string
  actif: boolean
  derniere_connexion?: string
  created_at: string
  updated_at: string
}

export interface Entreprise {
  id: string
  nom: string
  secteur?: string
  taille?: 'TPE' | 'PME' | 'ETI' | 'GE'
  adresse?: string
  ville?: string
  code_postal?: string
  pays?: string
  site_web?: string
  description?: string
  logo_url?: string
  contrat_url?: string
  contact_principal_nom?: string
  contact_principal_email?: string
  contact_principal_telephone?: string
  contact_principal_poste?: string
  partenaire_privilegie: boolean
  note_partenariat?: number
  statut: 'actif' | 'inactif' | 'prospect' | 'partenaire'
  niveau_interet?: 'faible' | 'moyen' | 'fort'
  dernier_contact_at?: string
  prochaine_relance_at?: string
  notes_bd?: string
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface Pole {
  id: string
  nom: string
  description?: string
  couleur: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Filiere {
  id: string
  nom: string
  pole_id: string
  description?: string
  actif: boolean
  created_at: string
  updated_at: string
  pole?: Pole
}

export interface Stagiaire {
  id: string
  nom: string
  prenom: string
  email?: string
  telephone?: string
  filiere_id?: string
  pole_id?: string
  niveau_etude?: string
  entreprise_accueil_id?: string
  date_debut_stage?: string
  date_fin_stage?: string
  sujet_stage?: string
  maitre_stage_nom?: string
  maitre_stage_email?: string
  insere: boolean
  entreprise_insertion_id?: string
  date_insertion?: string
  type_contrat?: string
  salaire_insertion?: number
  poste_insertion?: string
  photo_url?: string
  cv_url?: string
  notes?: string
  conseiller_id?: string
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
  filiere?: Filiere
  pole?: Pole
  entreprise_accueil?: Entreprise
  entreprise_insertion?: Entreprise
  conseiller?: Profile
}

export interface DashboardStats {
  taux_insertion_global: number
  total_stagiaires: number
  total_entreprises: number
  evenements_mois: number
  cv_envoyes_mois: number
  rappels_retard: number
  insertions_ce_mois: number
  nouvelles_entreprises_mois: number
}

// Types pour les permissions
export interface UserPermissions {
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  canManageUsers: boolean
  canAccessSettings: boolean
  canExport: boolean
}

// Types pour CV Connect
export type CVConnectRole = 'super_admin' | 'gestionnaire' | 'lecteur'

export interface CVConnectPermission {
  id: string
  user_id: string
  role: CVConnectRole
  granted_by: string
  granted_at: string
  expires_at?: string
  created_at: string
  updated_at: string
  user?: Profile
  granted_by_user?: Profile
}

export interface CVConnectSubmission {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  pole_id?: string
  filiere_id?: string
  cv_filename: string
  cv_google_drive_id: string
  cv_google_drive_url: string
  statut: 'nouveau' | 'traite' | 'archive'
  notes?: string
  submitted_at: string
  processed_at?: string
  processed_by?: string
  pole?: Pole
  filiere?: Filiere
  processed_by_user?: Profile
}