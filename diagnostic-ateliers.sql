-- Diagnostic complet des ateliers

-- 1. Vérifier les ateliers dans la table 'ateliers' (utilisée par la page d'inscription)
SELECT 
    'Table ateliers' as source,
    id, 
    titre, 
    statut, 
    actif,
    date_debut,
    date_fin,
    lieu
FROM ateliers 
WHERE actif = true
ORDER BY created_at DESC;

-- 2. Vérifier les ateliers dans la table 'evenements' (utilisée par l'onglet ateliers)
SELECT 
    'Table evenements' as source,
    id, 
    titre, 
    type_evenement,
    statut, 
    visible_inscription,
    date_debut,
    date_fin,
    lieu
FROM evenements 
WHERE type_evenement = 'atelier'
ORDER BY created_at DESC;

-- 3. Vérifier les inscriptions existantes
SELECT 
    'Inscriptions' as source,
    ia.id,
    ia.atelier_id,
    ia.stagiaire_nom,
    ia.stagiaire_email,
    a.titre as atelier_titre
FROM inscriptions_ateliers ia
LEFT JOIN ateliers a ON ia.atelier_id = a.id
ORDER BY ia.created_at DESC;
