-- Tri CV : accepté / refusé (pré-sélection avant envoi entreprise)
ALTER TABLE candidatures_stagiaires
  ADD COLUMN IF NOT EXISTS cv_tri_statut TEXT DEFAULT 'en_attente';

COMMENT ON COLUMN candidatures_stagiaires.cv_tri_statut IS
  'Tri préliminaire du CV : en_attente, accepte, refuse';

CREATE INDEX IF NOT EXISTS idx_candidatures_cv_tri_statut
  ON candidatures_stagiaires(cv_tri_statut);
