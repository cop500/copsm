-- Migration pour ajouter la colonne notes à la table demandes_assistance_stagiaires
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajouter la colonne notes si elle n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'demandes_assistance_stagiaires' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.demandes_assistance_stagiaires 
        ADD COLUMN notes TEXT;
        
        COMMENT ON COLUMN public.demandes_assistance_stagiaires.notes IS 'Notes du conseiller sur la demande d''assistance';
    END IF;
END $$;

