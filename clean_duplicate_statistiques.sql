-- Nettoyage des statistiques dupliquées

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

-- 4. Ajouter la contrainte UNIQUE (supprimer d'abord si elle existe)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_demande_id' 
        AND table_name = 'statistiques_demandes'
    ) THEN
        ALTER TABLE statistiques_demandes DROP CONSTRAINT unique_demande_id;
    END IF;
    
    ALTER TABLE statistiques_demandes ADD CONSTRAINT unique_demande_id UNIQUE (demande_id);
EXCEPTION
    WHEN duplicate_object THEN
        -- La contrainte existe déjà, on ne fait rien
        NULL;
END $$;

-- 5. Vérifier la structure finale
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