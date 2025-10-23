-- Ajouter la colonne isDraft à la table evenements
ALTER TABLE public.evenements 
ADD COLUMN IF NOT EXISTS isDraft BOOLEAN DEFAULT false;

-- Commentaire pour documenter la nouvelle colonne
COMMENT ON COLUMN public.evenements.isDraft IS 'Indique si l''événement est un brouillon';
