-- Inscriptions OFPPT Got Talent (clubs parascolaires)
CREATE TABLE IF NOT EXISTS public.inscriptions_got_talent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  pole TEXT NOT NULL,
  filliere TEXT NOT NULL,
  groupe TEXT NOT NULL,
  telephone TEXT NOT NULL,
  telephone_normalized TEXT NOT NULL,
  email TEXT NOT NULL,
  activites JSONB NOT NULL DEFAULT '[]'::jsonb,
  consentement BOOLEAN NOT NULL DEFAULT false,
  lieu_fait TEXT,
  date_inscription TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inscriptions_got_talent_activites_max CHECK (jsonb_array_length(activites) >= 1 AND jsonb_array_length(activites) <= 2),
  CONSTRAINT inscriptions_got_talent_consentement CHECK (consentement = true)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_got_talent_email_unique
  ON public.inscriptions_got_talent (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_got_talent_telephone_unique
  ON public.inscriptions_got_talent (telephone_normalized);

CREATE INDEX IF NOT EXISTS idx_got_talent_pole ON public.inscriptions_got_talent (pole);
CREATE INDEX IF NOT EXISTS idx_got_talent_filliere ON public.inscriptions_got_talent (filliere);
CREATE INDEX IF NOT EXISTS idx_got_talent_date ON public.inscriptions_got_talent (date_inscription DESC);

COMMENT ON TABLE public.inscriptions_got_talent IS 'Inscriptions stagiaires clubs parascolaires OFPPT Got Talent';

ALTER TABLE public.inscriptions_got_talent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "got_talent_public_insert" ON public.inscriptions_got_talent;
DROP POLICY IF EXISTS "got_talent_authenticated_read" ON public.inscriptions_got_talent;
DROP POLICY IF EXISTS "got_talent_authenticated_delete" ON public.inscriptions_got_talent;

CREATE POLICY "got_talent_public_insert" ON public.inscriptions_got_talent
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "got_talent_authenticated_read" ON public.inscriptions_got_talent
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "got_talent_authenticated_delete" ON public.inscriptions_got_talent
  FOR DELETE TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.update_inscriptions_got_talent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inscriptions_got_talent_updated_at ON public.inscriptions_got_talent;
CREATE TRIGGER trg_inscriptions_got_talent_updated_at
  BEFORE UPDATE ON public.inscriptions_got_talent
  FOR EACH ROW EXECUTE FUNCTION public.update_inscriptions_got_talent_updated_at();
