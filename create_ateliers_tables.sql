-- Création des tables pour le système d'ateliers
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Table des ateliers
CREATE TABLE IF NOT EXISTS ateliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT,
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
  date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  capacite_max INTEGER NOT NULL CHECK (capacite_max > 0),
  capacite_actuelle INTEGER DEFAULT 0 CHECK (capacite_actuelle >= 0),
  statut TEXT DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'termine', 'annule')),
  lieu TEXT,
  animateur_id UUID REFERENCES auth.users(id),
  animateur_nom TEXT,
  pole TEXT,
  filliere TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des inscriptions aux ateliers
CREATE TABLE IF NOT EXISTS inscriptions_ateliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  atelier_id UUID NOT NULL REFERENCES ateliers(id) ON DELETE CASCADE,
  stagiaire_nom TEXT NOT NULL,
  stagiaire_email TEXT NOT NULL,
  stagiaire_pole TEXT,
  stagiaire_filliere TEXT,
  date_inscription TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  statut TEXT DEFAULT 'confirme' CHECK (statut IN ('confirme', 'en_attente', 'annule')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ateliers_date_debut ON ateliers(date_debut);
CREATE INDEX IF NOT EXISTS idx_ateliers_animateur_id ON ateliers(animateur_id);
CREATE INDEX IF NOT EXISTS idx_ateliers_statut ON ateliers(statut);
CREATE INDEX IF NOT EXISTS idx_ateliers_actif ON ateliers(actif);

CREATE INDEX IF NOT EXISTS idx_inscriptions_atelier_id ON inscriptions_ateliers(atelier_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_email ON inscriptions_ateliers(stagiaire_email);
CREATE INDEX IF NOT EXISTS idx_inscriptions_statut ON inscriptions_ateliers(statut);

-- 4. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Triggers pour updated_at
CREATE TRIGGER update_ateliers_updated_at
    BEFORE UPDATE ON ateliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inscriptions_ateliers_updated_at
    BEFORE UPDATE ON inscriptions_ateliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security) - Politiques
ALTER TABLE ateliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions_ateliers ENABLE ROW LEVEL SECURITY;

-- Politiques pour ateliers
-- Tous les utilisateurs authentifiés peuvent voir tous les ateliers
CREATE POLICY "Permettre lecture ateliers" ON ateliers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Chaque utilisateur peut créer des ateliers
CREATE POLICY "Permettre creation ateliers" ON ateliers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Chaque utilisateur peut modifier ses propres ateliers
CREATE POLICY "Permettre modification ateliers propres" ON ateliers
    FOR UPDATE USING (auth.uid() = animateur_id);

-- Admin peut modifier tous les ateliers
CREATE POLICY "Permettre modification ateliers admin" ON ateliers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND role = 'business_developer'
        )
    );

-- Admin peut supprimer tous les ateliers
CREATE POLICY "Permettre suppression ateliers admin" ON ateliers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND role = 'business_developer'
        )
    );

-- Politiques pour inscriptions_ateliers
-- Tous les utilisateurs authentifiés peuvent voir les inscriptions
CREATE POLICY "Permettre lecture inscriptions" ON inscriptions_ateliers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Tous peuvent créer des inscriptions (pour la page publique)
CREATE POLICY "Permettre creation inscriptions" ON inscriptions_ateliers
    FOR INSERT WITH CHECK (true);

-- Chaque utilisateur peut modifier les inscriptions de ses ateliers
CREATE POLICY "Permettre modification inscriptions" ON inscriptions_ateliers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ateliers 
            WHERE ateliers.id = inscriptions_ateliers.atelier_id 
            AND ateliers.animateur_id = auth.uid()
        )
    );

-- Admin peut modifier toutes les inscriptions
CREATE POLICY "Permettre modification inscriptions admin" ON inscriptions_ateliers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND role = 'business_developer'
        )
    );

-- 7. Fonction pour mettre à jour la capacité actuelle
CREATE OR REPLACE FUNCTION update_atelier_capacite()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE ateliers 
        SET capacite_actuelle = capacite_actuelle + 1
        WHERE id = NEW.atelier_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE ateliers 
        SET capacite_actuelle = capacite_actuelle - 1
        WHERE id = OLD.atelier_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 8. Trigger pour mettre à jour automatiquement la capacité
CREATE TRIGGER update_atelier_capacite_trigger
    AFTER INSERT OR DELETE ON inscriptions_ateliers
    FOR EACH ROW
    EXECUTE FUNCTION update_atelier_capacite();

-- 9. Vérification de la création
SELECT 'Tables ateliers créées avec succès' as status; 