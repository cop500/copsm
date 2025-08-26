-- Script pour vérifier et nettoyer les types d'événements dupliqués
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les doublons par nom
SELECT 
  nom,
  COUNT(*) as nombre_occurrences,
  array_agg(id) as ids,
  array_agg(actif) as statuts_actifs
FROM event_types 
GROUP BY nom 
HAVING COUNT(*) > 1
ORDER BY nom;

-- 2. Vérifier les doublons par code
SELECT 
  code,
  COUNT(*) as nombre_occurrences,
  array_agg(id) as ids,
  array_agg(nom) as noms
FROM event_types 
GROUP BY code 
HAVING COUNT(*) > 1
ORDER BY code;

-- 3. Afficher tous les types d'événements pour vérification
SELECT 
  id,
  nom,
  code,
  actif,
  created_at
FROM event_types 
ORDER BY nom, created_at;

-- 4. Supprimer les doublons (garder le plus récent et actif)
-- ATTENTION: Exécuter seulement après avoir vérifié les résultats ci-dessus

-- Supprimer les doublons par nom (garder le plus récent)
DELETE FROM event_types 
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY nom ORDER BY created_at DESC, actif DESC) as rn
    FROM event_types
  ) t
  WHERE t.rn > 1
);

-- 5. Vérifier le résultat après nettoyage
SELECT 
  id,
  nom,
  code,
  actif,
  created_at
FROM event_types 
ORDER BY nom, created_at;
