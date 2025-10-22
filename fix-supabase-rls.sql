-- ========================================
-- Script SQL pour corriger les politiques RLS de Supabase
-- ========================================

-- 1. Vérifier si la table candidatures_stagiaires existe
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'candidatures_stagiaires' 
AND table_schema = 'public';

-- 2. Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'candidatures_stagiaires' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les politiques RLS actuelles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'candidatures_stagiaires';

-- 4. Désactiver temporairement RLS pour tester
ALTER TABLE candidatures_stagiaires DISABLE ROW LEVEL SECURITY;

-- 5. Créer une politique RLS permissive pour les insertions
CREATE POLICY "Allow anonymous insertions" ON candidatures_stagiaires
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 6. Créer une politique RLS pour les lectures
CREATE POLICY "Allow public read access" ON candidatures_stagiaires
FOR SELECT 
TO anon, authenticated
USING (true);

-- 7. Réactiver RLS
ALTER TABLE candidatures_stagiaires ENABLE ROW LEVEL SECURITY;

-- 8. Vérifier les politiques créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'candidatures_stagiaires';

-- 9. Tester l'insertion avec des données de test
INSERT INTO candidatures_stagiaires (
    nom, prenom, email, telephone, 
    date_candidature, source_offre, statut_candidature,
    entreprise_nom, poste, type_contrat, cv_url
) VALUES (
    'Test', 'RLS', 'test@rls.com', '0612345678',
    CURRENT_DATE, 'Site web', 'envoye',
    'Test Entreprise', 'Test Poste', 'cv', 'https://test.com/cv.pdf'
);

-- 10. Vérifier l'insertion
SELECT * FROM candidatures_stagiaires WHERE email = 'test@rls.com';

-- 11. Nettoyer le test
DELETE FROM candidatures_stagiaires WHERE email = 'test@rls.com';
