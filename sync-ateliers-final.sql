-- SOLUTION DÉFINITIVE : Synchroniser les ateliers

-- 1. Supprimer l'atelier "PITCHER VOTRE LOGO..." de la table ateliers s'il existe
DELETE FROM ateliers 
WHERE titre ILIKE '%PITCHER%' OR titre ILIKE '%LOGO%';

-- 2. Supprimer toutes les inscriptions orphelines
DELETE FROM inscriptions_ateliers 
WHERE atelier_id NOT IN (
    SELECT id FROM evenements WHERE type_evenement = 'atelier'
);

-- 3. S'assurer que tous les ateliers dans evenements ont les bonnes valeurs
UPDATE evenements 
SET 
    visible_inscription = CASE 
        WHEN statut IN ('planifie', 'en_cours') THEN true
        ELSE false
    END,
    capacite_actuelle = COALESCE(capacite_actuelle, 0),
    capacite_maximale = COALESCE(capacite_maximale, 20)
WHERE type_evenement = 'atelier';

-- 4. Vérifier les ateliers visibles pour inscription
SELECT 
    'Ateliers visibles pour inscription' as info,
    id, 
    titre, 
    statut,
    visible_inscription,
    capacite_maximale,
    capacite_actuelle,
    animateur_nom
FROM evenements 
WHERE type_evenement = 'atelier' 
AND visible_inscription = true
ORDER BY created_at DESC;

-- 5. Vérifier les inscriptions restantes
SELECT 
    'Inscriptions valides' as info,
    COUNT(*) as nombre_inscriptions
FROM inscriptions_ateliers ia
JOIN evenements e ON ia.atelier_id = e.id
WHERE e.type_evenement = 'atelier';
