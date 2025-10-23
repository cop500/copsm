-- Ajouter les colonnes animateur à la table evenements
ALTER TABLE public.evenements 
ADD COLUMN IF NOT EXISTS animateur_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS animateur_nom TEXT,
ADD COLUMN IF NOT EXISTS animateur_role TEXT;

-- Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_evenements_animateur_id ON public.evenements(animateur_id);

-- Commentaire pour documenter les nouvelles colonnes
COMMENT ON COLUMN public.evenements.animateur_id IS 'ID de l''utilisateur qui anime l''événement';
COMMENT ON COLUMN public.evenements.animateur_nom IS 'Nom complet de l''animateur';
COMMENT ON COLUMN public.evenements.animateur_role IS 'Rôle de l''animateur';
