-- ========================================
-- Migration : Ajouter le champ visible_inscription à la table evenements
-- ========================================
-- Permet aux admins de contrôler la visibilité des ateliers sur la page d'inscription
-- sans changer le statut de l'atelier

-- 1. Ajouter visible_inscription si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evenements' 
        AND column_name = 'visible_inscription'
    ) THEN
        ALTER TABLE evenements 
        ADD COLUMN visible_inscription BOOLEAN DEFAULT false;
        
        -- Index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS idx_evenements_visible_inscription 
        ON evenements(visible_inscription);
        
        COMMENT ON COLUMN evenements.visible_inscription IS 
        'Contrôle la visibilité de l''atelier sur la page d''inscription publique (true = visible, false = caché)';
        
        -- Par défaut, rendre visible les ateliers planifiés ou en cours
        UPDATE evenements
        SET visible_inscription = true
        WHERE type_evenement = 'atelier'
        AND statut IN ('planifie', 'en_cours')
        AND visible_inscription IS NULL;
    END IF;
END $$;

-- 2. Vérification
SELECT 
    'Migration terminée' as status,
    COUNT(*) FILTER (WHERE visible_inscription = true) as ateliers_visibles,
    COUNT(*) FILTER (WHERE visible_inscription = false) as ateliers_caches,
    COUNT(*) as total_ateliers
FROM evenements
WHERE type_evenement = 'atelier';

