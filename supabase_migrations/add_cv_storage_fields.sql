-- ========================================
-- Migration : Ajouter les champs pour stockage Supabase Storage
-- ========================================
-- Remplace temporairement Google Drive par Supabase Storage pour CV Connect

-- 1. Ajouter cv_storage_path si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_connect_submissions' 
        AND column_name = 'cv_storage_path'
    ) THEN
        ALTER TABLE cv_connect_submissions 
        ADD COLUMN cv_storage_path TEXT;
        
        COMMENT ON COLUMN cv_connect_submissions.cv_storage_path IS 
        'Chemin du fichier CV dans Supabase Storage (ex: cv-connect/pole/filiere/fichier.pdf)';
    END IF;
END $$;

-- 2. Ajouter cv_storage_url si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_connect_submissions' 
        AND column_name = 'cv_storage_url'
    ) THEN
        ALTER TABLE cv_connect_submissions 
        ADD COLUMN cv_storage_url TEXT;
        
        COMMENT ON COLUMN cv_connect_submissions.cv_storage_url IS 
        'URL publique du fichier CV dans Supabase Storage';
    END IF;
END $$;

-- 3. Créer le bucket Supabase Storage si nécessaire (à faire manuellement dans Supabase Dashboard)
-- Le bucket doit s'appeler 'cv-connect' et être public pour permettre l'accès aux CV

-- 4. Vérification
SELECT 
    'Migration terminée' as status,
    COUNT(*) FILTER (WHERE cv_storage_path IS NOT NULL) as cvs_avec_storage_path,
    COUNT(*) FILTER (WHERE cv_storage_url IS NOT NULL) as cvs_avec_storage_url,
    COUNT(*) as total_submissions
FROM cv_connect_submissions;

