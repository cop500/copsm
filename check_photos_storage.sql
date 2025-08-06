-- Vérifier les photos stockées dans le bucket photos
-- À exécuter dans l'éditeur SQL de Supabase

-- Vérifier les objets dans le bucket photos
SELECT 
  id,
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'photos'
ORDER BY created_at DESC;

-- Compter le nombre de photos par événement
SELECT 
  name,
  COUNT(*) as nombre_photos
FROM storage.objects 
WHERE bucket_id = 'photos'
GROUP BY name
ORDER BY nombre_photos DESC;

-- Vérifier les permissions sur le bucket photos
SELECT 
  bucket_id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'photos';

-- Vérifier les politiques RLS sur storage.objects
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'; 