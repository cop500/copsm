-- Ajouter les colonnes de capacité si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter capacite_maximale si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evenements' 
        AND column_name = 'capacite_maximale'
    ) THEN
        ALTER TABLE public.evenements 
        ADD COLUMN capacite_maximale integer DEFAULT 20;
    END IF;

    -- Ajouter capacite_actuelle si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evenements' 
        AND column_name = 'capacite_actuelle'
    ) THEN
        ALTER TABLE public.evenements 
        ADD COLUMN capacite_actuelle integer DEFAULT 0;
    END IF;

    -- Ajouter visible_inscription si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evenements' 
        AND column_name = 'visible_inscription'
    ) THEN
        ALTER TABLE public.evenements 
        ADD COLUMN visible_inscription boolean DEFAULT false;
    END IF;
END $$;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'evenements' 
AND column_name IN ('capacite_maximale', 'capacite_actuelle', 'visible_inscription')
ORDER BY column_name;
