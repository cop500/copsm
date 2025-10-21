-- ========================================
-- CV Connect - Tables de base (CORRIGÉ)
-- ========================================

-- Supprimer les tables existantes si elles existent
DROP TABLE IF EXISTS cv_connect_submissions CASCADE;
DROP TABLE IF EXISTS cv_connect_permissions CASCADE;

-- Table pour stocker les permissions CV Connect
CREATE TABLE cv_connect_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'gestionnaire', 'lecteur')),
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les soumissions de CV
CREATE TABLE cv_connect_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  pole_id UUID REFERENCES poles(id),
  filiere_id UUID REFERENCES filieres(id),
  cv_filename TEXT NOT NULL,
  cv_google_drive_id TEXT NOT NULL,
  cv_google_drive_url TEXT NOT NULL,
  statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'traite', 'archive')),
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_cv_connect_permissions_user_id ON cv_connect_permissions(user_id);
CREATE INDEX idx_cv_connect_permissions_role ON cv_connect_permissions(role);
CREATE INDEX idx_cv_connect_submissions_email ON cv_connect_submissions(email);
CREATE INDEX idx_cv_connect_submissions_pole_id ON cv_connect_submissions(pole_id);
CREATE INDEX idx_cv_connect_submissions_filiere_id ON cv_connect_submissions(filiere_id);
CREATE INDEX idx_cv_connect_submissions_statut ON cv_connect_submissions(statut);
CREATE INDEX idx_cv_connect_submissions_submitted_at ON cv_connect_submissions(submitted_at);

-- RLS Policies pour cv_connect_permissions
ALTER TABLE cv_connect_permissions ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout faire (sans référence à profiles)
CREATE POLICY "Admins can manage cv connect permissions" ON cv_connect_permissions
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'business_developer'
    )
  );

-- Les utilisateurs peuvent voir leurs propres permissions
CREATE POLICY "Users can view own permissions" ON cv_connect_permissions
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies pour cv_connect_submissions
ALTER TABLE cv_connect_submissions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs avec permissions CV Connect peuvent voir les soumissions
CREATE POLICY "CV Connect users can view submissions" ON cv_connect_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cv_connect_permissions 
      WHERE cv_connect_permissions.user_id = auth.uid()
      AND cv_connect_permissions.role IN ('super_admin', 'gestionnaire', 'lecteur')
      AND (cv_connect_permissions.expires_at IS NULL OR cv_connect_permissions.expires_at > NOW())
    )
  );

-- Les utilisateurs avec permissions peuvent modifier les soumissions
CREATE POLICY "CV Connect managers can update submissions" ON cv_connect_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM cv_connect_permissions 
      WHERE cv_connect_permissions.user_id = auth.uid()
      AND cv_connect_permissions.role IN ('super_admin', 'gestionnaire')
      AND (cv_connect_permissions.expires_at IS NULL OR cv_connect_permissions.expires_at > NOW())
    )
  );

-- Permettre l'insertion publique (pour le formulaire)
CREATE POLICY "Public can insert cv submissions" ON cv_connect_submissions
  FOR INSERT WITH CHECK (true);

-- Commentaires
COMMENT ON TABLE cv_connect_permissions IS 'Permissions pour accéder au module CV Connect';
COMMENT ON TABLE cv_connect_submissions IS 'Soumissions de CV via le formulaire public';
COMMENT ON COLUMN cv_connect_permissions.role IS 'Rôle: super_admin, gestionnaire, lecteur';
COMMENT ON COLUMN cv_connect_submissions.cv_google_drive_id IS 'ID du fichier sur Google Drive';
COMMENT ON COLUMN cv_connect_submissions.cv_google_drive_url IS 'URL publique du fichier sur Google Drive';
