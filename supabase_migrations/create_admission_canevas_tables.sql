-- Canevas Excel — modèles de colonnes pour remplissage automatique (Admission)
CREATE TABLE IF NOT EXISTS admission_canevas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  fichier_source TEXT,
  feuille_nom TEXT NOT NULL DEFAULT 'Feuille1',
  colonnes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admission_canevas_nom ON admission_canevas(nom);

COMMENT ON TABLE admission_canevas IS 'Modèles Excel (canevas) — en-têtes de colonnes pour export rempli';
COMMENT ON COLUMN admission_canevas.colonnes IS 'Tableau JSON [{ "index": 0, "label": "Nom" }, ...]';

ALTER TABLE admission_canevas ENABLE ROW LEVEL SECURITY;
