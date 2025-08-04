-- Vérifier la structure de la table candidatures_stagiaires
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'candidatures_stagiaires'
ORDER BY ordinal_position;

-- Voir quelques exemples de données
SELECT * FROM candidatures_stagiaires LIMIT 3; 