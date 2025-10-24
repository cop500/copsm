-- SOLUTION DRASTIQUE : Recréer la table inscriptions_ateliers

-- 1. Sauvegarder les données existantes
CREATE TABLE inscriptions_ateliers_backup AS 
SELECT * FROM inscriptions_ateliers;

-- 2. Supprimer l'ancienne table
DROP TABLE IF EXISTS inscriptions_ateliers CASCADE;

-- 3. Recréer la table avec la bonne contrainte
CREATE TABLE public.inscriptions_ateliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atelier_id UUID NOT NULL REFERENCES public.evenements(id) ON DELETE CASCADE,
    stagiaire_nom TEXT NOT NULL,
    stagiaire_email TEXT NOT NULL,
    stagiaire_pole TEXT,
    stagiaire_filliere TEXT,
    stagiaire_telephone TEXT,
    date_inscription TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    statut TEXT DEFAULT 'en_attente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Restaurer les données valides
INSERT INTO inscriptions_ateliers (
    atelier_id, stagiaire_nom, stagiaire_email, stagiaire_pole, 
    stagiaire_filliere, stagiaire_telephone, date_inscription, statut, created_at
)
SELECT 
    ia.atelier_id, ia.stagiaire_nom, ia.stagiaire_email, ia.stagiaire_pole,
    ia.stagiaire_filliere, ia.stagiaire_telephone, ia.date_inscription, ia.statut, ia.created_at
FROM inscriptions_ateliers_backup ia
JOIN evenements e ON ia.atelier_id = e.id
WHERE e.type_evenement = 'atelier';

-- 5. Vérifier le résultat
SELECT 
    'Table recréée' as info,
    COUNT(*) as nombre_inscriptions
FROM inscriptions_ateliers;
