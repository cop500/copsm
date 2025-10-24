-- Vérifier la structure de la table ateliers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ateliers' 
AND table_schema = 'public'
ORDER BY ordinal_position;
