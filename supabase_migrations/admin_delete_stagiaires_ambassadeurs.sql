-- Permet à l'admin (business_developer) de supprimer des stagiaires
-- pour actualiser la liste Espace Ambassadeurs.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stagiaires'
      AND policyname = 'Admin peut supprimer stagiaires'
  ) THEN
    CREATE POLICY "Admin peut supprimer stagiaires"
      ON stagiaires
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role = 'business_developer'
        )
      );
  END IF;
END $$;
