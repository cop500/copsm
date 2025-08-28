-- Script pour corriger définitivement tous les pole_id invalides
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Voir tous les pôles disponibles
SELECT id, nom, code FROM poles ORDER BY nom;

-- 2. Identifier tous les événements avec des pole_id invalides
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
ORDER BY e.created_at DESC;

-- 3. Supprimer TOUS les pole_id invalides (NULL ou inexistants)
UPDATE evenements 
SET pole_id = NULL
WHERE actif = true
  AND (pole_id IS NULL OR pole_id NOT IN (SELECT id FROM poles));

-- 4. Assigner le pôle AGRICULTURE à TOUS les événements sans pôle
UPDATE evenements 
SET pole_id = (SELECT id FROM poles WHERE nom = 'AGRICULTURE' LIMIT 1)
WHERE actif = true AND pole_id IS NULL;

-- 5. Vérifier le résultat final
SELECT 
  COALESCE(p.nom, 'Sans pôle assigné') as pole_nom,
  COUNT(*) as nombre_evenements
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
GROUP BY p.nom, p.id
ORDER BY nombre_evenements DESC;

-- 6. Vérifier quelques événements spécifiques
SELECT 
  e.id,
  e.titre,
  p.nom as pole_nom,
  e.updated_at
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
ORDER BY e.updated_at DESC
LIMIT 10;
