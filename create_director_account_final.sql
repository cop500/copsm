-- ========================================
-- Script de création du compte Directeur - Version finale
-- ========================================

-- 1. Vérifier la structure de la table profiles
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name = 'role';

-- 2. Vérifier les contraintes existantes
-- SELECT conname, consrc 
-- FROM pg_constraint 
-- WHERE conrelid = 'profiles'::regclass AND contype = 'c';

-- 3. Créer le compte utilisateur dans Supabase Auth d'abord
-- (À faire via l'interface Supabase Dashboard > Authentication > Users)
-- Email: Directeur@cmc
-- Password: cop123
-- Email Confirm: ✅ (cocher)

-- 4. Récupérer l'ID de l'utilisateur créé et insérer le profil
-- Remplacez 'USER_ID_ICI' par l'ID récupéré de l'utilisateur créé
INSERT INTO profiles (
  id,
  email,
  nom,
  prenom,
  role,
  actif,
  created_at,
  updated_at
) VALUES (
  'USER_ID_ICI', -- Remplacez par l'ID de l'utilisateur créé
  'Directeur@cmc',
  'Directeur',
  'COP',
  'directeur',
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'directeur',
  actif = true,
  updated_at = now();

-- 5. Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Directeur peut lire tous les profils" ON profiles;
DROP POLICY IF EXISTS "Directeur peut lire toutes les entreprises" ON entreprises;
DROP POLICY IF EXISTS "Directeur peut lire tous les stagiaires" ON stagiaires;
DROP POLICY IF EXISTS "Directeur peut lire tous les événements" ON evenements;
DROP POLICY IF EXISTS "Directeur peut lire toutes les demandes" ON demandes_entreprises;
DROP POLICY IF EXISTS "Directeur peut lire tous les commentaires" ON commentaires_demandes_entreprises;
DROP POLICY IF EXISTS "Directeur peut lire toutes les notes" ON notes_equipe;
DROP POLICY IF EXISTS "Directeur peut écrire des notes" ON notes_equipe;
DROP POLICY IF EXISTS "Directeur peut supprimer ses notes" ON notes_equipe;
DROP POLICY IF EXISTS "Directeur peut lire tous les indicateurs" ON indicateurs_dashboard;
DROP POLICY IF EXISTS "Directeur peut lire tous les rappels" ON rappels;

-- 6. Créer les politiques RLS pour le rôle directeur

-- Politique pour la lecture des profils
CREATE POLICY "Directeur peut lire tous les profils" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
    )
  );

-- Politique pour la lecture des entreprises
CREATE POLICY "Directeur peut lire toutes les entreprises" ON entreprises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
    )
  );

-- Politique pour la lecture des stagiaires
CREATE POLICY "Directeur peut lire tous les stagiaires" ON stagiaires
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
    )
  );

-- Politique pour la lecture des événements
CREATE POLICY "Directeur peut lire tous les événements" ON evenements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
    )
  );

-- Politique pour la lecture des demandes d'entreprises
CREATE POLICY "Directeur peut lire toutes les demandes" ON demandes_entreprises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
    )
  );

-- Politique pour la lecture des commentaires
CREATE POLICY "Directeur peut lire tous les commentaires" ON commentaires_demandes_entreprises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
    )
  );

-- Politique pour la lecture des notes d'équipe
CREATE POLICY "Directeur peut lire toutes les notes" ON notes_equipe
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
    )
  );

-- Politique pour l'écriture des notes d'équipe
CREATE POLICY "Directeur peut écrire des notes" ON notes_equipe
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
    )
  );

-- Politique pour la suppression des notes (directeur peut supprimer ses propres notes)
CREATE POLICY "Directeur peut supprimer ses notes" ON notes_equipe
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
      AND p.id = notes_equipe.auteur_id
    )
  );

-- Politique pour la lecture des indicateurs
CREATE POLICY "Directeur peut lire tous les indicateurs" ON indicateurs_dashboard
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
    )
  );

-- Politique pour la lecture des rappels
CREATE POLICY "Directeur peut lire tous les rappels" ON rappels
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'directeur'
    )
  );
