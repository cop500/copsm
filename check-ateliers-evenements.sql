-- Vérifier tous les ateliers dans la table evenements
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
ORDER BY created_at DESC;
