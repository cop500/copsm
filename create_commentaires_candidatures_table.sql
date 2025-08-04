-- Script pour créer la table commentaires_candidatures
-- 1. Créer la table
CREATE TABLE IF NOT EXISTS commentaires_candidatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidature_id UUID NOT NULL REFERENCES candidatures_stagiaires(id) ON DELETE CASCADE,
  utilisateur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  utilisateur_nom TEXT NOT NULL,
  contenu TEXT NOT NULL,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_commentaires_candidature_id ON commentaires_candidatures(candidature_id);
CREATE INDEX IF NOT EXISTS idx_commentaires_date_creation ON commentaires_candidatures(date_creation);

-- 3. Activer RLS
ALTER TABLE commentaires_candidatures ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politiques RLS
-- Politique pour permettre la lecture des commentaires pour tous les utilisateurs authentifiés
CREATE POLICY "Permettre lecture commentaires" ON commentaires_candidatures
FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre l'insertion de commentaires par les utilisateurs authentifiés
CREATE POLICY "Permettre insertion commentaires" ON commentaires_candidatures
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = utilisateur_id);

-- Politique pour permettre la mise à jour de ses propres commentaires
CREATE POLICY "Permettre mise à jour commentaires" ON commentaires_candidatures
FOR UPDATE USING (auth.role() = 'authenticated' AND auth.uid() = utilisateur_id);

-- Politique pour permettre la suppression de ses propres commentaires
CREATE POLICY "Permettre suppression commentaires" ON commentaires_candidatures
FOR DELETE USING (auth.role() = 'authenticated' AND auth.uid() = utilisateur_id);

-- 5. Vérifier la création
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'commentaires_candidatures' 
ORDER BY ordinal_position;

-- 6. Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'commentaires_candidatures'; 