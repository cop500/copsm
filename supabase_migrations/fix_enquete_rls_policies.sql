-- Corriger les politiques RLS pour permettre l'insertion publique dans enquete_reponses

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow public insert" ON enquete_reponses;
DROP POLICY IF EXISTS "Admins can view all" ON enquete_reponses;

-- Créer une nouvelle politique pour permettre l'insertion publique (pour les utilisateurs anonymes)
CREATE POLICY "Allow public insert" ON enquete_reponses
    FOR INSERT 
    WITH CHECK (true);

-- Créer une politique pour permettre la lecture aux admins et conseillères carrière
CREATE POLICY "Admins and conseillere can view all" ON enquete_reponses
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('business_developer', 'conseillere_carriere')
        )
    );

-- Créer une politique pour permettre la mise à jour aux admins et conseillères carrière
CREATE POLICY "Admins and conseillere can update all" ON enquete_reponses
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('business_developer', 'conseillere_carriere')
        )
    );

-- Créer une politique pour permettre la suppression aux admins et conseillères carrière
CREATE POLICY "Admins and conseillere can delete all" ON enquete_reponses
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('business_developer', 'conseillere_carriere')
        )
    );

