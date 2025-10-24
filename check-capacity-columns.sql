-- Vérifier si les colonnes de capacité existent dans la table evenements
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'evenements' 
AND column_name IN ('capacite_maximale', 'capacite_actuelle', 'visible_inscription')
ORDER BY column_name;
