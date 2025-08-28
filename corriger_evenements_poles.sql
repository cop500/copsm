-- Script pour corriger les événements avec des pôles invalides
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Voir tous les pôles disponibles
SELECT id, nom, code FROM poles ORDER BY nom;

-- 2. Identifier les événements avec des pole_id invalides
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

-- 3. Mettre à jour les événements avec pole_id NULL pour les assigner au premier pôle disponible
-- (Décommentez et modifiez l'ID du pôle selon vos besoins)
/*
UPDATE evenements 
SET pole_id = (SELECT id FROM poles LIMIT 1)
WHERE actif = true AND pole_id IS NULL;
*/

-- 4. Supprimer les pole_id invalides (qui ne correspondent à aucun pôle)
-- (Décommentez si vous voulez supprimer les références invalides)
/*
UPDATE evenements 
SET pole_id = NULL
WHERE actif = true 
  AND pole_id IS NOT NULL 
  AND pole_id NOT IN (SELECT id FROM poles);
*/

-- 5. Vérifier le résultat après correction
SELECT 
  COALESCE(p.nom, 'Sans pôle assigné') as pole_nom,
  COUNT(*) as nombre_evenements
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
GROUP BY p.nom, p.id
ORDER BY nombre_evenements DESC;
