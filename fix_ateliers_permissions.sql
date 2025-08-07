-- Script pour corriger les permissions RLS des ateliers
-- Supprimer et recréer les politiques avec des permissions plus permissives

-- 1. Supprimer les anciennes politiques pour ateliers
DROP POLICY IF EXISTS "Permettre lecture ateliers" ON ateliers;
DROP POLICY IF EXISTS "Permettre insertion ateliers" ON ateliers;
DROP POLICY IF EXISTS "Permettre modification ateliers" ON ateliers;
DROP POLICY IF EXISTS "Permettre suppression ateliers" ON ateliers;

-- 2. Supprimer les anciennes politiques pour inscriptions_ateliers
DROP POLICY IF EXISTS "Permettre lecture inscriptions" ON inscriptions_ateliers;
DROP POLICY IF EXISTS "Permettre insertion inscriptions" ON inscriptions_ateliers;
DROP POLICY IF EXISTS "Permettre modification inscriptions" ON inscriptions_ateliers;
DROP POLICY IF EXISTS "Permettre suppression inscriptions" ON inscriptions_ateliers;

-- 3. Recréer les politiques pour ateliers (plus permissives)
-- Lecture : tous les utilisateurs authentifiés
CREATE POLICY "Permettre lecture ateliers" ON ateliers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insertion : tous les utilisateurs authentifiés
CREATE POLICY "Permettre insertion ateliers" ON ateliers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Modification : tous les utilisateurs authentifiés
CREATE POLICY "Permettre modification ateliers" ON ateliers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Suppression : tous les utilisateurs authentifiés (ou seulement admin si nécessaire)
CREATE POLICY "Permettre suppression ateliers" ON ateliers
    FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Recréer les politiques pour inscriptions_ateliers (plus permissives)
-- Lecture : tous les utilisateurs authentifiés
CREATE POLICY "Permettre lecture inscriptions" ON inscriptions_ateliers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insertion : tous les utilisateurs (même non authentifiés pour la page publique)
CREATE POLICY "Permettre insertion inscriptions" ON inscriptions_ateliers
    FOR INSERT WITH CHECK (true);

-- Modification : tous les utilisateurs authentifiés
CREATE POLICY "Permettre modification inscriptions" ON inscriptions_ateliers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Suppression : tous les utilisateurs authentifiés
CREATE POLICY "Permettre suppression inscriptions" ON inscriptions_ateliers
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Vérifier que les politiques sont créées
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
