-- Corriger l'atelier existant avec les colonnes disponibles
UPDATE ateliers 
SET 
    statut = 'planifie',
    actif = true
WHERE titre ILIKE '%PITCHER%' OR titre ILIKE '%LOGO%';

-- Vérifier le résultat
SELECT 
    id, 
    titre, 
    statut, 
    actif,
    date_debut,
    date_fin,
    lieu
FROM ateliers 
WHERE actif = true
ORDER BY created_at DESC;
