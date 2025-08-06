-- Diagnostic du bucket photos
-- À exécuter dans l'éditeur SQL de Supabase

-- Vérifier tous les buckets existants
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
ORDER BY created_at DESC;

-- Vérifier spécifiquement le bucket photos
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'photos') 
    THEN 'Bucket photos existe'
    ELSE 'Bucket photos N''EXISTE PAS'
  END as status_photos;

-- Vérifier les politiques pour le bucket photos
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND qual LIKE '%photos%' 
  OR with_check LIKE '%photos%';

-- Vérifier les permissions sur storage.objects
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'objects' 
  AND table_schema = 'storage'; 