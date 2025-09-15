-- ========================================
-- Script de création du compte Directeur
-- ========================================

-- 1. Ajouter le rôle 'directeur' au type UserRole si nécessaire
-- (Cette modification doit être faite dans Supabase Dashboard > Database > Types)

-- 2. Insérer le profil directeur dans la table profiles
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
  gen_random_uuid(),
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

-- 3. Créer les politiques RLS pour le rôle directeur

-- Supprimer les politiques existantes si elles existent (pour éviter les conflits)
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

-- Politique pour la lecture des profils (directeur peut voir tous les profils)
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

-- Politique pour la lecture des entreprises (directeur peut voir toutes les entreprises)
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

-- Politique pour la lecture des stagiaires (directeur peut voir tous les stagiaires)
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

-- Politique pour la lecture des événements (directeur peut voir tous les événements)
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

-- Politique pour la lecture des demandes d'entreprises (directeur peut voir toutes les demandes)
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

-- Politique pour la lecture des commentaires (directeur peut voir tous les commentaires)
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

-- Politique pour les notes d'équipe (directeur peut lire et écrire)
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

-- Politique pour la lecture des indicateurs (directeur peut voir tous les indicateurs)
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

-- Politique pour la lecture des rappels (directeur peut voir tous les rappels)
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

-- Note: Le compte utilisateur sera créé via l'interface Supabase Auth
-- Email: Directeur@cmc
-- Mot de passe: cop123
