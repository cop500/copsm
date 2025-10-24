-- Recréer l'atelier "cop" dans la table evenements
INSERT INTO evenements (
    titre,
    description,
    date_debut,
    date_fin,
    lieu,
    statut,
    type_evenement,
    visible_inscription,
    capacite_maximale,
    capacite_actuelle,
    animateur_nom,
    animateur_role,
    created_at,
    updated_at
) VALUES (
    'cop',
    'Atelier de formation COP',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
    'Salle de formation',
    'planifie',
    'atelier',
    true,
    20,
    0,
    'OMAR OUMOUZOUNE',
    'Formateur',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Vérifier que l'atelier a été créé
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
WHERE titre = 'cop' AND type_evenement = 'atelier';
