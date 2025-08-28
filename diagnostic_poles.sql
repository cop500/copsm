-- Script de diagnostic pour les pôles et événements
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier tous les pôles existants
SELECT id, nom, code FROM poles ORDER BY nom;

-- 2. Vérifier les événements avec leurs pole_id
SELECT 
  e.id,
  e.titre,
  e.pole_id,
  p.nom as pole_nom,
  p.id as pole_id_from_poles
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
ORDER BY e.created_at DESC;

-- 3. Vérifier les événements qui ont un pole_id mais pas de correspondance
SELECT 
  e.id,
  e.titre,
  e.pole_id,
  'Pôle non trouvé' as statut
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true 
  AND e.pole_id IS NOT NULL 
  AND p.id IS NULL
ORDER BY e.created_at DESC;

-- 4. Compter les événements par pôle
SELECT 
  COALESCE(p.nom, 'Pôle inconnu') as pole_nom,
  COUNT(*) as nombre_evenements
FROM evenements e
LEFT JOIN poles p ON e.pole_id = p.id
WHERE e.actif = true
GROUP BY p.nom, p.id
ORDER BY nombre_evenements DESC;
