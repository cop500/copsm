-- Script pour corriger temporairement l'affichage des pôles dans le bilan
-- À exécuter dans l'éditeur SQL de Supabase

-- Assigner temporairement le pôle AGRICULTURE à tous les événements sans pôle
-- (Vous pourrez ensuite modifier manuellement chaque événement)
UPDATE evenements 
SET pole_id = (SELECT id FROM poles WHERE nom = 'AGRICULTURE' LIMIT 1)
WHERE actif = true AND pole_id IS NULL;

-- Vérifier que tous les événements ont maintenant un pôle assigné
SELECT 
  COALESCE(p.nom, 'Sans pôle assigné') as pole_nom,
  COUNT(*) as nombre_evenements
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
GROUP BY p.nom, p.id
ORDER BY nombre_evenements DESC;
