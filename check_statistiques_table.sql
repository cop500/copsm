-- Vérification de la table statistiques_demandes

-- 1. Vérifier si la table existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'statistiques_demandes'
) as table_exists;

-- 2. Si la table n'existe pas, la créer
CREATE TABLE IF NOT EXISTS statistiques_demandes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    demande_id UUID NOT NULL REFERENCES demandes_entreprises(id) ON DELETE CASCADE,
    nombre_candidats INTEGER DEFAULT 0,
    nombre_candidats_retenus INTEGER DEFAULT 0,
    nombre_cv_envoyes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(demande_id)
);

-- 3. Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_statistiques_demande_id ON statistiques_demandes(demande_id);

-- 4. Activer RLS
ALTER TABLE statistiques_demandes ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Permettre lecture statistiques" ON statistiques_demandes;
DROP POLICY IF EXISTS "Permettre insertion statistiques" ON statistiques_demandes;
DROP POLICY IF EXISTS "Permettre mise a jour statistiques" ON statistiques_demandes;
DROP POLICY IF EXISTS "Permettre suppression statistiques" ON statistiques_demandes;
DROP POLICY IF EXISTS "Permettre toutes les opérations statistiques" ON statistiques_demandes;

-- 6. Créer une politique simple qui permet toutes les opérations pour les utilisateurs authentifiés
CREATE POLICY "Permettre toutes les opérations statistiques" ON statistiques_demandes
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Vérifier la structure finale
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'statistiques_demandes'
ORDER BY ordinal_position;

-- 8. Vérifier les politiques RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'statistiques_demandes';

-- 9. Afficher quelques exemples de données existantes
SELECT 
    demande_id,
    nombre_candidats,
    nombre_candidats_retenus,
    nombre_cv_envoyes,
    created_at,
    updated_at
FROM statistiques_demandes
ORDER BY created_at DESC
LIMIT 5; 