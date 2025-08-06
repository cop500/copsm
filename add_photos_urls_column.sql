-- ========================================
-- Script pour ajouter la colonne photos_urls à la table evenements
-- ========================================

-- Vérifier d'abord la structure actuelle de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'evenements'
ORDER BY ordinal_position;

-- Ajouter la colonne photos_urls si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evenements' AND column_name = 'photos_urls'
    ) THEN
        ALTER TABLE evenements ADD COLUMN photos_urls TEXT[];
    END IF;
END $$;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'evenements' AND column_name = 'photos_urls';

-- Créer le bucket de stockage pour les photos si nécessaire
-- (Cette commande doit être exécutée dans l'interface Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Politique RLS pour le bucket photos (à exécuter dans Supabase)
-- Permettre la lecture publique des photos
-- CREATE POLICY "Photos are publicly accessible" ON storage.objects
-- FOR SELECT USING (bucket_id = 'photos');

-- Permettre l'upload pour les utilisateurs authentifiés
-- CREATE POLICY "Authenticated users can upload photos" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

-- Permettre la suppression pour les utilisateurs authentifiés
-- CREATE POLICY "Authenticated users can delete photos" ON storage.objects
-- FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated'); 