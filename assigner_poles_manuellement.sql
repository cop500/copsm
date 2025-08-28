-- Script pour assigner manuellement les pôles selon le type d'événement
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Voir les types d'événements et leurs pôles actuels
SELECT 
  e.id,
  e.titre,
  e.volet,
  et.nom as type_evenement,
  p.nom as pole_actuel
FROM evenements e
LEFT JOIN event_types et ON e.type_evenement_id = et.id
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true AND e.pole_id IS NULL
ORDER BY e.created_at DESC;

-- 2. Assigner des pôles selon le volet de l'événement
-- (Modifiez les règles selon vos besoins)

-- Exemple : Assigner AGRICULTURE aux événements d'information/communication
UPDATE evenements 
SET pole_id = (SELECT id FROM poles WHERE nom = 'AGRICULTURE' LIMIT 1)
WHERE actif = true 
  AND pole_id IS NULL 
  AND volet = 'information_communication';

-- Exemple : Assigner un autre pôle aux événements d'accompagnement
-- UPDATE evenements 
-- SET pole_id = (SELECT id FROM poles WHERE nom = 'AUTRE_POLE' LIMIT 1)
-- WHERE actif = true 
--   AND pole_id IS NULL 
--   AND volet = 'accompagnement_projets';

-- 3. Vérifier le résultat
SELECT 
  COALESCE(p.nom, 'Sans pôle assigné') as pole_nom,
  COUNT(*) as nombre_evenements
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
GROUP BY p.nom, p.id
ORDER BY nombre_evenements DESC;
