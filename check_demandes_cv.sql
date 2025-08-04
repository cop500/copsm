-- Requête pour vérifier la table demandes_cv (la vraie table !)
-- Exécutez cette requête dans l'éditeur SQL de Supabase

-- 1. Voir toutes les demandes CV avec leurs statuts
SELECT 
    dc.id,
    dc.created_at,
    dc.updated_at,
    dc.statut,
    dc.nom_entreprise,
    dc.poste_recherche,
    dc.type_contrat,
    dc.niveau_requis,
    dc.contact_nom,
    dc.contact_email
FROM demandes_cv dc
ORDER BY dc.created_at DESC;

-- 2. Compter les demandes par statut
SELECT 
    statut,
    COUNT(*) as nombre_demandes
FROM demandes_cv
GROUP BY statut
ORDER BY nombre_demandes DESC;

-- 3. Voir les demandes sans statut (NULL)
SELECT 
    dc.id,
    dc.created_at,
    dc.updated_at,
    dc.statut,
    dc.nom_entreprise,
    dc.poste_recherche,
    dc.type_contrat,
    dc.niveau_requis
FROM demandes_cv dc
WHERE dc.statut IS NULL
ORDER BY dc.created_at DESC;

-- 4. Voir la structure de la table demandes_cv
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'demandes_cv'
ORDER BY ordinal_position; 