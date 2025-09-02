-- Script pour vérifier et créer la table commentaires_demandes_entreprises
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'commentaires_demandes_entreprises'
);

-- 2. Si la table n'existe pas, la créer
CREATE TABLE IF NOT EXISTS commentaires_demandes_entreprises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID NOT NULL REFERENCES demandes_entreprises(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  auteur TEXT NOT NULL,
  auteur_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_commentaires_demande_id ON commentaires_demandes_entreprises(demande_id);

-- 4. Activer RLS (Row Level Security)
ALTER TABLE commentaires_demandes_entreprises ENABLE ROW LEVEL SECURITY;

-- 5. Créer une politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Permettre la lecture des commentaires" ON commentaires_demandes_entreprises
  FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Créer une politique pour permettre l'insertion aux utilisateurs authentifiés
CREATE POLICY "Permettre l'insertion de commentaires" ON commentaires_demandes_entreprises
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. Créer une politique pour permettre la suppression aux administrateurs
CREATE POLICY "Permettre la suppression de commentaires aux admins" ON commentaires_demandes_entreprises
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'business_developer'
    )
  );

-- 8. Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'commentaires_demandes_entreprises'
ORDER BY ordinal_position;

-- 9. Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'commentaires_demandes_entreprises';
