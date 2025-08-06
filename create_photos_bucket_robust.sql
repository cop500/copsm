-- Script robuste pour créer le bucket photos
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si le bucket existe déjà
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'photos') THEN
    -- Créer le bucket photos
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'photos',
      'photos',
      true,
      5242880, -- 5MB max par fichier
      ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    );
    
    RAISE NOTICE 'Bucket photos créé avec succès';
  ELSE
    RAISE NOTICE 'Bucket photos existe déjà';
  END IF;
END $$;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Permettre upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Permettre lecture photos" ON storage.objects;
DROP POLICY IF EXISTS "Permettre suppression photos" ON storage.objects;
DROP POLICY IF EXISTS "Permettre mise à jour photos" ON storage.objects;

-- 3. Créer les nouvelles politiques
CREATE POLICY "Permettre upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Permettre lecture photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'photos'
  );

CREATE POLICY "Permettre suppression photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos' AND 
    auth.uid() = owner
  );

CREATE POLICY "Permettre mise à jour photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'photos' AND 
    auth.uid() = owner
  );

-- 4. Vérification finale
SELECT 
  'Bucket photos configuré avec succès' as message,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'photos'; 