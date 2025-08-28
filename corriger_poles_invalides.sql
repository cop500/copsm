-- Script pour corriger les pole_id invalides
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Identifier les événements avec des pole_id invalides
SELECT 
  e.id,
  e.titre,
  e.pole_id,
  CASE 
    WHEN e.pole_id IS NULL THEN 'NULL'
    WHEN p.id IS NULL THEN 'Pôle inexistant'
    ELSE 'Valide'
  END as statut_pole
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
ORDER BY e.created_at DESC;

-- 2. Supprimer les pole_id invalides (qui ne correspondent à aucun pôle)
UPDATE evenements 
SET pole_id = NULL
WHERE actif = true
  AND pole_id IS NOT NULL
  AND pole_id NOT IN (SELECT id FROM poles);

-- 3. Assigner le pôle AGRICULTURE aux événements sans pôle
UPDATE evenements 
SET pole_id = (SELECT id FROM poles WHERE nom = 'AGRICULTURE' LIMIT 1)
WHERE actif = true AND pole_id IS NULL;

-- 4. Vérifier le résultat final
SELECT 
  COALESCE(p.nom, 'Sans pôle assigné') as pole_nom,
  COUNT(*) as nombre_evenements
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
GROUP BY p.nom, p.id
ORDER BY nombre_evenements DESC;
