-- Créer des politiques publiques pour les ateliers
-- Permettre l'accès public en lecture seule

-- 1. Politique publique pour la lecture des ateliers (sans authentification)
DROP POLICY IF EXISTS "Lecture publique ateliers" ON ateliers;
CREATE POLICY "Lecture publique ateliers" ON ateliers
    FOR SELECT USING (true);

-- 2. Politique publique pour l'insertion d'inscriptions (sans authentification)
DROP POLICY IF EXISTS "Insertion publique inscriptions" ON inscriptions_ateliers;
CREATE POLICY "Insertion publique inscriptions" ON inscriptions_ateliers
    FOR INSERT WITH CHECK (true);

-- 3. Politique publique pour la lecture des inscriptions (sans authentification)
DROP POLICY IF EXISTS "Lecture publique inscriptions" ON inscriptions_ateliers;
CREATE POLICY "Lecture publique inscriptions" ON inscriptions_ateliers
    FOR SELECT USING (true);

-- 4. Vérifier les politiques existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('ateliers', 'inscriptions_ateliers')
ORDER BY tablename, policyname;
