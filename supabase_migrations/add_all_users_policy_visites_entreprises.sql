-- ========================================
-- Migration : Ajouter la politique RLS pour tous les utilisateurs sur visites_entreprises
-- ========================================
-- Permet à tous les utilisateurs authentifiés de lire les visites entreprises
-- pour afficher les métriques dans le bilan d'employabilité

-- Supprimer la politique si elle existe déjà
DROP POLICY IF EXISTS "Tous les utilisateurs peuvent lire les visites" ON visites_entreprises;

-- Créer la politique pour permettre à tous les utilisateurs authentifiés de lire les visites
CREATE POLICY "Tous les utilisateurs peuvent lire les visites" ON visites_entreprises
  FOR SELECT
  TO authenticated
  USING (true);

-- Commentaire
COMMENT ON POLICY "Tous les utilisateurs peuvent lire les visites" ON visites_entreprises IS 
  'Permet à tous les utilisateurs authentifiés de voir les visites entreprises pour le bilan d''employabilité et les statistiques';

