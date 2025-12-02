-- ========================================
-- Table pour gérer les visites entreprises
-- ========================================

-- Table principale des visites
CREATE TABLE IF NOT EXISTS visites_entreprises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  date_visite TIMESTAMP WITH TIME ZONE NOT NULL,
  heure_visite TIME,
  objectif TEXT,
  personnes_rencontrees JSONB DEFAULT '[]'::jsonb,
  compte_rendu TEXT,
  points_discutes TEXT,
  besoins_detectes TEXT,
  actions_a_prevues TEXT,
  statut_relation TEXT CHECK (statut_relation IN ('faible', 'moyen', 'fort')),
  etat_relation TEXT CHECK (etat_relation IN ('prospect', 'actif', 'partenaire')),
  actions_suivi JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_visites_entreprise_id ON visites_entreprises(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_visites_date_visite ON visites_entreprises(date_visite);
CREATE INDEX IF NOT EXISTS idx_visites_created_by ON visites_entreprises(created_by);
CREATE INDEX IF NOT EXISTS idx_visites_statut_relation ON visites_entreprises(statut_relation);
CREATE INDEX IF NOT EXISTS idx_visites_etat_relation ON visites_entreprises(etat_relation);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_visites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_visites_entreprises_updated_at
    BEFORE UPDATE ON visites_entreprises
    FOR EACH ROW
    EXECUTE FUNCTION update_visites_updated_at();

-- Trigger pour mettre à jour dernier_contact_at et niveau_interet de l'entreprise
CREATE OR REPLACE FUNCTION update_entreprise_contact_info()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE entreprises
    SET 
        dernier_contact_at = NEW.date_visite,
        niveau_interet = COALESCE(NEW.statut_relation, entreprises.niveau_interet),
        statut = CASE 
            WHEN NEW.etat_relation IS NOT NULL THEN NEW.etat_relation::text
            ELSE entreprises.statut
        END,
        updated_at = NOW()
    WHERE id = NEW.entreprise_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_entreprise_on_visite
    AFTER INSERT OR UPDATE ON visites_entreprises
    FOR EACH ROW
    EXECUTE FUNCTION update_entreprise_contact_info();

-- RLS (Row Level Security)
ALTER TABLE visites_entreprises ENABLE ROW LEVEL SECURITY;

-- Les admins (business_developer) peuvent tout faire
CREATE POLICY "Admins can manage visites entreprises" ON visites_entreprises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'business_developer'
    )
  );

-- Commentaires
COMMENT ON TABLE visites_entreprises IS 'Gestion des visites terrain avec les entreprises';
COMMENT ON COLUMN visites_entreprises.personnes_rencontrees IS 'Array JSON de {nom, fonction, email, telephone}';
COMMENT ON COLUMN visites_entreprises.actions_suivi IS 'Array JSON de {tache, date_limite, statut}';

