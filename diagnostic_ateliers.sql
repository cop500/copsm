-- Script de diagnostic pour les ateliers
-- Vérifier l'état de la base de données

-- 1. Vérifier la structure de la table ateliers
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ateliers' 
ORDER BY ordinal_position;

-- 2. Vérifier tous les ateliers existants
SELECT 
    id,
    titre,
    statut,
    actif,
    date_debut,
    date_fin,
    capacite_max,
    capacite_actuelle,
    pole,
    filliere,
    created_at
FROM ateliers 
ORDER BY created_at DESC;

-- 3. Vérifier les ateliers qui devraient s'afficher (actif = true et date_future)
SELECT 
    id,
    titre,
    statut,
    actif,
    date_debut,
    date_fin,
    capacite_max,
    capacite_actuelle,
    pole,
    filliere
FROM ateliers 
WHERE actif = true 
  AND date_debut >= NOW()
ORDER BY date_debut;

-- 4. Vérifier les contraintes de clés étrangères
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('ateliers', 'inscriptions_ateliers');

-- 5. Vérifier les inscriptions existantes
SELECT 
    id,
    atelier_id,
    stagiaire_nom,
    stagiaire_email,
    statut,
    date_inscription
FROM inscriptions_ateliers 
ORDER BY date_inscription DESC;

-- 6. Compter les ateliers par statut
SELECT 
    statut,
    COUNT(*) as nombre,
    COUNT(CASE WHEN actif = true THEN 1 END) as actifs,
    COUNT(CASE WHEN date_debut >= NOW() THEN 1 END) as futurs
FROM ateliers 
GROUP BY statut;
