-- ========================================
-- Présélection vidéo — tables + bucket Storage (phase test Supabase)
-- ========================================

-- 1. Formateurs (accès dédié, pas compte COP)
CREATE TABLE IF NOT EXISTS formateurs_video (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  filiere TEXT NOT NULL CHECK (
    filiere IN ('assistant_administratif', 'art_de_la_table', 'ambulancier')
  ),
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Vidéos déposées par les candidats
CREATE TABLE IF NOT EXISTS videos_preselection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  cine TEXT NOT NULL UNIQUE,
  filiere TEXT NOT NULL CHECK (
    filiere IN ('assistant_administratif', 'art_de_la_table', 'ambulancier')
  ),
  storage_type TEXT NOT NULL DEFAULT 'supabase',
  storage_bucket TEXT NOT NULL DEFAULT 'videos-preselection',
  storage_path TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente_affectation' CHECK (
    statut IN ('en_attente_affectation', 'affectee', 'evaluee')
  ),
  formateur_id UUID REFERENCES formateurs_video(id) ON DELETE SET NULL,
  note NUMERIC(4, 1) CHECK (note IS NULL OR (note >= 0 AND note <= 20)),
  commentaire TEXT,
  evalue_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_preselection_filiere ON videos_preselection(filiere);
CREATE INDEX IF NOT EXISTS idx_videos_preselection_statut ON videos_preselection(statut);
CREATE INDEX IF NOT EXISTS idx_videos_preselection_formateur ON videos_preselection(formateur_id);
CREATE INDEX IF NOT EXISTS idx_videos_preselection_cine ON videos_preselection(cine);

-- 3. Bucket Storage (privé, max 50 Mo — plan gratuit Supabase)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'videos-preselection') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'videos-preselection',
      'videos-preselection',
      false,
      52428800,
      ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    );
    RAISE NOTICE 'Bucket videos-preselection créé';
  END IF;
END $$;

-- Accès Storage via service role (API serveur) — pas d'upload public direct
DROP POLICY IF EXISTS "Service role videos preselection all" ON storage.objects;
CREATE POLICY "Service role videos preselection all" ON storage.objects
  FOR ALL
  USING (bucket_id = 'videos-preselection')
  WITH CHECK (bucket_id = 'videos-preselection');

COMMENT ON TABLE videos_preselection IS 'Vidéos de présentation candidats — stockage Supabase (phase test), migrable vers Drive';
COMMENT ON TABLE formateurs_video IS 'Accès légers formateurs pour évaluation vidéo (hors comptes COP)';

-- 4. RLS activé : accès uniquement via API serveur (service role)
ALTER TABLE formateurs_video ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos_preselection ENABLE ROW LEVEL SECURITY;

-- Pas de policy publique : les routes /api/videos/* utilisent SUPABASE_SERVICE_ROLE_KEY
