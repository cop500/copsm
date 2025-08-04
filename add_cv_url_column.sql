-- Ajouter la colonne cv_url à la table candidatures_stagiaires
ALTER TABLE candidatures_stagiaires 
ADD COLUMN cv_url TEXT;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'candidatures_stagiaires' AND column_name = 'cv_url';

-- Mettre à jour les politiques RLS si nécessaire
-- Permettre l'insertion et la mise à jour de cv_url
ALTER POLICY "Enable insert for authenticated users only" ON candidatures_stagiaires
USING (auth.role() = 'authenticated');

ALTER POLICY "Enable update for users based on user_id" ON candidatures_stagiaires
USING (auth.uid()::text = stagiaire_id::text); 