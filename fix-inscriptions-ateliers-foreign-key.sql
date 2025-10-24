-- Corriger la clé étrangère de la table inscriptions_ateliers
-- pour qu'elle référence la table evenements au lieu d'ateliers

-- 1. Supprimer l'ancienne contrainte de clé étrangère
ALTER TABLE public.inscriptions_ateliers 
DROP CONSTRAINT IF EXISTS inscriptions_ateliers_atelier_id_fkey;

-- 2. Ajouter la nouvelle contrainte de clé étrangère vers evenements
ALTER TABLE public.inscriptions_ateliers 
ADD CONSTRAINT inscriptions_ateliers_atelier_id_fkey 
FOREIGN KEY (atelier_id) REFERENCES public.evenements(id) ON DELETE CASCADE;
