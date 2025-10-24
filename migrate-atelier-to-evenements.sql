-- Migrer l'atelier de la table ateliers vers evenements
INSERT INTO evenements (
  id, titre, description, date_debut, date_fin, lieu, 
  capacite_maximale, capacite_actuelle, statut, 
  type_evenement, visible_inscription, created_at, updated_at
)
SELECT 
  id, titre, description, date_debut, date_fin, lieu,
  capacite_max, capacite_actuelle, statut,
  'atelier' as type_evenement, 
  CASE WHEN actif = true THEN true ELSE false END as visible_inscription,
  created_at, updated_at
FROM ateliers 
WHERE id = 'c950191c-1161-4d83-a5b3-ec7751fb4da0'
ON CONFLICT (id) DO NOTHING;
