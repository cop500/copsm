-- SOLUTION SIMPLE ET DÉFINITIVE pour les politiques RLS
-- Ce script supprime TOUTES les politiques et en crée de nouvelles

-- ÉTAPE 1: Désactiver RLS temporairement
ALTER TABLE enquete_reponses DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 2: Supprimer TOUTES les politiques (peu importe leur nom)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'enquete_reponses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON enquete_reponses';
    END LOOP;
END $$;

-- ÉTAPE 3: Réactiver RLS
ALTER TABLE enquete_reponses ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 4: Créer UNE SEULE politique simple pour l'insertion publique
CREATE POLICY "Allow public insert" ON enquete_reponses
    FOR INSERT
    TO public
    WITH CHECK (true);

-- ÉTAPE 5: Créer une politique pour la lecture (admins seulement)
CREATE POLICY "Allow admin select" ON enquete_reponses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('business_developer', 'conseillere_carriere')
        )
    );

-- ÉTAPE 6: Créer une politique pour la mise à jour (admins seulement)
CREATE POLICY "Allow admin update" ON enquete_reponses
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('business_developer', 'conseillere_carriere')
        )
    );

-- ÉTAPE 7: Créer une politique pour la suppression (admins seulement)
CREATE POLICY "Allow admin delete" ON enquete_reponses
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('business_developer', 'conseillere_carriere')
        )
    );

