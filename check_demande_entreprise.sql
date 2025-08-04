-- Vérifier le statut de la demande entreprise existante
-- Exécutez cette requête dans l'éditeur SQL de Supabase

-- 1. Voir toutes les demandes entreprises avec leur statut
SELECT 
    id,
    entreprise_nom,
    secteur,
    type_demande,
    statut,
    created_at
FROM demandes_entreprises
ORDER BY created_at DESC;

-- 2. Voir les demandes avec statut NULL ou vide
SELECT 
    id,
    entreprise_nom,
    secteur,
    type_demande,
    statut,
    created_at
FROM demandes_entreprises
WHERE statut IS NULL OR statut = ''
ORDER BY created_at DESC;

-- 3. Voir les demandes avec statut 'en_cours' ou 'en_attente'
SELECT 
    id,
    entreprise_nom,
    secteur,
    type_demande,
    statut,
    created_at
FROM demandes_entreprises
WHERE statut IN ('en_cours', 'en_attente')
ORDER BY created_at DESC;

-- 4. Mettre à jour le statut de la demande existante (si nécessaire)
-- Décommentez et modifiez selon vos besoins :
-- UPDATE demandes_entreprises 
-- SET statut = 'en_cours' 
-- WHERE statut IS NULL OR statut = ''; 