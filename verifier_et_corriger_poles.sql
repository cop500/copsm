-- Script pour vérifier et corriger définitivement les pôles
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier l'état actuel des pôles
SELECT 
  e.id,
  e.titre,
  e.pole_id,
  p.nom as pole_nom,
  CASE 
    WHEN e.pole_id IS NULL THEN 'NULL'
    WHEN p.id IS NULL THEN 'Pôle inexistant'
    ELSE 'Valide'
  END as statut_pole
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
ORDER BY e.created_at DESC
LIMIT 10;

-- 2. Voir tous les pôles disponibles
SELECT id, nom, code FROM poles ORDER BY nom;

-- 3. Nettoyer complètement et réassigner
-- Supprimer tous les pole_id invalides
UPDATE evenements 
SET pole_id = NULL
WHERE actif = true
  AND (pole_id IS NULL OR pole_id NOT IN (SELECT id FROM poles));

-- Assigner AGRICULTURE à tous les événements sans pôle
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

-- 5. Vérifier quelques événements spécifiques
SELECT 
  e.id,
  e.titre,
  p.nom as pole_nom,
  e.updated_at
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
ORDER BY e.updated_at DESC
LIMIT 5;
