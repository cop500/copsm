-- Corriger l'affichage des capacités des ateliers
-- Vérifier d'abord les données actuelles
SELECT 
    id,
    titre,
    capacite_maximale,
    capacite_actuelle,
    visible_inscription,
    statut
FROM evenements
WHERE type_evenement = 'atelier'
ORDER BY created_at DESC;

-- Mettre à jour les capacités pour tous les ateliers
UPDATE evenements
SET 
    capacite_maximale = COALESCE(capacite_maximale, 25),
    capacite_actuelle = COALESCE(capacite_actuelle, 0),
    visible_inscription = COALESCE(visible_inscription, true),
    statut = COALESCE(statut, 'planifie')
WHERE type_evenement = 'atelier';

-- Vérifier le résultat
SELECT 
    id,
    titre,
    capacite_maximale,
    capacite_actuelle,
    visible_inscription,
    statut
FROM evenements
WHERE type_evenement = 'atelier'
ORDER BY created_at DESC;
