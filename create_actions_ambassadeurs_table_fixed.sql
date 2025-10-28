-- Script corrigé pour créer la table des actions des stagiaires ambassadeurs
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer la table actions_ambassadeurs
CREATE TABLE IF NOT EXISTS public.actions_ambassadeurs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Informations générales
    nom_prenom_stagiaire TEXT NOT NULL,
    equipe_participante TEXT,
    
    -- Détails de l'action
    volet_action TEXT NOT NULL CHECK (volet_action IN (
        'information_communication',
        'accompagnement_projets', 
        'assistance_carriere',
        'assistance_filiere'
    )),
    responsable_action TEXT NOT NULL,
    lieu_realisation TEXT NOT NULL,
    date_action DATE NOT NULL,
    nombre_participants INTEGER NOT NULL DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actif BOOLEAN DEFAULT true
);

-- 2. Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_actions_ambassadeurs_date_action ON public.actions_ambassadeurs(date_action);
CREATE INDEX IF NOT EXISTS idx_actions_ambassadeurs_volet_action ON public.actions_ambassadeurs(volet_action);
CREATE INDEX IF NOT EXISTS idx_actions_ambassadeurs_actif ON public.actions_ambassadeurs(actif);

-- 3. Ajouter des commentaires pour documenter la table
COMMENT ON TABLE public.actions_ambassadeurs IS 'Table pour le suivi des actions des stagiaires ambassadeurs';
COMMENT ON COLUMN public.actions_ambassadeurs.nom_prenom_stagiaire IS 'Nom et prénom du stagiaire ambassadeur';
COMMENT ON COLUMN public.actions_ambassadeurs.equipe_participante IS 'Équipe participante et membres impliqués';
COMMENT ON COLUMN public.actions_ambassadeurs.volet_action IS 'Volet de l''action (information_communication, accompagnement_projets, assistance_carriere, assistance_filiere)';
COMMENT ON COLUMN public.actions_ambassadeurs.responsable_action IS 'Nom et prénom du responsable de l''action';
COMMENT ON COLUMN public.actions_ambassadeurs.lieu_realisation IS 'Lieu de réalisation (ville, établissement, lieu exact)';
COMMENT ON COLUMN public.actions_ambassadeurs.date_action IS 'Date de réalisation de l''action';
COMMENT ON COLUMN public.actions_ambassadeurs.nombre_participants IS 'Nombre de participants à l''action';

-- 4. Activer RLS (Row Level Security)
ALTER TABLE public.actions_ambassadeurs ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer les politiques existantes si elles existent (pour éviter l'erreur)
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.actions_ambassadeurs;
DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON public.actions_ambassadeurs;
DROP POLICY IF EXISTS "Allow update access to authenticated users" ON public.actions_ambassadeurs;
DROP POLICY IF EXISTS "Allow delete access to authenticated users" ON public.actions_ambassadeurs;

-- 6. Créer les politiques RLS
-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Allow read access to authenticated users" ON public.actions_ambassadeurs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre l'insertion à tous les utilisateurs authentifiés (pour le formulaire public)
CREATE POLICY "Allow insert access to authenticated users" ON public.actions_ambassadeurs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Allow update access to authenticated users" ON public.actions_ambassadeurs
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Allow delete access to authenticated users" ON public.actions_ambassadeurs
    FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Créer une fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS update_actions_ambassadeurs_updated_at ON public.actions_ambassadeurs;

-- 9. Créer le trigger pour updated_at
CREATE TRIGGER update_actions_ambassadeurs_updated_at 
    BEFORE UPDATE ON public.actions_ambassadeurs 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Vérifier que la table a été créée correctement
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'actions_ambassadeurs' 
ORDER BY ordinal_position;

