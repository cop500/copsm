-- ========================================
-- Module NOTE — concours national (import Excel + saisie agents)
-- ========================================

CREATE TABLE IF NOT EXISTS agents_saisie_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidats_notes_concours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dr TEXT,
  efp TEXT,
  niveau_formation TEXT,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  id_inscription_concours_national TEXT NOT NULL,
  cef TEXT NOT NULL,
  niveau_scolaire TEXT,
  moyenne TEXT,
  branche TEXT,
  categorie TEXT,
  filiere TEXT,
  numero_choix TEXT,
  classement TEXT,
  statut TEXT,
  tel_1 TEXT,
  tel_2 TEXT,
  valide TEXT,
  absent TEXT,
  note_70 NUMERIC(5, 2) CHECK (note_70 IS NULL OR (note_70 >= 0 AND note_70 <= 70)),
  note_20 NUMERIC(5, 2) CHECK (note_20 IS NULL OR (note_20 >= 0 AND note_20 <= 20)),
  agent_id UUID REFERENCES agents_saisie_notes(id) ON DELETE SET NULL,
  saisi_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_candidats_notes_id_inscription UNIQUE (id_inscription_concours_national),
  CONSTRAINT uq_candidats_notes_cef UNIQUE (cef)
);

CREATE INDEX IF NOT EXISTS idx_candidats_notes_cef ON candidats_notes_concours(cef);
CREATE INDEX IF NOT EXISTS idx_candidats_notes_note_70 ON candidats_notes_concours(note_70);

COMMENT ON TABLE agents_saisie_notes IS 'Agents de saisie notes concours (accès léger hors comptes COP)';
COMMENT ON TABLE candidats_notes_concours IS 'Candidats concours national — import Excel + notes /70 et /20';

ALTER TABLE agents_saisie_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidats_notes_concours ENABLE ROW LEVEL SECURITY;
