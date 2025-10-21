-- Script complet pour désactiver toutes les contraintes de clé étrangère
-- nécessaires pour CV Connect

-- 1. Désactiver la contrainte pour profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Désactiver les contraintes pour cv_connect_permissions
ALTER TABLE cv_connect_permissions DROP CONSTRAINT IF EXISTS cv_connect_permissions_user_id_fkey;
ALTER TABLE cv_connect_permissions DROP CONSTRAINT IF EXISTS cv_connect_permissions_granted_by_fkey;

-- 3. Désactiver les contraintes pour cv_connect_submissions
ALTER TABLE cv_connect_submissions DROP CONSTRAINT IF EXISTS cv_connect_submissions_processed_by_fkey;

-- Note: Ces modifications permettent à CV Connect de fonctionner
-- sans nécessiter l'existence dans auth.users
