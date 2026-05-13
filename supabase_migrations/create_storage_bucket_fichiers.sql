-- Bucket Storage public « fichiers » (demandes entreprise, conventions partenariat, etc.)
-- À exécuter sur Supabase (SQL Editor) si l’erreur « Bucket not found » apparaît à l’upload.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'fichiers') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'fichiers',
      'fichiers',
      true,
      52428800, -- 50 Mo max par objet
      NULL -- types MIME : restreindre au besoin dans le dashboard Supabase (ex. PDF uniquement)
    );
    RAISE NOTICE 'Bucket fichiers créé';
  ELSE
    RAISE NOTICE 'Bucket fichiers déjà présent';
  END IF;
END $$;

-- Politiques (idempotentes)
DROP POLICY IF EXISTS "fichiers select public" ON storage.objects;
CREATE POLICY "fichiers select public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'fichiers');

DROP POLICY IF EXISTS "fichiers insert anon" ON storage.objects;
CREATE POLICY "fichiers insert anon"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'fichiers');

DROP POLICY IF EXISTS "fichiers insert authenticated" ON storage.objects;
CREATE POLICY "fichiers insert authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'fichiers');

DROP POLICY IF EXISTS "fichiers update authenticated" ON storage.objects;
CREATE POLICY "fichiers update authenticated"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'fichiers')
  WITH CHECK (bucket_id = 'fichiers');

DROP POLICY IF EXISTS "fichiers delete authenticated" ON storage.objects;
CREATE POLICY "fichiers delete authenticated"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'fichiers');
