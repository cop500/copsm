-- Script complet pour corriger la table inscriptions_ateliers
-- Ajouter toutes les colonnes manquantes

-- Vérifier et ajouter la colonne email
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE inscriptions_ateliers ADD COLUMN email TEXT;
        RAISE NOTICE 'Colonne email ajoutée';
    ELSE
        RAISE NOTICE 'Colonne email existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne filliere
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'filliere'
    ) THEN
        ALTER TABLE inscriptions_ateliers ADD COLUMN filliere TEXT;
        RAISE NOTICE 'Colonne filliere ajoutée';
    ELSE
        RAISE NOTICE 'Colonne filliere existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne pole
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'pole'
    ) THEN
        ALTER TABLE inscriptions_ateliers ADD COLUMN pole TEXT;
        RAISE NOTICE 'Colonne pole ajoutée';
    ELSE
        RAISE NOTICE 'Colonne pole existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne telephone
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'telephone'
    ) THEN
        ALTER TABLE inscriptions_ateliers ADD COLUMN telephone TEXT;
        RAISE NOTICE 'Colonne telephone ajoutée';
    ELSE
        RAISE NOTICE 'Colonne telephone existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne nom
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'nom'
    ) THEN
        ALTER TABLE inscriptions_ateliers ADD COLUMN nom TEXT;
        RAISE NOTICE 'Colonne nom ajoutée';
    ELSE
        RAISE NOTICE 'Colonne nom existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne date_inscription si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'date_inscription'
    ) THEN
        ALTER TABLE inscriptions_ateliers ADD COLUMN date_inscription TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Colonne date_inscription ajoutée';
    ELSE
        RAISE NOTICE 'Colonne date_inscription existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne statut si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'statut'
    ) THEN
        ALTER TABLE inscriptions_ateliers ADD COLUMN statut TEXT DEFAULT 'en_attente';
        RAISE NOTICE 'Colonne statut ajoutée';
    ELSE
        RAISE NOTICE 'Colonne statut existe déjà';
    END IF;
END $$;

-- Afficher la structure finale de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inscriptions_ateliers' 
ORDER BY ordinal_position; 