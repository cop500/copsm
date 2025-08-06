-- Script pour corriger la table inscriptions_ateliers
-- Ajouter la colonne email manquante

-- Vérifier si la colonne email existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inscriptions_ateliers' 
        AND column_name = 'email'
    ) THEN
        -- Ajouter la colonne email
        ALTER TABLE inscriptions_ateliers ADD COLUMN email TEXT;
        
        -- Mettre à jour les données existantes si stagiaire_email existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'inscriptions_ateliers' 
            AND column_name = 'stagiaire_email'
        ) THEN
            UPDATE inscriptions_ateliers 
            SET email = stagiaire_email 
            WHERE email IS NULL AND stagiaire_email IS NOT NULL;
        END IF;
        
        RAISE NOTICE 'Colonne email ajoutée avec succès';
    ELSE
        RAISE NOTICE 'La colonne email existe déjà';
    END IF;
END $$;

-- Vérifier la structure actuelle
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'inscriptions_ateliers' 
ORDER BY ordinal_position; 