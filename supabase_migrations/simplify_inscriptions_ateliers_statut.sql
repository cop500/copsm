-- ========================================
-- Migration : Simplifier les statuts des inscriptions ateliers
-- ========================================
-- Supprime les statuts "en_attente" et "confirme" pour simplifier la gestion
-- Seul le statut "annule" est conservé pour les inscriptions annulées
-- Toutes les autres inscriptions sont considérées comme actives

DO $$
BEGIN
    -- Mettre à jour toutes les inscriptions "en_attente" et "confirme" en supprimant le statut
    -- (NULL = inscription active)
    UPDATE inscriptions_ateliers
    SET statut = NULL
    WHERE statut IN ('en_attente', 'confirme');

    RAISE NOTICE 'Statuts simplifiés : toutes les inscriptions actives ont maintenant statut NULL.';
    
    -- Vérifier s'il y a des inscriptions avec d'autres statuts non prévus
    IF EXISTS (
        SELECT 1 FROM inscriptions_ateliers 
        WHERE statut IS NOT NULL AND statut != 'annule'
    ) THEN
        RAISE NOTICE 'Attention : Il existe des inscriptions avec des statuts non standard.';
    END IF;
END $$;

-- Mettre à jour la contrainte CHECK pour ne permettre que NULL ou 'annule'
-- Note: Si la contrainte existe déjà, on la supprime et on la recrée
DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    -- Chercher toutes les contraintes CHECK sur la colonne statut
    FOR constraint_name_var IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'inscriptions_ateliers'
        AND tc.constraint_type = 'CHECK'
        AND ccu.column_name = 'statut'
    LOOP
        -- Supprimer chaque contrainte trouvée
        EXECUTE format('ALTER TABLE inscriptions_ateliers DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
        RAISE NOTICE 'Contrainte CHECK supprimée : %', constraint_name_var;
    END LOOP;
    
    -- Créer la nouvelle contrainte simplifiée
    ALTER TABLE inscriptions_ateliers
    ADD CONSTRAINT inscriptions_ateliers_statut_check
    CHECK (statut IS NULL OR statut = 'annule');
    
    RAISE NOTICE 'Nouvelle contrainte CHECK créée : statut peut être NULL (inscription active) ou ''annule''.';
END $$;

-- Mettre à jour le commentaire de la colonne
COMMENT ON COLUMN inscriptions_ateliers.statut IS 
'Statut de l''inscription : NULL = inscription active, ''annule'' = inscription annulée. Les statuts "en_attente" et "confirme" ont été supprimés pour simplifier la gestion.';

-- Mettre à jour la valeur par défaut de la colonne (NULL au lieu de 'confirme')
ALTER TABLE inscriptions_ateliers
ALTER COLUMN statut SET DEFAULT NULL;

-- Message final
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée : Les inscriptions sont maintenant simplifiées (NULL = active, ''annule'' = annulée).';
END $$;

