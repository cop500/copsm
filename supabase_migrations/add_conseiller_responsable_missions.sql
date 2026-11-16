-- Si create_missions_ambassadeurs.sql a déjà été exécuté
ALTER TABLE public.missions_ambassadeurs
  ADD COLUMN IF NOT EXISTS conseiller_responsable TEXT NOT NULL DEFAULT '';
