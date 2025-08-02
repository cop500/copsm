-- Script de diagnostic et correction pour les statistiques_demandes

-- 1. Vérifier la structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'statistiques_demandes'
ORDER BY ordinal_position;

-- 2. Vérifier les politiques RLS actuelles
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
WHERE tablename = 'statistiques_demandes';

-- 3. Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'statistiques_demandes';

-- 4. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Permettre lecture statistiques" ON statistiques_demandes;
DROP POLICY IF EXISTS "Permettre insertion statistiques" ON statistiques_demandes;
DROP POLICY IF EXISTS "Permettre mise a jour statistiques" ON statistiques_demandes;
DROP POLICY IF EXISTS "Permettre suppression statistiques" ON statistiques_demandes;

-- 5. Créer une politique simple qui permet toutes les opérations pour les utilisateurs authentifiés
CREATE POLICY "Permettre toutes les opérations statistiques" ON statistiques_demandes
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Vérifier les données existantes
SELECT 
    demande_id,
    nombre_candidats,
    nombre_candidats_retenus,
    nombre_cv_envoyes,
    created_at,
    updated_at
FROM statistiques_demandes
LIMIT 10;

-- 7. Vérifier les demandes qui ont des statistiques
SELECT 
    d.id as demande_id,
    d.entreprise_nom,
    d.evenement_type,
    s.nombre_candidats,
    s.nombre_candidats_retenus,
    s.nombre_cv_envoyes
FROM demandes_entreprises d
LEFT JOIN statistiques_demandes s ON d.id = s.demande_id
WHERE s.demande_id IS NOT NULL
ORDER BY d.created_at DESC; 