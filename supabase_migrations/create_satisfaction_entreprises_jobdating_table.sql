-- Table pour stocker les enquêtes de satisfaction des entreprises
CREATE TABLE IF NOT EXISTS satisfaction_entreprises_jobdating (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- A. Informations entreprise
  nom_entreprise TEXT NOT NULL,
  nom_representant TEXT NOT NULL,
  fonction_representant TEXT NOT NULL,
  email_entreprise TEXT NOT NULL,
  telephone_entreprise TEXT,
  
  -- B. Satisfaction concernant les lauréats (notation 1 à 5)
  niveau_technique INTEGER CHECK (niveau_technique >= 1 AND niveau_technique <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  soft_skills INTEGER CHECK (soft_skills >= 1 AND soft_skills <= 5),
  adequation_besoins INTEGER CHECK (adequation_besoins >= 1 AND adequation_besoins <= 5),
  profil_interessant TEXT CHECK (profil_interessant IN ('oui', 'non', 'en_cours')),
  intention_recruter TEXT CHECK (intention_recruter IN ('oui', 'non', 'peut_etre')),
  
  -- C. Satisfaction sur le Job Dating (notation 1 à 5)
  organisation_globale INTEGER CHECK (organisation_globale >= 1 AND organisation_globale <= 5),
  accueil_accompagnement INTEGER CHECK (accueil_accompagnement >= 1 AND accueil_accompagnement <= 5),
  communication_avant_event INTEGER CHECK (communication_avant_event >= 1 AND communication_avant_event <= 5),
  pertinence_profils INTEGER CHECK (pertinence_profils >= 1 AND pertinence_profils <= 5),
  fluidite_delais INTEGER CHECK (fluidite_delais >= 1 AND fluidite_delais <= 5),
  logistique_espace INTEGER CHECK (logistique_espace >= 1 AND logistique_espace <= 5),
  
  -- D. Retombées
  nombre_profils_retenus TEXT CHECK (nombre_profils_retenus IN ('0', '1', '2-5', '+5')),
  intention_revenir TEXT CHECK (intention_revenir IN ('oui', 'non', 'peut_etre')),
  recommandation_autres_entreprises TEXT CHECK (recommandation_autres_entreprises IN ('oui', 'non')),
  
  -- E. Suggestions
  suggestions TEXT
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_satisfaction_created_at ON satisfaction_entreprises_jobdating(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_satisfaction_nom_entreprise ON satisfaction_entreprises_jobdating(nom_entreprise);
CREATE INDEX IF NOT EXISTS idx_satisfaction_email ON satisfaction_entreprises_jobdating(email_entreprise);

-- RLS (Row Level Security) - Permettre la lecture pour les admins, managers et conseillère carrière
ALTER TABLE satisfaction_entreprises_jobdating ENABLE ROW LEVEL SECURITY;

-- Politique : Lecture pour les admins, managers et conseillère carrière
CREATE POLICY "Les admins, managers et conseillère carrière peuvent lire les enquêtes"
  ON satisfaction_entreprises_jobdating
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('business_developer', 'manager_cop', 'conseillere_carriere')
    )
  );

-- Politique : Insertion publique (pour le formulaire public)
-- Permettre l'insertion pour les utilisateurs anonymes et authentifiés
CREATE POLICY "Tout le monde peut insérer une enquête"
  ON satisfaction_entreprises_jobdating
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Politique : Mise à jour pour les admins uniquement
CREATE POLICY "Seuls les admins peuvent modifier les enquêtes"
  ON satisfaction_entreprises_jobdating
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'business_developer'
    )
  );

-- Politique : Suppression pour les admins uniquement
CREATE POLICY "Seuls les admins peuvent supprimer les enquêtes"
  ON satisfaction_entreprises_jobdating
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'business_developer'
    )
  );

-- Commentaires pour la documentation
COMMENT ON TABLE satisfaction_entreprises_jobdating IS 'Enquêtes de satisfaction des entreprises participantes aux Job Dating de la CMC';
COMMENT ON COLUMN satisfaction_entreprises_jobdating.niveau_technique IS 'Note de 1 à 5 sur le niveau technique des lauréats';
COMMENT ON COLUMN satisfaction_entreprises_jobdating.communication IS 'Note de 1 à 5 sur la communication des lauréats';
COMMENT ON COLUMN satisfaction_entreprises_jobdating.soft_skills IS 'Note de 1 à 5 sur les soft skills des lauréats';
COMMENT ON COLUMN satisfaction_entreprises_jobdating.adequation_besoins IS 'Note de 1 à 5 sur l''adéquation avec les besoins';
COMMENT ON COLUMN satisfaction_entreprises_jobdating.organisation_globale IS 'Note de 1 à 5 sur l''organisation globale du Job Dating';
COMMENT ON COLUMN satisfaction_entreprises_jobdating.accueil_accompagnement IS 'Note de 1 à 5 sur l''accueil et l''accompagnement';
COMMENT ON COLUMN satisfaction_entreprises_jobdating.communication_avant_event IS 'Note de 1 à 5 sur la communication avant l''événement';
COMMENT ON COLUMN satisfaction_entreprises_jobdating.pertinence_profils IS 'Note de 1 à 5 sur la pertinence des profils';
COMMENT ON COLUMN satisfaction_entreprises_jobdating.fluidite_delais IS 'Note de 1 à 5 sur la fluidité et les délais';
COMMENT ON COLUMN satisfaction_entreprises_jobdating.logistique_espace IS 'Note de 1 à 5 sur la logistique et l''espace';

