-- Script complet pour corriger la table candidatures_stagiaires
-- Vérifier d'abord la structure actuelle
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'candidatures_stagiaires'
ORDER BY ordinal_position;

-- Supprimer les colonnes si elles existent déjà (pour éviter les erreurs)
DO $$ 
BEGIN
    -- Supprimer les colonnes si elles existent
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidatures_stagiaires' AND column_name = 'cv_url') THEN
        ALTER TABLE candidatures_stagiaires DROP COLUMN cv_url;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidatures_stagiaires' AND column_name = 'nom') THEN
        ALTER TABLE candidatures_stagiaires DROP COLUMN nom;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidatures_stagiaires' AND column_name = 'prenom') THEN
        ALTER TABLE candidatures_stagiaires DROP COLUMN prenom;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidatures_stagiaires' AND column_name = 'email') THEN
        ALTER TABLE candidatures_stagiaires DROP COLUMN email;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidatures_stagiaires' AND column_name = 'telephone') THEN
        ALTER TABLE candidatures_stagiaires DROP COLUMN telephone;
    END IF;
END $$;

-- Ajouter toutes les colonnes manquantes
ALTER TABLE candidatures_stagiaires ADD COLUMN cv_url TEXT;
ALTER TABLE candidatures_stagiaires ADD COLUMN nom TEXT;
ALTER TABLE candidatures_stagiaires ADD COLUMN prenom TEXT;
ALTER TABLE candidatures_stagiaires ADD COLUMN email TEXT;
ALTER TABLE candidatures_stagiaires ADD COLUMN telephone TEXT;

-- Vérifier que toutes les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'candidatures_stagiaires'
ORDER BY ordinal_position;

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'candidatures_stagiaires'; 