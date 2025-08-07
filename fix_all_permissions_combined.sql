-- Script combiné pour corriger tous les problèmes de permissions
-- Exécuter ce script dans Supabase SQL Editor

-- 1. Désactiver temporairement RLS pour corriger les permissions
ALTER TABLE ateliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions_ateliers DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Permettre lecture ateliers" ON ateliers;
DROP POLICY IF EXISTS "Permettre insertion ateliers" ON ateliers;
DROP POLICY IF EXISTS "Permettre modification ateliers" ON ateliers;
DROP POLICY IF EXISTS "Permettre suppression ateliers" ON ateliers;
DROP POLICY IF EXISTS "Lecture publique ateliers" ON ateliers;

DROP POLICY IF EXISTS "Permettre lecture inscriptions" ON inscriptions_ateliers;
DROP POLICY IF EXISTS "Permettre insertion inscriptions" ON inscriptions_ateliers;
DROP POLICY IF EXISTS "Permettre modification inscriptions" ON inscriptions_ateliers;
DROP POLICY IF EXISTS "Permettre suppression inscriptions" ON inscriptions_ateliers;
DROP POLICY IF EXISTS "Lecture publique inscriptions" ON inscriptions_ateliers;
DROP POLICY IF EXISTS "Insertion publique inscriptions" ON inscriptions_ateliers;

-- 3. Réactiver RLS
ALTER TABLE ateliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions_ateliers ENABLE ROW LEVEL SECURITY;

-- 4. Créer des politiques très permissives pour les ateliers
CREATE POLICY "Lecture publique ateliers" ON ateliers
    FOR SELECT USING (true);

CREATE POLICY "Insertion ateliers" ON ateliers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Modification ateliers" ON ateliers
    FOR UPDATE USING (true);

CREATE POLICY "Suppression ateliers" ON ateliers
    FOR DELETE USING (true);

-- 5. Créer des politiques très permissives pour les inscriptions
CREATE POLICY "Lecture publique inscriptions" ON inscriptions_ateliers
    FOR SELECT USING (true);

CREATE POLICY "Insertion publique inscriptions" ON inscriptions_ateliers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Modification inscriptions" ON inscriptions_ateliers
    FOR UPDATE USING (true);

CREATE POLICY "Suppression inscriptions" ON inscriptions_ateliers
    FOR DELETE USING (true);

-- 6. Vérifier que les politiques sont créées
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

-- 7. Vérifier l'état des ateliers
SELECT 
    id,
    titre,
    statut,
    actif,
    date_debut,
    capacite_max,
    capacite_actuelle
FROM ateliers 
ORDER BY created_at DESC;
