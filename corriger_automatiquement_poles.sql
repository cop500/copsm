-- Script pour corriger automatiquement les événements sans pôle assigné
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Voir tous les pôles disponibles pour choisir le pôle par défaut
SELECT id, nom, code FROM poles ORDER BY nom;

-- 2. Assigner le premier pôle disponible aux événements sans pôle
-- (Remplacez l'ID du pôle par celui que vous voulez utiliser par défaut)
UPDATE evenements 
SET pole_id = (SELECT id FROM poles WHERE nom = 'AGRICULTURE' LIMIT 1)
WHERE actif = true AND pole_id IS NULL;

-- 3. Vérifier le résultat après correction
SELECT 
  COALESCE(p.nom, 'Sans pôle assigné') as pole_nom,
  COUNT(*) as nombre_evenements
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
GROUP BY p.nom, p.id
ORDER BY nombre_evenements DESC;

-- 4. Voir quelques exemples d'événements corrigés
SELECT 
  e.id,
  e.titre,
  p.nom as pole_nom,
  e.created_at
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
ORDER BY e.created_at DESC
LIMIT 10;
