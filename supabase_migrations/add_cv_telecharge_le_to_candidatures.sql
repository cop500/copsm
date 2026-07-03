-- Suivi des envois / téléchargements CV (1er, 2e, 3e envoi…)
ALTER TABLE candidatures_stagiaires
  ADD COLUMN IF NOT EXISTS cv_telecharge_le TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cv_dernier_envoi_le TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cv_nb_envois INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN candidatures_stagiaires.cv_telecharge_le IS
  'Date du premier téléchargement / envoi du CV';
COMMENT ON COLUMN candidatures_stagiaires.cv_dernier_envoi_le IS
  'Date du dernier téléchargement / envoi du CV';
COMMENT ON COLUMN candidatures_stagiaires.cv_nb_envois IS
  'Nombre de fois que le CV a été inclus dans un ZIP accepté';

CREATE INDEX IF NOT EXISTS idx_candidatures_cv_nb_envois
  ON candidatures_stagiaires(cv_nb_envois)
  WHERE cv_nb_envois > 0;

-- Rétrocompatibilité si cv_telecharge_le existait déjà seul
UPDATE candidatures_stagiaires
SET
  cv_nb_envois = GREATEST(cv_nb_envois, 1),
  cv_dernier_envoi_le = COALESCE(cv_dernier_envoi_le, cv_telecharge_le)
WHERE cv_telecharge_le IS NOT NULL AND cv_nb_envois = 0;
