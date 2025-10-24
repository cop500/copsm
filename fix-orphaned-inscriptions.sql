-- 1. Supprimer les inscriptions orphelines qui référencent des ateliers inexistants
DELETE FROM inscriptions_ateliers 
WHERE atelier_id NOT IN (
    SELECT id FROM evenements WHERE type_evenement = 'atelier'
);

-- 2. Vérifier les ateliers existants
SELECT 
    'Ateliers dans evenements' as source,
    id, 
    titre, 
    type_evenement, 
    visible_inscription, 
    statut,
    capacite_maximale,
    capacite_actuelle
FROM evenements 
WHERE type_evenement = 'atelier'
ORDER BY created_at DESC;

-- 3. Vérifier les inscriptions restantes
SELECT 
    'Inscriptions restantes' as source,
    ia.id,
    ia.atelier_id,
    ia.nom_complet,
    ia.email,
    e.titre as atelier_titre
FROM inscriptions_ateliers ia
LEFT JOIN evenements e ON ia.atelier_id = e.id
ORDER BY ia.created_at DESC;
