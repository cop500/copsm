-- Missions proposées aux stagiaires ambassadeurs + confirmations de disponibilité
-- À exécuter dans l'éditeur SQL Supabase avant le test local.

CREATE TABLE IF NOT EXISTS public.missions_ambassadeurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intitule TEXT NOT NULL,
  date_mission DATE NOT NULL,
  lieu TEXT NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  conseiller_responsable TEXT NOT NULL DEFAULT '',
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.missions_ambassadeurs_disponibilites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions_ambassadeurs(id) ON DELETE CASCADE,
  stagiaire_id UUID NOT NULL REFERENCES public.stagiaires(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mission_id, stagiaire_id)
);

CREATE INDEX IF NOT EXISTS idx_missions_amb_date ON public.missions_ambassadeurs(date_mission);
CREATE INDEX IF NOT EXISTS idx_missions_amb_actif ON public.missions_ambassadeurs(actif);
CREATE INDEX IF NOT EXISTS idx_missions_amb_dispo_mission ON public.missions_ambassadeurs_disponibilites(mission_id);

ALTER TABLE public.missions_ambassadeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions_ambassadeurs_disponibilites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_missions_amb_all" ON public.missions_ambassadeurs;
CREATE POLICY "staff_missions_amb_all" ON public.missions_ambassadeurs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "staff_missions_amb_dispo_all" ON public.missions_ambassadeurs_disponibilites;
CREATE POLICY "staff_missions_amb_dispo_all" ON public.missions_ambassadeurs_disponibilites
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMENT ON TABLE public.missions_ambassadeurs IS 'Missions proposées aux stagiaires ambassadeurs (saisie conseiller).';
COMMENT ON TABLE public.missions_ambassadeurs_disponibilites IS 'Confirmations de disponibilité, contrôlées sur la liste stagiaires.';
