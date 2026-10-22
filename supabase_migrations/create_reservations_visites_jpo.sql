-- Portail visites / journées portes ouvertes CMC
CREATE TABLE IF NOT EXISTS reservations_visites_jpo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_prenom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  email TEXT NOT NULL,
  fonction TEXT NOT NULL,
  etablissement TEXT NOT NULL,
  date_visite DATE NOT NULL,
  creneau TEXT NOT NULL,
  nombre_participants INTEGER NOT NULL CHECK (nombre_participants >= 1),
  nombre_accompagnateurs INTEGER NOT NULL DEFAULT 0 CHECK (nombre_accompagnateurs >= 0),
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'refusee')),
  calendrier_event_id UUID NULL,
  confirme_par UUID NULL,
  confirme_le TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visites_jpo_date ON reservations_visites_jpo(date_visite);
CREATE INDEX IF NOT EXISTS idx_visites_jpo_statut ON reservations_visites_jpo(statut);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_visites_jpo_creneau_actif
  ON reservations_visites_jpo (date_visite, creneau)
  WHERE statut IN ('en_attente', 'confirmee');

CREATE OR REPLACE FUNCTION update_reservations_visites_jpo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reservations_visites_jpo_updated_at ON reservations_visites_jpo;
CREATE TRIGGER trg_reservations_visites_jpo_updated_at
  BEFORE UPDATE ON reservations_visites_jpo
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_visites_jpo_updated_at();

ALTER TABLE reservations_visites_jpo ENABLE ROW LEVEL SECURITY;
