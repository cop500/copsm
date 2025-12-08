-- ========================================
-- Table pour le calendrier collaboratif
-- ========================================

-- Table principale des événements du calendrier
CREATE TABLE IF NOT EXISTS calendrier_collaboratif (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
  date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  couleur TEXT DEFAULT '#3B82F6' CHECK (couleur ~ '^#[0-9A-Fa-f]{6}$'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_calendrier_user_id ON calendrier_collaboratif(user_id);
CREATE INDEX IF NOT EXISTS idx_calendrier_date_debut ON calendrier_collaboratif(date_debut);
CREATE INDEX IF NOT EXISTS idx_calendrier_date_fin ON calendrier_collaboratif(date_fin);
CREATE INDEX IF NOT EXISTS idx_calendrier_date_range ON calendrier_collaboratif USING GIST (tstzrange(date_debut, date_fin));

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_calendrier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calendrier_collaboratif_updated_at
    BEFORE UPDATE ON calendrier_collaboratif
    FOR EACH ROW
    EXECUTE FUNCTION update_calendrier_updated_at();

-- RLS Policies
ALTER TABLE calendrier_collaboratif ENABLE ROW LEVEL SECURITY;

-- Policy : Tous les utilisateurs authentifiés peuvent voir tous les événements
CREATE POLICY "Les utilisateurs authentifiés peuvent voir tous les événements"
    ON calendrier_collaboratif
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy : Les utilisateurs peuvent créer leurs propres événements
CREATE POLICY "Les utilisateurs peuvent créer leurs propres événements"
    ON calendrier_collaboratif
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent modifier uniquement leurs propres événements
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres événements"
    ON calendrier_collaboratif
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent supprimer uniquement leurs propres événements
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres événements"
    ON calendrier_collaboratif
    FOR DELETE
    USING (auth.uid() = user_id);

