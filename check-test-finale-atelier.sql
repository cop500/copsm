-- Vérifier l'atelier "test finale" dans les deux tables
SELECT 'evenements' as table_name, id, titre, type_evenement, visible_inscription, statut
FROM evenements 
WHERE titre ILIKE '%test finale%'

UNION ALL

SELECT 'ateliers' as table_name, id, titre, 'atelier' as type_evenement, 
       CASE WHEN actif = true THEN true ELSE false END as visible_inscription,
       statut
FROM ateliers 
WHERE titre ILIKE '%test finale%';
