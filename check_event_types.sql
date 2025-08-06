-- ========================================
-- Script pour vérifier et peupler la table event_types
-- ========================================

-- 1. Vérifier si la table existe et sa structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_types'
ORDER BY ordinal_position;

-- 2. Vérifier le contenu actuel
SELECT * FROM event_types;

-- 3. Insérer des types d'événements par défaut si la table est vide
INSERT INTO event_types (nom, code, couleur, actif) VALUES
('Job Dating', 'JOB_DATING', '#3B82F6', true),
('Forum Emploi', 'FORUM_EMPLOI', '#10B981', true),
('Visite d''Entreprise', 'VISITE_ENTREPRISE', '#F59E0B', true),
('Formation', 'FORMATION', '#8B5CF6', true),
('Conférence', 'CONFERENCE', '#EF4444', true),
('Atelier', 'ATELIER', '#06B6D4', true),
('Salon', 'SALON', '#84CC16', true),
('Séminaire', 'SEMINAIRE', '#F97316', true)
ON CONFLICT (code) DO NOTHING;

-- 4. Vérifier le résultat
SELECT * FROM event_types WHERE actif = true ORDER BY nom; 