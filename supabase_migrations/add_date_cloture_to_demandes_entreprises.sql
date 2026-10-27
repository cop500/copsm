-- Date de clôture des demandes entreprise (délai de traitement)

ALTER TABLE demandes_entreprises
ADD COLUMN IF NOT EXISTS date_cloture TIMESTAMPTZ NULL;

UPDATE demandes_entreprises
SET date_cloture = COALESCE(date_cloture, created_at)
WHERE statut IN ('terminee', 'termine', 'refusee', 'annulee', 'annule')
  AND date_cloture IS NULL;
