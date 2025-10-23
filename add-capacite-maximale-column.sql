-- Ajouter la colonne capacite_maximale à la table evenements
ALTER TABLE public.evenements 
ADD COLUMN IF NOT EXISTS capacite_maximale INTEGER DEFAULT 20;

-- Commentaire pour documenter la nouvelle colonne
COMMENT ON COLUMN public.evenements.capacite_maximale IS 'Capacité maximale de participants pour l''événement';
