-- Forcer le rafraîchissement des ateliers visibles
-- 1. Mettre à jour tous les ateliers pour s'assurer qu'ils sont corrects
UPDATE evenements 
SET 
    visible_inscription = CASE 
        WHEN titre IN ('cop', 'test finale') THEN true
        ELSE false
    END,
    statut = CASE 
        WHEN titre IN ('cop', 'test finale') THEN 'planifie'
        ELSE 'termine'
    END,
    capacite_actuelle = 0
WHERE type_evenement = 'atelier';

-- 2. Vérifier les ateliers visibles
SELECT 
    id, 
    titre, 
    type_evenement, 
    visible_inscription, 
    statut,
    capacite_maximale,
    capacite_actuelle,
    animateur_nom
FROM evenements 
WHERE type_evenement = 'atelier' 
AND visible_inscription = true
ORDER BY created_at DESC;

-- 3. Supprimer toutes les inscriptions existantes pour repartir à zéro
DELETE FROM inscriptions_ateliers;

-- 4. Vérifier qu'il n'y a plus d'inscriptions
SELECT COUNT(*) as inscriptions_restantes FROM inscriptions_ateliers;
