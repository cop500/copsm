-- Création du bucket photos pour les événements
-- À exécuter dans l'éditeur SQL de Supabase

-- Créer le bucket photos s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  5242880, -- 5MB max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre l'upload de photos à tous les utilisateurs authentifiés
CREATE POLICY "Permettre upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos' AND 
    auth.role() = 'authenticated'
  );

-- Politique pour permettre la lecture des photos à tous (public)
CREATE POLICY "Permettre lecture photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'photos'
  );

-- Politique pour permettre la suppression des photos à l'utilisateur qui les a uploadées
CREATE POLICY "Permettre suppression photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos' AND 
    auth.uid() = owner
  );

-- Politique pour permettre la mise à jour des photos à l'utilisateur qui les a uploadées
CREATE POLICY "Permettre mise à jour photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'photos' AND 
    auth.uid() = owner
  );

-- Vérification de la création
SELECT 'Bucket photos créé avec succès' as status; 