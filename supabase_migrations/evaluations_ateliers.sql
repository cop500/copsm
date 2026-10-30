-- Notation des ateliers (option 2) : 1 note par inscription, 5 critères de 1 à 5.
-- À exécuter dans l’éditeur SQL Supabase avant d’utiliser « Noter l’atelier ».

CREATE TABLE IF NOT EXISTS public.evaluations_ateliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atelier_id uuid NOT NULL REFERENCES public.evenements(id) ON DELETE CASCADE,
  inscription_id uuid NOT NULL REFERENCES public.inscriptions_ateliers(id) ON DELETE CASCADE,
  clarte smallint NOT NULL CHECK (clarte BETWEEN 1 AND 5),
  utilite smallint NOT NULL CHECK (utilite BETWEEN 1 AND 5),
  animation smallint NOT NULL CHECK (animation BETWEEN 1 AND 5),
  organisation smallint NOT NULL CHECK (organisation BETWEEN 1 AND 5),
  recommandation smallint NOT NULL CHECK (recommandation BETWEEN 1 AND 5),
  commentaire text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evaluations_ateliers_inscription_unique UNIQUE (inscription_id)
);

CREATE INDEX IF NOT EXISTS evaluations_ateliers_atelier_idx
  ON public.evaluations_ateliers (atelier_id);

ALTER TABLE public.evaluations_ateliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evaluations_ateliers_select_authenticated ON public.evaluations_ateliers;
CREATE POLICY evaluations_ateliers_select_authenticated
  ON public.evaluations_ateliers
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE public.evaluations_ateliers IS
  'Notes stagiaires (présence validée). Insertion uniquement via API service role.';
