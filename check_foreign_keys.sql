-- Vérifier les contraintes de clé étrangère pour candidatures_stagiaires
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='candidatures_stagiaires';

-- Vérifier les tables disponibles
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%demande%' 
ORDER BY table_name;

-- Vérifier la structure de demandes_cv si elle existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'demandes_cv' 
ORDER BY ordinal_position;

-- Vérifier la structure de demandes_entreprises
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'demandes_entreprises' 
ORDER BY ordinal_position; 