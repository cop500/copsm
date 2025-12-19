-- ========================================
-- Migration : Ajouter le champ reference à demandes_entreprises
-- ========================================
-- Format de référence : COP-XXXX (ex: COP-0001, COP-0002, etc.)

DO $$
BEGIN
    -- ========================================
    -- Ajouter la colonne reference à la table demandes_entreprises
    -- Cette colonne stocke une référence unique au format COP-XXXX (ex: COP-0001)
    -- La référence est générée automatiquement par un trigger lors de l'insertion
    -- Format : COP- suivi de 4 chiffres avec zéros à gauche (0001, 0002, etc.)
    -- ========================================
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'demandes_entreprises'
        AND column_name = 'reference'
    ) THEN
        ALTER TABLE demandes_entreprises
        ADD COLUMN reference VARCHAR(10) UNIQUE;

        -- Créer un index pour améliorer les performances de recherche
        CREATE INDEX IF NOT EXISTS idx_demandes_reference
        ON demandes_entreprises(reference);

        COMMENT ON COLUMN demandes_entreprises.reference IS
        'Référence unique de la demande au format COP-XXXX (ex: COP-0001)';

        RAISE NOTICE 'Colonne reference ajoutée avec succès.';
    ELSE
        RAISE NOTICE 'La colonne reference existe déjà.';
    END IF;
END $$;

-- Fonction pour générer automatiquement une référence unique
CREATE OR REPLACE FUNCTION generate_demande_reference()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    new_reference VARCHAR(10);
BEGIN
    -- Si la référence n'est pas déjà définie
    IF NEW.reference IS NULL OR NEW.reference = '' THEN
        -- Trouver le numéro le plus élevé existant
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(reference FROM 5) AS INTEGER)
        ), 0) + 1
        INTO next_num
        FROM demandes_entreprises
        WHERE reference ~ '^COP-[0-9]+$';

        -- Formater avec 4 chiffres (ex: COP-0001)
        new_reference := 'COP-' || LPAD(next_num::TEXT, 4, '0');

        -- Vérifier l'unicité (au cas où)
        WHILE EXISTS (SELECT 1 FROM demandes_entreprises WHERE reference = new_reference) LOOP
            next_num := next_num + 1;
            new_reference := 'COP-' || LPAD(next_num::TEXT, 4, '0');
        END LOOP;

        NEW.reference := new_reference;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour générer automatiquement la référence
DROP TRIGGER IF EXISTS trigger_generate_demande_reference ON demandes_entreprises;
CREATE TRIGGER trigger_generate_demande_reference
    BEFORE INSERT ON demandes_entreprises
    FOR EACH ROW
    EXECUTE FUNCTION generate_demande_reference();

-- Générer les références pour les demandes existantes qui n'en ont pas
DO $$
DECLARE
    demande_record RECORD;
    next_num INTEGER := 1;
    new_reference VARCHAR(10);
BEGIN
    -- Parcourir les demandes sans référence, triées par date de création
    FOR demande_record IN 
        SELECT id, created_at
        FROM demandes_entreprises
        WHERE reference IS NULL OR reference = ''
        ORDER BY created_at ASC
    LOOP
        -- Vérifier si le numéro est déjà utilisé
        WHILE EXISTS (
            SELECT 1 FROM demandes_entreprises 
            WHERE reference = 'COP-' || LPAD(next_num::TEXT, 4, '0')
        ) LOOP
            next_num := next_num + 1;
        END LOOP;

        new_reference := 'COP-' || LPAD(next_num::TEXT, 4, '0');

        -- Mettre à jour la demande
        UPDATE demandes_entreprises
        SET reference = new_reference
        WHERE id = demande_record.id;

        next_num := next_num + 1;
    END LOOP;

    RAISE NOTICE 'Références générées pour les demandes existantes.';
END $$;

