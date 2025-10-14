-- Corriger la politique "Allow public insert" pour permettre l'insertion sans authentification

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Allow public insert" ON enquete_reponses;

-- Recréer la politique avec la bonne configuration
CREATE POLICY "Allow public insert" ON enquete_reponses
    FOR INSERT
    TO public
    WITH CHECK (true);

