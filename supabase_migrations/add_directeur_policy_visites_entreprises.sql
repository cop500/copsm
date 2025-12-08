-- ========================================
-- Migration : Ajouter la politique RLS pour le directeur sur visites_entreprises
-- ========================================
-- Permet au directeur de voir toutes les visites entreprises

-- Supprimer la politique si elle existe déjà
DROP POLICY IF EXISTS "Directeur peut lire toutes les visites" ON visites_entreprises;

-- Créer la politique pour permettre au directeur de lire toutes les visites
CREATE POLICY "Directeur peut lire toutes les visites" ON visites_entreprises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
    )
  );

-- Commentaire
COMMENT ON POLICY "Directeur peut lire toutes les visites" ON visites_entreprises IS 
  'Permet au directeur de voir toutes les visites entreprises pour le bilan d''employabilité';

