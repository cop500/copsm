-- Grille de notation optionnelle (saisie agent par critères → total /70)
ALTER TABLE candidats_notes_concours
  ADD COLUMN IF NOT EXISTS grille_notes JSONB,
  ADD COLUMN IF NOT EXISTS mode_saisie TEXT,
  ADD COLUMN IF NOT EXISTS grille_code TEXT;

COMMENT ON COLUMN candidats_notes_concours.grille_notes IS
  'Détail grille : scores par critère, observations, TPSS, TPM, total';
COMMENT ON COLUMN candidats_notes_concours.mode_saisie IS
  'direct = saisie /70 manuelle, grille = saisie par critères';
COMMENT ON COLUMN candidats_notes_concours.grille_code IS
  'Code grille : SANTE, AGRI, GM, etc.';

CREATE INDEX IF NOT EXISTS idx_candidats_notes_grille_code
  ON candidats_notes_concours(grille_code)
  WHERE grille_code IS NOT NULL;
