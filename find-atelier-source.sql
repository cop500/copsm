-- Vérifier d'où vient cet ID spécifique
SELECT 'evenements' as table_name, id, titre, type_evenement, visible_inscription, statut
FROM evenements 
WHERE id = 'c950191c-1161-4d83-a5b3-ec7751fb4da0'

UNION ALL

SELECT 'ateliers' as table_name, id, titre, 'atelier' as type_evenement, 
       CASE WHEN actif = true THEN true ELSE false END as visible_inscription,
       statut
FROM ateliers 
WHERE id = 'c950191c-1161-4d83-a5b3-ec7751fb4da0';

-- Vérifier tous les ateliers dans ateliers qui ont visible_inscription = true
SELECT 'ateliers_visibles' as source, id, titre, actif, statut
FROM ateliers 
WHERE actif = true
ORDER BY created_at DESC;
