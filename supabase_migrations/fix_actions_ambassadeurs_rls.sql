-- ========================================
-- Migration : Corriger les politiques RLS pour actions_ambassadeurs
-- ========================================
-- Cette migration corrige l'erreur "new row violates row-level security policy"
-- Le formulaire est PUBLIC et accessible aux stagiaires NON authentifiés
-- Donc on doit permettre les insertions publiques (sans authentification)

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.actions_ambassadeurs;
DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON public.actions_ambassadeurs;
DROP POLICY IF EXISTS "Allow update access to authenticated users" ON public.actions_ambassadeurs;
DROP POLICY IF EXISTS "Allow delete access to authenticated users" ON public.actions_ambassadeurs;
DROP POLICY IF EXISTS "Allow public insert" ON public.actions_ambassadeurs;
DROP POLICY IF EXISTS "Allow public read" ON public.actions_ambassadeurs;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.actions_ambassadeurs;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.actions_ambassadeurs;

-- Créer les nouvelles politiques RLS
-- IMPORTANT : Le formulaire est PUBLIC, donc on permet les insertions SANS authentification

-- Politique pour permettre la lecture publique (pour tous, même non authentifiés)
CREATE POLICY "Allow public read" ON public.actions_ambassadeurs
    FOR SELECT 
    USING (true);

-- Politique pour permettre l'insertion PUBLIQUE (sans authentification)
-- Les stagiaires peuvent saisir leurs actions sans être connectés
CREATE POLICY "Allow public insert" ON public.actions_ambassadeurs
    FOR INSERT 
    WITH CHECK (true);

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés seulement
-- (pour la gestion interne par les admins)
CREATE POLICY "Allow authenticated update" ON public.actions_ambassadeurs
    FOR UPDATE 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Politique pour permettre la suppression aux utilisateurs authentifiés seulement
-- (pour la gestion interne par les admins)
CREATE POLICY "Allow authenticated delete" ON public.actions_ambassadeurs
    FOR DELETE 
    USING (auth.uid() IS NOT NULL);

-- Vérifier que les politiques ont été créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'actions_ambassadeurs'
ORDER BY policyname;

