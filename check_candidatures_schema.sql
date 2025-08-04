-- Vérifier la structure exacte de la table candidatures_stagiaires
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'candidatures_stagiaires' 
ORDER BY ordinal_position;

-- Vérifier les contraintes
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'candidatures_stagiaires';

-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'candidatures_stagiaires'; 