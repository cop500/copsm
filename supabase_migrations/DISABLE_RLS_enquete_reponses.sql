-- SOLUTION ULTIME : Désactiver complètement RLS pour la table enquete_reponses
-- Cela permettra l'insertion publique sans aucune restriction

-- Désactiver RLS
ALTER TABLE enquete_reponses DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'enquete_reponses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON enquete_reponses';
    END LOOP;
END $$;

-- Vérification
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'enquete_reponses';

