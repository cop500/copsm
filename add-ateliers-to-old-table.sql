-- Ajouter les ateliers "cop" et "test finale" dans la table ateliers

-- 1. Supprimer les anciens ateliers "cop" et "test finale" s'ils existent
DELETE FROM ateliers 
WHERE titre IN ('cop', 'test finale');

-- 2. Ajouter l'atelier "cop"
INSERT INTO ateliers (
    titre,
    description,
    date_debut,
    date_fin,
    lieu,
    statut,
    actif,
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
    true,
    20,
    0,
    'OMAR OUMOUZOUNE',
    'Formateur',
    NOW(),
    NOW()
);

-- 3. Ajouter l'atelier "test finale"
INSERT INTO ateliers (
    titre,
    description,
    date_debut,
    date_fin,
    lieu,
    statut,
    actif,
    capacite_maximale,
    capacite_actuelle,
    animateur_nom,
    animateur_role,
    created_at,
    updated_at
) VALUES (
    'test finale',
    'Atelier de test final',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '8 hours',
    'cop',
    'planifie',
    true,
    20,
    0,
    'OMAR OUMOUZOUNE',
    'Formateur',
    NOW(),
    NOW()
);

-- 4. Vérifier les ateliers actifs
SELECT 
    id, 
    titre, 
    statut, 
    actif,
    capacite_maximale,
    capacite_actuelle,
    animateur_nom
FROM ateliers 
WHERE actif = true
ORDER BY created_at DESC;
