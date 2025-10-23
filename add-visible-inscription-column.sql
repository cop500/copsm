-- Ajouter la colonne visible_inscription à la table evenements
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'evenements' AND column_name = 'visible_inscription' AND table_schema = 'public') THEN
        ALTER TABLE public.evenements ADD COLUMN visible_inscription BOOLEAN DEFAULT false;
    END IF;
END $$;
