-- Création de la table rapports_evenements
CREATE TABLE IF NOT EXISTS rapports_evenements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evenement_id UUID NOT NULL REFERENCES evenements(id) ON DELETE CASCADE,
  type_rapport TEXT NOT NULL CHECK (type_rapport IN ('rapport', 'compte-rendu', 'flash-info')),
  contenu TEXT NOT NULL,
  titre_rapport TEXT,
  date_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_rapports_evenement_id ON rapports_evenements(evenement_id);
CREATE INDEX IF NOT EXISTS idx_rapports_date_generation ON rapports_evenements(date_generation);
CREATE INDEX IF NOT EXISTS idx_rapports_type ON rapports_evenements(type_rapport);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
CREATE TRIGGER update_rapports_evenements_updated_at 
    BEFORE UPDATE ON rapports_evenements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Politiques
ALTER TABLE rapports_evenements ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Permettre lecture rapports" ON rapports_evenements
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre l'insertion à tous les utilisateurs authentifiés
CREATE POLICY "Permettre insertion rapports" ON rapports_evenements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour permettre la modification à l'utilisateur qui a créé le rapport
CREATE POLICY "Permettre modification rapports" ON rapports_evenements
    FOR UPDATE USING (auth.uid() = created_by);

-- Politique pour permettre la suppression à l'utilisateur qui a créé le rapport
CREATE POLICY "Permettre suppression rapports" ON rapports_evenements
    FOR DELETE USING (auth.uid() = created_by);

-- Vérification de la création
SELECT 'Table rapports_evenements créée avec succès' as status; 