-- Script simplifié pour corriger les statistiques dupliquées

-- 1. Voir les demandes qui ont des statistiques dupliquées
SELECT 
    demande_id,
    COUNT(*) as nombre_duplicates
FROM statistiques_demandes
GROUP BY demande_id
HAVING COUNT(*) > 1
ORDER BY nombre_duplicates DESC;

-- 2. Supprimer les doublons en gardant seulement la plus récente
DELETE FROM statistiques_demandes 
WHERE id NOT IN (
    SELECT DISTINCT ON (demande_id) id
    FROM statistiques_demandes
    ORDER BY demande_id, created_at DESC
);

-- 3. Vérifier qu'il n'y a plus de doublons
SELECT 
    demande_id,
    COUNT(*) as nombre_duplicates
FROM statistiques_demandes
GROUP BY demande_id
HAVING COUNT(*) > 1;

-- 4. Supprimer la contrainte si elle existe (pour éviter l'erreur)
ALTER TABLE statistiques_demandes DROP CONSTRAINT IF EXISTS unique_demande_id;

-- 5. Ajouter la contrainte UNIQUE
ALTER TABLE statistiques_demandes ADD CONSTRAINT unique_demande_id UNIQUE (demande_id);

-- 6. Vérifier la structure finale
SELECT 
    demande_id,
    nombre_candidats,
    nombre_candidats_retenus,
    nombre_cv_envoyes,
    created_at,
    updated_at
FROM statistiques_demandes
ORDER BY created_at DESC
LIMIT 10; 