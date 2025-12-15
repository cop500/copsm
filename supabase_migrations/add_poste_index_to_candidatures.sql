-- ========================================
-- Migration : Ajouter les champs pour organiser les candidatures par demande et par poste
-- ========================================
-- Permet de lier les candidatures à une demande spécifique et à un poste spécifique
-- pour une meilleure organisation et gestion

-- 1. Ajouter demande_entreprise_id pour lier à demandes_entreprises
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'candidatures_stagiaires' 
        AND column_name = 'demande_entreprise_id'
    ) THEN
        ALTER TABLE candidatures_stagiaires 
        ADD COLUMN demande_entreprise_id UUID REFERENCES demandes_entreprises(id) ON DELETE CASCADE;
        
        -- Index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS idx_candidatures_demande_entreprise_id 
        ON candidatures_stagiaires(demande_entreprise_id);
        
        COMMENT ON COLUMN candidatures_stagiaires.demande_entreprise_id IS 
        'Référence à la demande d''entreprise spécifique';
    END IF;
END $$;

-- 2. Ajouter poste_index pour identifier le poste dans le tableau profils
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'candidatures_stagiaires' 
        AND column_name = 'poste_index'
    ) THEN
        ALTER TABLE candidatures_stagiaires 
        ADD COLUMN poste_index INTEGER;
        
        -- Index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS idx_candidatures_poste_index 
        ON candidatures_stagiaires(poste_index);
        
        COMMENT ON COLUMN candidatures_stagiaires.poste_index IS 
        'Index du poste dans le tableau profils de la demande (0-based)';
    END IF;
END $$;

-- 3. Mettre à jour les candidatures existantes si possible
-- (basé sur entreprise_nom et poste pour les candidatures existantes)
DO $$
DECLARE
    candidature_record RECORD;
    demande_record RECORD;
    profil_index INTEGER;
BEGIN
    -- Pour chaque candidature existante sans demande_entreprise_id
    FOR candidature_record IN 
        SELECT id, entreprise_nom, poste 
        FROM candidatures_stagiaires 
        WHERE demande_entreprise_id IS NULL 
        AND entreprise_nom IS NOT NULL
    LOOP
        -- Chercher la demande correspondante
        SELECT id, profils INTO demande_record
        FROM demandes_entreprises
        WHERE entreprise_nom = candidature_record.entreprise_nom
        AND profils IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1;
        
        IF demande_record.id IS NOT NULL THEN
            -- Chercher l'index du poste dans les profils
            profil_index := NULL;
            IF jsonb_typeof(demande_record.profils) = 'array' THEN
                FOR i IN 0..jsonb_array_length(demande_record.profils) - 1 LOOP
                    IF (demande_record.profils->i->>'poste_intitule') = candidature_record.poste THEN
                        profil_index := i;
                        EXIT;
                    END IF;
                END LOOP;
            END IF;
            
            -- Mettre à jour la candidature
            UPDATE candidatures_stagiaires
            SET demande_entreprise_id = demande_record.id,
                poste_index = profil_index
            WHERE id = candidature_record.id;
        END IF;
    END LOOP;
END $$;

-- 4. Vérification
SELECT 
    'Migration terminée' as status,
    COUNT(*) FILTER (WHERE demande_entreprise_id IS NOT NULL) as candidatures_avec_demande,
    COUNT(*) FILTER (WHERE poste_index IS NOT NULL) as candidatures_avec_poste_index,
    COUNT(*) as total_candidatures
FROM candidatures_stagiaires;

