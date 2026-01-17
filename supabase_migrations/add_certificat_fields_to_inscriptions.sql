-- ========================================
-- Migration : Ajouter les champs de certificat à la table inscriptions_ateliers
-- ========================================
-- Cette migration ajoute les colonnes nécessaires pour gérer les certificats de participation
-- - present : indique si le stagiaire était présent (validé par l'animateur)
-- - date_validation_presence : date de validation de la présence
-- - certificat_token : token unique pour le lien de téléchargement du certificat
-- - date_generation_certificat : date de génération du certificat

DO $$
BEGIN
    -- Ajouter la colonne present si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'present'
    ) THEN
        ALTER TABLE inscriptions_ateliers 
        ADD COLUMN present BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN inscriptions_ateliers.present IS 
        'Indique si le stagiaire était présent à l''atelier (validé par l''animateur)';
        
        RAISE NOTICE 'Colonne present ajoutée';
    ELSE
        RAISE NOTICE 'Colonne present existe déjà';
    END IF;

    -- Ajouter la colonne date_validation_presence si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'date_validation_presence'
    ) THEN
        ALTER TABLE inscriptions_ateliers 
        ADD COLUMN date_validation_presence TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN inscriptions_ateliers.date_validation_presence IS 
        'Date et heure de validation de la présence par l''animateur';
        
        RAISE NOTICE 'Colonne date_validation_presence ajoutée';
    ELSE
        RAISE NOTICE 'Colonne date_validation_presence existe déjà';
    END IF;

    -- Ajouter la colonne certificat_token si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'certificat_token'
    ) THEN
        ALTER TABLE inscriptions_ateliers 
        ADD COLUMN certificat_token UUID UNIQUE;
        
        COMMENT ON COLUMN inscriptions_ateliers.certificat_token IS 
        'Token unique pour accéder au lien de téléchargement du certificat';
        
        RAISE NOTICE 'Colonne certificat_token ajoutée';
    ELSE
        RAISE NOTICE 'Colonne certificat_token existe déjà';
    END IF;

    -- Ajouter la colonne date_generation_certificat si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'date_generation_certificat'
    ) THEN
        ALTER TABLE inscriptions_ateliers 
        ADD COLUMN date_generation_certificat TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN inscriptions_ateliers.date_generation_certificat IS 
        'Date et heure de génération du certificat';
        
        RAISE NOTICE 'Colonne date_generation_certificat ajoutée';
    ELSE
        RAISE NOTICE 'Colonne date_generation_certificat existe déjà';
    END IF;

    -- Créer un index sur certificat_token pour améliorer les performances des recherches
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'inscriptions_ateliers' 
        AND indexname = 'idx_inscriptions_certificat_token'
    ) THEN
        CREATE INDEX idx_inscriptions_certificat_token 
        ON inscriptions_ateliers(certificat_token) 
        WHERE certificat_token IS NOT NULL;
        
        RAISE NOTICE 'Index idx_inscriptions_certificat_token créé';
    ELSE
        RAISE NOTICE 'Index idx_inscriptions_certificat_token existe déjà';
    END IF;

    -- Créer un index sur present pour les recherches de présences validées
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'inscriptions_ateliers' 
        AND indexname = 'idx_inscriptions_present'
    ) THEN
        CREATE INDEX idx_inscriptions_present 
        ON inscriptions_ateliers(present) 
        WHERE present = TRUE;
        
        RAISE NOTICE 'Index idx_inscriptions_present créé';
    ELSE
        RAISE NOTICE 'Index idx_inscriptions_present existe déjà';
    END IF;
END $$;

-- Vérification de la structure finale
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inscriptions_ateliers' 
AND column_name IN ('present', 'date_validation_presence', 'certificat_token', 'date_generation_certificat')
ORDER BY ordinal_position;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée : Les champs de certificat ont été ajoutés à la table inscriptions_ateliers.';
END $$;

