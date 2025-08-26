-- Script pour nettoyer les doublons sémantiques dans les types d'événements
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. D'abord, vérifier les types similaires
SELECT 
  id,
  nom,
  code,
  actif,
  created_at
FROM event_types 
WHERE nom ILIKE '%visite%' OR nom ILIKE '%entreprise%'
ORDER BY nom, created_at;

-- 2. Mettre à jour les événements qui utilisent l'ancien type "Visite Entreprise"
-- pour qu'ils utilisent "Visite d'Entreprise" (le plus récent)
UPDATE evenements 
SET type_evenement_id = (
  SELECT id FROM event_types 
  WHERE nom = 'Visite d''Entreprise' 
  LIMIT 1
)
WHERE type_evenement_id = (
  SELECT id FROM event_types 
  WHERE nom = 'Visite Entreprise' 
  LIMIT 1
);

-- 3. Supprimer l'ancien type "Visite Entreprise"
DELETE FROM event_types 
WHERE nom = 'Visite Entreprise';

-- 4. Vérifier le résultat
SELECT 
  id,
  nom,
  code,
  actif,
  created_at
FROM event_types 
ORDER BY nom, created_at;

-- 5. Vérifier qu'aucun événement n'utilise plus l'ancien type
SELECT 
  e.id,
  e.titre,
  e.type_evenement_id,
  et.nom as type_nom
FROM evenements e
LEFT JOIN event_types et ON e.type_evenement_id = et.id
WHERE et.nom IS NULL OR et.nom = 'Visite Entreprise';
