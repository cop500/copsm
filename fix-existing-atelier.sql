-- Corriger l'atelier existant pour qu'il ait des places disponibles
UPDATE ateliers 
SET 
    capacite_actuelle = 0,
    capacite_maximale = 20,
    statut = 'planifie',
    actif = true
WHERE titre ILIKE '%PITCHER%' OR titre ILIKE '%LOGO%';

-- Vérifier le résultat
SELECT 
    id, 
    titre, 
    statut, 
    actif,
    capacite_maximale,
    capacite_actuelle
FROM ateliers 
WHERE actif = true
ORDER BY created_at DESC;
