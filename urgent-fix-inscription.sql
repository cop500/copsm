-- SOLUTION URGENTE : Vérifier et corriger le problème d'inscription

-- 1. Vérifier les ateliers visibles actuellement
SELECT 
    'Ateliers visibles' as info,
    id, 
    titre, 
    type_evenement, 
    visible_inscription, 
    statut,
    capacite_maximale,
    capacite_actuelle
FROM evenements 
WHERE type_evenement = 'atelier' 
AND visible_inscription = true
ORDER BY created_at DESC;

-- 2. Vérifier s'il y a des inscriptions orphelines
SELECT 
    'Inscriptions orphelines' as info,
    ia.id,
    ia.atelier_id,
    ia.stagiaire_nom,
    ia.stagiaire_email,
    CASE 
        WHEN e.id IS NULL THEN 'ATELIER INEXISTANT'
        ELSE 'ATELIER EXISTE'
    END as statut_atelier
FROM inscriptions_ateliers ia
LEFT JOIN evenements e ON ia.atelier_id = e.id
WHERE e.id IS NULL;

-- 3. Supprimer toutes les inscriptions orphelines
DELETE FROM inscriptions_ateliers 
WHERE atelier_id NOT IN (
    SELECT id FROM evenements WHERE type_evenement = 'atelier'
);

-- 4. Recréer les ateliers avec des IDs propres
-- Supprimer les anciens ateliers "cop" et "test finale"
DELETE FROM evenements 
WHERE titre IN ('cop', 'test finale') AND type_evenement = 'atelier';

-- Recréer l'atelier "cop" avec un nouvel ID
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
);

-- Recréer l'atelier "test finale" avec un nouvel ID
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
    'test finale',
    'Atelier de test final',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '8 hours',
    'cop',
    'planifie',
    'atelier',
    true,
    20,
    0,
    'OMAR OUMOUZOUNE',
    'Formateur',
    NOW(),
    NOW()
);

-- 5. Vérifier le résultat final
SELECT 
    'Résultat final' as info,
    id, 
    titre, 
    type_evenement, 
    visible_inscription, 
    statut,
    capacite_maximale,
    capacite_actuelle
FROM evenements 
WHERE type_evenement = 'atelier' 
AND visible_inscription = true
ORDER BY created_at DESC;
