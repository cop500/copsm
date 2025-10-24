-- Vérifier si l'atelier existe dans les différentes tables
SELECT 'evenements' as table_name, id, titre, type_evenement 
FROM evenements 
WHERE id = 'c950191c-1161-4d83-a5b3-ec7751fb4da0'

UNION ALL

SELECT 'ateliers' as table_name, id, titre, 'atelier' as type_evenement
FROM ateliers 
WHERE id = 'c950191c-1161-4d83-a5b3-ec7751fb4da0';

-- Vérifier tous les ateliers dans evenements
SELECT id, titre, type_evenement, visible_inscription, statut
FROM evenements 
WHERE type_evenement = 'atelier'
ORDER BY created_at DESC;
