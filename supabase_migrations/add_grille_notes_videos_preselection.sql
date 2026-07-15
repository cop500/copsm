-- Grille d'évaluation détaillée (contenu + forme = /30)
ALTER TABLE videos_preselection
  ADD COLUMN IF NOT EXISTS grille_notes JSONB;

-- Étendre la note finale à /30 (grille officielle OFPPT)
ALTER TABLE videos_preselection
  DROP CONSTRAINT IF EXISTS videos_preselection_note_check;

ALTER TABLE videos_preselection
  ADD CONSTRAINT videos_preselection_note_check
  CHECK (note IS NULL OR (note >= 0 AND note <= 30));

COMMENT ON COLUMN videos_preselection.grille_notes IS
  'Scores par critère, observations et sous-totaux contenu/forme (grille OFPPT /30)';
