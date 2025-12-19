-- ========================================
-- Vérification complète et fix final
-- ========================================

-- 1. Vérifier l'état actuel
DO $$
DECLARE
    default_val TEXT;
    constraint_def TEXT;
    constraint_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VÉRIFICATION COMPLÈTE';
    RAISE NOTICE '========================================';
    
    -- Valeur par défaut
    SELECT column_default INTO default_val
    FROM information_schema.columns
    WHERE table_name = 'inscriptions_ateliers'
    AND column_name = 'statut'
    AND table_schema = 'public';
    
    RAISE NOTICE 'Valeur par défaut : %', COALESCE(default_val, 'NULL');
    
    -- Contrainte
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
    AND rel.relname = 'inscriptions_ateliers'
    AND con.contype = 'c'
    AND con.conkey IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM pg_attribute att
        WHERE att.attrelid = con.conrelid
        AND att.attnum = ANY(con.conkey)
        AND att.attname = 'statut'
    );
    
    SELECT pg_get_constraintdef(con.oid) INTO constraint_def
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
    AND rel.relname = 'inscriptions_ateliers'
    AND con.contype = 'c'
    AND con.conkey IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM pg_attribute att
        WHERE att.attrelid = con.conrelid
        AND att.attnum = ANY(con.conkey)
        AND att.attname = 'statut'
    )
    LIMIT 1;
    
    RAISE NOTICE 'Nombre de contraintes CHECK : %', constraint_count;
    RAISE NOTICE 'Définition contrainte : %', COALESCE(constraint_def, 'AUCUNE');
    
    -- Si la valeur par défaut n'est pas NULL, la corriger
    IF default_val IS NOT NULL AND default_val != 'NULL' THEN
        RAISE NOTICE '⚠️ Correction de la valeur par défaut...';
        ALTER TABLE inscriptions_ateliers
        ALTER COLUMN statut DROP DEFAULT;
        
        ALTER TABLE inscriptions_ateliers
        ALTER COLUMN statut SET DEFAULT NULL;
        
        RAISE NOTICE '✅ Valeur par défaut corrigée à NULL';
    END IF;
    
    -- Vérifier que la contrainte autorise NULL
    IF constraint_def IS NOT NULL AND constraint_def NOT LIKE '%NULL%' THEN
        RAISE WARNING '⚠️ La contrainte ne semble pas autoriser NULL !';
        RAISE WARNING 'Définition actuelle : %', constraint_def;
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- 2. Test d'insertion sans spécifier statut
DO $$
DECLARE
    test_atelier_id UUID;
    test_insert_id UUID;
BEGIN
    SELECT id INTO test_atelier_id
    FROM evenements
    WHERE type_evenement = 'atelier'
    AND visible_inscription = true
    LIMIT 1;
    
    IF test_atelier_id IS NULL THEN
        RAISE NOTICE '⚠️ Aucun atelier trouvé pour le test';
        RETURN;
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST : Insertion SANS champ statut';
    RAISE NOTICE '========================================';
    
    BEGIN
        INSERT INTO inscriptions_ateliers (
            atelier_id,
            stagiaire_nom,
            stagiaire_email,
            pole,
            filliere
        ) VALUES (
            test_atelier_id,
            'TEST_SANS_STATUT',
            'test-sans-statut@test.com',
            'TEST',
            'TEST'
        )
        RETURNING id INTO test_insert_id;
        
        RAISE NOTICE '✅ SUCCÈS : Insertion sans statut réussie !';
        RAISE NOTICE 'ID créé : %', test_insert_id;
        
        -- Vérifier la valeur
        DECLARE
            inserted_statut TEXT;
        BEGIN
            SELECT statut INTO inserted_statut
            FROM inscriptions_ateliers
            WHERE id = test_insert_id;
            
            RAISE NOTICE 'Valeur de statut après insertion : %', COALESCE(inserted_statut, 'NULL (correct)');
        END;
        
        -- Supprimer
        DELETE FROM inscriptions_ateliers WHERE id = test_insert_id;
        RAISE NOTICE 'Ligne de test supprimée.';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '❌ ERREUR : %', SQLERRM;
        RAISE WARNING 'Code : %', SQLSTATE;
    END;
    
    RAISE NOTICE '========================================';
END $$;

