-- ========================================
-- Script SQL pour vérifier et corriger le stockage Supabase
-- ========================================

-- 1. Vérifier les buckets existants
SELECT name, id, public, created_at, updated_at
FROM storage.buckets;

-- 2. Créer le bucket cv-stagiaires s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cv-stagiaires',
    'cv-stagiaires', 
    true,
    10485760, -- 10MB limit
    ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 3. Vérifier les politiques du bucket (table peut ne pas exister)
-- SELECT * FROM storage.policies WHERE bucket_id = 'cv-stagiaires';

-- 4. Créer une politique pour permettre l'upload anonyme
CREATE POLICY "Allow anonymous uploads" ON storage.objects
FOR INSERT 
TO anon, authenticated
WITH CHECK (bucket_id = 'cv-stagiaires');

-- 5. Créer une politique pour permettre la lecture publique
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT 
TO anon, authenticated
USING (bucket_id = 'cv-stagiaires');

-- 6. Vérifier les politiques créées (table peut ne pas exister)
-- SELECT * FROM storage.policies WHERE bucket_id = 'cv-stagiaires';
