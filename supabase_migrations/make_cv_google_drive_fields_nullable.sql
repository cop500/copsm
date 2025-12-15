-- ========================================
-- Migration : Rendre les champs Google Drive nullable
-- ========================================
-- Permet de ne plus utiliser Google Drive sans erreur de contrainte

-- 1. Rendre cv_google_drive_id nullable
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_connect_submissions' 
        AND column_name = 'cv_google_drive_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE cv_connect_submissions 
        ALTER COLUMN cv_google_drive_id DROP NOT NULL;
        
        RAISE NOTICE 'Colonne cv_google_drive_id rendue nullable';
    ELSE
        RAISE NOTICE 'Colonne cv_google_drive_id déjà nullable ou n''existe pas';
    END IF;
END $$;

-- 2. Rendre cv_google_drive_url nullable
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_connect_submissions' 
        AND column_name = 'cv_google_drive_url'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE cv_connect_submissions 
        ALTER COLUMN cv_google_drive_url DROP NOT NULL;
        
        RAISE NOTICE 'Colonne cv_google_drive_url rendue nullable';
    ELSE
        RAISE NOTICE 'Colonne cv_google_drive_url déjà nullable ou n''existe pas';
    END IF;
END $$;

-- 3. Vérification
SELECT 
    'Migration terminée' as status,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'cv_connect_submissions' 
AND column_name IN ('cv_google_drive_id', 'cv_google_drive_url', 'cv_storage_path', 'cv_storage_url')
ORDER BY column_name;

