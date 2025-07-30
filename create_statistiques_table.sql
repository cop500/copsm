-- Création de la table statistiques_demandes
CREATE TABLE IF NOT EXISTS statistiques_demandes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    demande_id UUID NOT NULL REFERENCES demandes_entreprises(id) ON DELETE CASCADE,
    nombre_candidats INTEGER DEFAULT 0,
    nombre_candidats_retenus INTEGER DEFAULT 0,
    nombre_cv_envoyes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_statistiques_demande_id ON statistiques_demandes(demande_id);

-- RLS (Row Level Security)
ALTER TABLE statistiques_demandes ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Permettre lecture statistiques" ON statistiques_demandes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permettre modification statistiques" ON statistiques_demandes
    FOR ALL USING (auth.role() = 'authenticated');

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_statistiques_updated_at 
    BEFORE UPDATE ON statistiques_demandes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 