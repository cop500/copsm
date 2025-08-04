-- Vérifier les statuts des demandes entreprises
SELECT 
  statut,
  COUNT(*) as nombre_demandes,
  MIN(created_at) as plus_ancienne,
  MAX(created_at) as plus_recente
FROM demandes_entreprises 
GROUP BY statut
ORDER BY nombre_demandes DESC;

-- Voir les 5 dernières demandes avec leur statut
SELECT 
  id,
  entreprise_nom,
  statut,
  created_at,
  type_demande
FROM demandes_entreprises 
ORDER BY created_at DESC 
LIMIT 5;

-- Vérifier s'il y a des demandes sans statut
SELECT 
  id,
  entreprise_nom,
  statut,
  created_at
FROM demandes_entreprises 
WHERE statut IS NULL OR statut = ''
ORDER BY created_at DESC; 