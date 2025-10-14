-- Solution définitive pour les politiques RLS de enquete_reponses

-- 1. Désactiver temporairement RLS pour pouvoir supprimer les politiques
ALTER TABLE enquete_reponses DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les politiques existantes
DROP POLICY IF EXISTS "Allow public insert" ON enquete_reponses;
DROP POLICY IF EXISTS "Admins can view all" ON enquete_reponses;
DROP POLICY IF EXISTS "Admins and conseillere can view all" ON enquete_reponses;
DROP POLICY IF EXISTS "Admins and conseillere can update all" ON enquete_reponses;
DROP POLICY IF EXISTS "Admins and conseillere can delete all" ON enquete_reponses;

-- 3. Réactiver RLS
ALTER TABLE enquete_reponses ENABLE ROW LEVEL SECURITY;

-- 4. Créer les nouvelles politiques avec les bonnes permissions

-- Politique pour l'insertion publique (permettre à tout le monde d'insérer)
CREATE POLICY "Allow public insert" ON enquete_reponses
    FOR INSERT 
    WITH CHECK (true);

-- Politique pour la lecture (seulement les admins et conseillères carrière)
CREATE POLICY "Allow admins and conseillere to view" ON enquete_reponses
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('business_developer', 'conseillere_carriere')
        )
    );

-- Politique pour la mise à jour (seulement les admins et conseillères carrière)
CREATE POLICY "Allow admins and conseillere to update" ON enquete_reponses
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('business_developer', 'conseillere_carriere')
        )
    );

-- Politique pour la suppression (seulement les admins et conseillères carrière)
CREATE POLICY "Allow admins and conseillere to delete" ON enquete_reponses
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('business_developer', 'conseillere_carriere')
        )
    );

