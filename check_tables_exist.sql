-- Vérifier quelles tables existent dans la base de données
-- Exécutez cette requête dans l'éditeur SQL de Supabase

-- 1. Voir toutes les tables de la base de données
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Chercher des tables qui pourraient contenir "candidature" ou "demande"
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
    table_name ILIKE '%candidature%' OR
    table_name ILIKE '%demande%' OR
    table_name ILIKE '%cv%' OR
    table_name ILIKE '%stage%' OR
    table_name ILIKE '%entreprise%'
)
ORDER BY table_name;

-- 3. Voir les colonnes de toutes les tables pour comprendre la structure
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND c.table_schema = 'public'
AND (
    t.table_name ILIKE '%candidature%' OR
    t.table_name ILIKE '%demande%' OR
    t.table_name ILIKE '%cv%' OR
    t.table_name ILIKE '%stage%' OR
    t.table_name ILIKE '%entreprise%'
)
ORDER BY t.table_name, c.ordinal_position; 