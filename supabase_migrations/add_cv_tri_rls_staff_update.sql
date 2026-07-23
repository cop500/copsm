-- Permettre au staff authentifié de mettre à jour le tri CV (repli si l'API admin est indisponible)
-- Exécuter après add_cv_telecharge_le_to_candidatures.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'candidatures_stagiaires'
      AND policyname = 'Staff peut mettre a jour tri CV'
  ) THEN
    CREATE POLICY "Staff peut mettre a jour tri CV"
      ON candidatures_stagiaires
      FOR UPDATE
      TO authenticated
      USING (
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
      )
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
END $$;

COMMENT ON POLICY "Staff peut mettre a jour tri CV" ON candidatures_stagiaires IS
  'Permet aux conseillers / admin / manager COP de persister cv_tri_statut et champs envoi CV';
