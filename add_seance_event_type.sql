-- Script pour ajouter le type d'événement "Séance"
-- Exécuter ce script dans l'éditeur SQL de Supabase

INSERT INTO event_types (
  nom,
  code,
  description,
  couleur,
  icon,
  actif,
  created_at,
  updated_at
) VALUES (
  'Séance',
  'seance',
  'Séance de formation, d''information ou de coaching',
  '#8B5CF6', -- Couleur violette
  'Users', -- Icône utilisateurs
  true,
  NOW(),
  NOW()
);

-- Vérifier que l'insertion a bien fonctionné
SELECT * FROM event_types WHERE code = 'seance';
