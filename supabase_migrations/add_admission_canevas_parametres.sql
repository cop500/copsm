-- Paramètres globaux par canevas (taux insertion, colonne filière, etc.)
ALTER TABLE admission_canevas
  ADD COLUMN IF NOT EXISTS parametres JSONB NOT NULL DEFAULT '{
    "groupSourceColumnIndex": null,
    "groupSourceColumnLabel": null,
    "tauxMin": 80,
    "tauxMax": 90,
    "tauxCible": 85
  }'::jsonb;

COMMENT ON COLUMN admission_canevas.parametres IS 'Paramètres globaux : groupSourceColumnIndex, tauxMin, tauxMax, tauxCible';
