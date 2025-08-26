-- Script global pour nettoyer tous les doublons sémantiques dans les types d'événements
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. D'abord, afficher tous les types d'événements pour identification
SELECT 
  id,
  nom,
  code,
  actif,
  created_at
FROM event_types 
ORDER BY nom, created_at;

-- 2. Identifier les groupes de types similaires
-- Job Day / Job Dating
-- Visite d'Entreprise / Visite Entreprise
-- Et autres doublons potentiels

-- 3. Mettre à jour les événements pour utiliser les types standardisés
-- Job Day -> Job Day (garder le plus récent)
UPDATE evenements 
SET type_evenement_id = (
  SELECT id FROM event_types 
  WHERE nom = 'Job Day' 
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE type_evenement_id IN (
  SELECT id FROM event_types 
  WHERE nom ILIKE '%job%' AND nom != 'Job Day'
);

-- Visite Entreprise -> Visite d'Entreprise
UPDATE evenements 
SET type_evenement_id = (
  SELECT id FROM event_types 
  WHERE nom = 'Visite d''Entreprise' 
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE type_evenement_id IN (
  SELECT id FROM event_types 
  WHERE nom ILIKE '%visite%' AND nom != 'Visite d''Entreprise'
);

-- 4. Supprimer les types dupliqués
-- Supprimer les anciens types Job (garder Job Day)
DELETE FROM event_types 
WHERE nom ILIKE '%job%' AND nom != 'Job Day';

-- Supprimer les anciens types Visite (garder Visite d'Entreprise)
DELETE FROM event_types 
WHERE nom ILIKE '%visite%' AND nom != 'Visite d''Entreprise';

-- 5. Vérifier le résultat final
SELECT 
  id,
  nom,
  code,
  actif,
  created_at
FROM event_types 
ORDER BY nom, created_at;

-- 6. Vérifier qu'aucun événement n'utilise de types supprimés
SELECT 
  e.id,
  e.titre,
  e.type_evenement_id,
  et.nom as type_nom
FROM evenements e
LEFT JOIN event_types et ON e.type_evenement_id = et.id
WHERE et.nom IS NULL;

-- 7. Compter les événements par type pour vérification
SELECT 
  et.nom as type_evenement,
  COUNT(e.id) as nombre_evenements
FROM event_types et
LEFT JOIN evenements e ON et.id = e.type_evenement_id
GROUP BY et.id, et.nom
ORDER BY et.nom;
