-- Test de connexion et permissions pour statistiques_demandes

-- 1. Test simple de lecture
SELECT COUNT(*) as total_statistiques FROM statistiques_demandes;

-- 2. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'statistiques_demandes';

-- 3. Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'statistiques_demandes';

-- 4. Test d'insertion (pour vérifier les permissions)
-- Cette requête va échouer si les permissions ne sont pas correctes
INSERT INTO statistiques_demandes (demande_id, nombre_candidats, nombre_candidats_retenus)
VALUES ('test-id-123', 0, 0)
ON CONFLICT (demande_id) DO NOTHING;

-- 5. Nettoyer le test
DELETE FROM statistiques_demandes WHERE demande_id = 'test-id-123';

-- 6. Afficher quelques exemples de données
SELECT 
    demande_id,
    nombre_candidats,
    nombre_candidats_retenus,
    nombre_cv_envoyes,
    created_at
FROM statistiques_demandes
ORDER BY created_at DESC
LIMIT 5; 