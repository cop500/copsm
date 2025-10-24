-- Vérifier la structure de la table inscriptions_ateliers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'inscriptions_ateliers' 
AND table_schema = 'public'
ORDER BY ordinal_position;
