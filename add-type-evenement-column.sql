-- Ajouter la colonne type_evenement à la table evenements pour distinguer ateliers/événements
ALTER TABLE public.evenements 
ADD COLUMN IF NOT EXISTS type_evenement TEXT DEFAULT 'evenement';

-- Mettre à jour les ateliers existants (si il y en a)
UPDATE public.evenements 
SET type_evenement = 'atelier' 
WHERE type_evenement = 'evenement' 
AND (titre ILIKE '%atelier%' OR description ILIKE '%atelier%');

-- Commentaire pour documenter la nouvelle colonne
COMMENT ON COLUMN public.evenements.type_evenement IS 'Type d''événement: evenement, atelier, formation, etc.';
