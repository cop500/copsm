-- Script pour créer et configurer le bucket de stockage pour les CV des stagiaires

-- 1. Vérifier si le bucket existe
SELECT name, public FROM storage.buckets WHERE name = 'cv-stagiaires';

-- 2. Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-stagiaires',
  'cv-stagiaires',
  true,
  5242880, -- 5MB en bytes
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 3. Créer les politiques RLS pour le bucket
-- Politique pour permettre l'upload de fichiers PDF
CREATE POLICY "Permettre upload CV stagiaires" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cv-stagiaires' AND
  (storage.extension(name)) = 'pdf' AND
  octet_length(DECODE(SUBSTRING(file FROM 1), 'base64')) <= 5242880
);

-- Politique pour permettre la lecture publique des CV
CREATE POLICY "Permettre lecture publique CV" ON storage.objects
FOR SELECT USING (bucket_id = 'cv-stagiaires');

-- 4. Vérifier les politiques existantes
SELECT * FROM storage.policies WHERE bucket_id = 'cv-stagiaires';

-- 5. Vérifier la structure de la table candidatures_stagiaires
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'candidatures_stagiaires' 
ORDER BY ordinal_position; 