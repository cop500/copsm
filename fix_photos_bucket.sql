-- Script pour corriger l'accès public aux photos dans Supabase Storage
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket 'photos' s'il n'existe pas
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'photos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('photos', 'photos', true);
  END IF;
END $$;

-- 2. Supprimer les anciennes politiques s'il y en a
DROP POLICY IF EXISTS "Photos publiques" ON storage.objects;
DROP POLICY IF EXISTS "Accès public aux photos" ON storage.objects;

-- 3. Créer une politique pour permettre l'accès public aux photos
CREATE POLICY "Accès public aux photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'photos' 
  AND (storage.foldername(name))[1] = 'evenements'
);

-- 4. Créer une politique pour permettre l'upload de photos (pour les utilisateurs authentifiés)
CREATE POLICY "Upload photos authentifiés" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'photos' 
  AND auth.role() = 'authenticated'
);

-- 5. Créer une politique pour permettre la suppression de photos (pour les utilisateurs authentifiés)
CREATE POLICY "Suppression photos authentifiés" ON storage.objects
FOR DELETE USING (
  bucket_id = 'photos' 
  AND auth.role() = 'authenticated'
);

-- 6. Vérifier que le bucket est bien public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'photos';

-- 7. Afficher la configuration pour vérification
SELECT 
  id as bucket_id,
  name as bucket_name,
  public as is_public
FROM storage.buckets 
WHERE id = 'photos';
