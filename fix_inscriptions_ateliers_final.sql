-- Script final pour corriger la table inscriptions_ateliers
-- Corriger tous les noms de colonnes et contraintes

-- 1. Vérifier la structure actuelle
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'inscriptions_ateliers' 
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes manquantes avec les bons noms
DO $$
BEGIN
    -- Colonne stagiaire_nom (au lieu de nom)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'stagiaire_nom'
    ) THEN
        ALTER TABLE inscriptions_ateliers ADD COLUMN stagiaire_nom TEXT;
        RAISE NOTICE 'Colonne stagiaire_nom ajoutée';
    ELSE
        RAISE NOTICE 'Colonne stagiaire_nom existe déjà';
    END IF;

    -- Colonne stagiaire_email (au lieu de email)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'stagiaire_email'
    ) THEN
        ALTER TABLE inscriptions_ateliers ADD COLUMN stagiaire_email TEXT;
        RAISE NOTICE 'Colonne stagiaire_email ajoutée';
    ELSE
        RAISE NOTICE 'Colonne stagiaire_email existe déjà';
    END IF;

    -- Colonne stagiaire_telephone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'stagiaire_telephone'
    ) THEN
        ALTER TABLE inscriptions_ateliers ADD COLUMN stagiaire_telephone TEXT;
        RAISE NOTICE 'Colonne stagiaire_telephone ajoutée';
    ELSE
        RAISE NOTICE 'Colonne stagiaire_telephone existe déjà';
    END IF;

    -- Colonne pole
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

    -- Colonne filliere
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

    -- Colonne date_inscription
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

    -- Colonne statut
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

-- 3. Supprimer les anciennes colonnes si elles existent
DO $$
BEGIN
    -- Supprimer la colonne nom si elle existe (remplacée par stagiaire_nom)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'nom'
    ) THEN
        ALTER TABLE inscriptions_ateliers DROP COLUMN nom;
        RAISE NOTICE 'Colonne nom supprimée (remplacée par stagiaire_nom)';
    END IF;

    -- Supprimer la colonne email si elle existe (remplacée par stagiaire_email)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE inscriptions_ateliers DROP COLUMN email;
        RAISE NOTICE 'Colonne email supprimée (remplacée par stagiaire_email)';
    END IF;

    -- Supprimer la colonne telephone si elle existe (remplacée par stagiaire_telephone)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'telephone'
    ) THEN
        ALTER TABLE inscriptions_ateliers DROP COLUMN telephone;
        RAISE NOTICE 'Colonne telephone supprimée (remplacée par stagiaire_telephone)';
    END IF;
END $$;

-- 4. Afficher la structure finale
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inscriptions_ateliers' 
ORDER BY ordinal_position; 