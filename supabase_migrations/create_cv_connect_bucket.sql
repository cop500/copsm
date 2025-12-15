-- ========================================
-- Migration : Créer le bucket cv-connect pour Supabase Storage
-- ========================================
-- Permet de stocker les CV directement dans Supabase Storage

-- 1. Créer le bucket cv-connect s'il n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'cv-connect') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'cv-connect',
      'cv-connect',
      true, -- Public pour permettre l'accès aux CV
      5242880, -- 5MB max par fichier
      ARRAY['application/pdf'] -- Seuls les PDF sont autorisés
    );
    
    RAISE NOTICE 'Bucket cv-connect créé avec succès';
  ELSE
    RAISE NOTICE 'Bucket cv-connect existe déjà';
  END IF;
END $$;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Permettre upload CV public" ON storage.objects;
DROP POLICY IF EXISTS "Permettre lecture CV public" ON storage.objects;
DROP POLICY IF EXISTS "Permettre suppression CV admin" ON storage.objects;

-- 3. Créer une politique pour permettre l'upload depuis l'API (service role)
-- Note: L'upload se fait via l'API avec service role key, donc pas besoin de politique publique
-- Mais on peut en créer une pour permettre l'upload direct si nécessaire
CREATE POLICY "Permettre upload CV public" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'cv-connect'
  );

-- 4. Créer une politique pour permettre la lecture publique des CV
CREATE POLICY "Permettre lecture CV public" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'cv-connect'
  );

-- 5. Créer une politique pour permettre la suppression par les admins
CREATE POLICY "Permettre suppression CV admin" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'cv-connect' AND 
    auth.role() = 'authenticated'
  );

-- 6. Vérification
SELECT 
  'Bucket cv-connect configuré avec succès' as message,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'cv-connect';

