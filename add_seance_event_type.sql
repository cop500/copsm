-- Script pour ajouter les types d'événements "Séance", "Forum d'orientation" et "Campagne"
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
) VALUES 
(
  'Séance',
  'seance',
  'Séance de formation, d''information ou de coaching',
  '#8B5CF6', -- Couleur violette
  'Users', -- Icône utilisateurs
  true,
  NOW(),
  NOW()
),
(
  'Forum d''orientation',
  'forum_orientation',
  'Forum d''orientation professionnelle et d''information',
  '#10B981', -- Couleur verte
  'MapPin', -- Icône localisation
  true,
  NOW(),
  NOW()
),
(
  'Campagne',
  'campagne',
  'Campagne de communication et de sensibilisation',
  '#F59E0B', -- Couleur orange
  'Megaphone', -- Icône mégaphone
  true,
  NOW(),
  NOW()
);

-- Vérifier que les insertions ont bien fonctionné
SELECT * FROM event_types WHERE code IN ('seance', 'forum_orientation', 'campagne');
