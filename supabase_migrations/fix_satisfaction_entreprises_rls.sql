-- Répare la RLS pour les insertions sur satisfaction_entreprises_jobdating
-- Objectif : autoriser les utilisateurs anonymes (formulaire public) et authentifiés à insérer des réponses.

-- S'assurer que la RLS est activée (idempotent)
ALTER TABLE IF EXISTS public.satisfaction_entreprises_jobdating ENABLE ROW LEVEL SECURITY;

-- Créer la policy d'insert si elle n'existe pas encore
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'satisfaction_entreprises_jobdating'
      AND policyname = 'insert_satisfaction_entreprises_public'
  ) THEN
    CREATE POLICY insert_satisfaction_entreprises_public
    ON public.satisfaction_entreprises_jobdating
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  END IF;
END $$;

