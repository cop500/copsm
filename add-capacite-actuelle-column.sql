-- Ajouter la colonne capacite_actuelle à la table evenements
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'evenements' AND column_name = 'capacite_actuelle' AND table_schema = 'public') THEN
        ALTER TABLE public.evenements ADD COLUMN capacite_actuelle INTEGER DEFAULT 0;
    END IF;
END $$;
