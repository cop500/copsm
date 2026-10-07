-- Fiches de sourcing (CV / Job Day) : saisie conseillère, validation admin, stats
-- Exécuter dans l'éditeur SQL Supabase avant de tester en local.

CREATE TABLE IF NOT EXISTS fiches_sourcing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id UUID NOT NULL REFERENCES demandes_entreprises(id) ON DELETE CASCADE,
  type_fiche TEXT NOT NULL CHECK (type_fiche IN ('cv', 'job_day')),
  statut TEXT NOT NULL DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon', 'soumise', 'validee', 'a_revoir')),
  donnees JSONB NOT NULL DEFAULT '{}'::jsonb,
  commentaire_admin TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  soumise_par UUID REFERENCES profiles(id) ON DELETE SET NULL,
  soumise_le TIMESTAMPTZ,
  validee_par UUID REFERENCES profiles(id) ON DELETE SET NULL,
  validee_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fiches_sourcing_demande_unique UNIQUE (demande_id)
);

CREATE INDEX IF NOT EXISTS idx_fiches_sourcing_statut ON fiches_sourcing(statut);
CREATE INDEX IF NOT EXISTS idx_fiches_sourcing_type ON fiches_sourcing(type_fiche);

COMMENT ON TABLE fiches_sourcing IS
  'Fiche de suivi sourcing remplie par la conseillère, validée par l''admin, puis imprimable pour le dossier';
COMMENT ON COLUMN fiches_sourcing.type_fiche IS
  'Type réellement réalisé : cv (envoi de CV) ou job_day — peut différer de la saisie entreprise';
COMMENT ON COLUMN fiches_sourcing.donnees IS
  'Contenu de la fiche (profils, dates, totaux, observations) pour impression et statistiques';

ALTER TABLE fiches_sourcing ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fiches_sourcing' AND policyname = 'Staff lit fiches sourcing'
  ) THEN
    CREATE POLICY "Staff lit fiches sourcing"
      ON fiches_sourcing FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN (
              'business_developer',
              'conseillere_carriere',
              'conseiller_cop',
              'manager_cop',
              'directeur'
            )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fiches_sourcing' AND policyname = 'Staff cree fiches sourcing'
  ) THEN
    CREATE POLICY "Staff cree fiches sourcing"
      ON fiches_sourcing FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN (
              'business_developer',
              'conseillere_carriere',
              'conseiller_cop',
              'manager_cop'
            )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fiches_sourcing' AND policyname = 'Conseiller maj fiches non validees'
  ) THEN
    CREATE POLICY "Conseiller maj fiches non validees"
      ON fiches_sourcing FOR UPDATE TO authenticated
      USING (
        statut <> 'validee'
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('conseillere_carriere', 'conseiller_cop', 'manager_cop')
        )
      )
      WITH CHECK (
        statut IN ('brouillon', 'soumise', 'a_revoir')
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('conseillere_carriere', 'conseiller_cop', 'manager_cop')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fiches_sourcing' AND policyname = 'Admin maj fiches sourcing'
  ) THEN
    CREATE POLICY "Admin maj fiches sourcing"
      ON fiches_sourcing FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'business_developer'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'business_developer'
        )
      );
  END IF;
END $$;
