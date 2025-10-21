-- Désactiver la contrainte de clé étrangère pour cv_connect_permissions
-- Cela permet de créer des permissions CV Connect sans auth.users

-- Supprimer la contrainte existante
ALTER TABLE cv_connect_permissions DROP CONSTRAINT IF EXISTS cv_connect_permissions_user_id_fkey;

-- Supprimer aussi la contrainte pour granted_by
ALTER TABLE cv_connect_permissions DROP CONSTRAINT IF EXISTS cv_connect_permissions_granted_by_fkey;

-- Note: Cette modification permet de créer des permissions CV Connect
-- sans nécessiter l'existence dans auth.users
