-- Rubriques de remplissage réutilisables (plusieurs canevas)
CREATE TABLE IF NOT EXISTS admission_canevas_rubriques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  regles JSONB NOT NULL DEFAULT '[]'::jsonb,
  parametres JSONB NOT NULL DEFAULT '{
    "groupSourceColumnIndex": null,
    "groupSourceColumnLabel": null,
    "tauxMin": 80,
    "tauxMax": 90,
    "tauxCible": 85
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admission_canevas_rubriques_nom ON admission_canevas_rubriques(nom);

COMMENT ON TABLE admission_canevas_rubriques IS 'Rubriques de mapping champs canevas → sources (Excel, calcul, saisie)';
COMMENT ON COLUMN admission_canevas_rubriques.regles IS '[{ "fieldKey": "cmc", "fieldLabel": "CMC", "rule": { "mode": "manual", ... } }]';

ALTER TABLE admission_canevas_rubriques ENABLE ROW LEVEL SECURITY;
