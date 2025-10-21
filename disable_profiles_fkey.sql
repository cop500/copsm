-- Désactiver temporairement la contrainte de clé étrangère pour profiles
-- Cela permet de créer des profils CV Connect sans auth.users

-- Supprimer la contrainte existante
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Optionnel : Créer une contrainte plus flexible
-- ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
-- FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Note: Cette modification permet de créer des profils CV Connect
-- sans nécessiter l'existence dans auth.users
