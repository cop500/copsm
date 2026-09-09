-- Qui a effectué le tri CV et quand

ALTER TABLE candidatures_stagiaires
  ADD COLUMN IF NOT EXISTS cv_tri_par_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS cv_tri_par_nom TEXT,
  ADD COLUMN IF NOT EXISTS cv_tri_le TIMESTAMPTZ;

COMMENT ON COLUMN candidatures_stagiaires.cv_tri_par_id IS 'Profil ayant effectué le dernier tri CV';
COMMENT ON COLUMN candidatures_stagiaires.cv_tri_par_nom IS 'Nom affiché du conseiller ayant trié le CV';
COMMENT ON COLUMN candidatures_stagiaires.cv_tri_le IS 'Date/heure du dernier tri CV';

CREATE INDEX IF NOT EXISTS idx_candidatures_cv_tri_par_id
  ON candidatures_stagiaires(cv_tri_par_id);
