-- Script pour ajouter les nouveaux types d'événements de recrutement
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajouter les nouveaux types d'événements
INSERT INTO event_types (nom, code, description, couleur, icon, actif, created_at, updated_at) VALUES
('Talent Acquisition', 'talent_acquisition', 'Événements de recrutement et acquisition de talents', '#3B82F6', 'users', true, NOW(), NOW()),
('Sourcing', 'sourcing', 'Événements de sourcing et prospection de candidats', '#10B981', 'search', true, NOW(), NOW()),
('HIRING DRIVE', 'hiring_drive', 'Campagnes de recrutement intensives', '#F59E0B', 'zap', true, NOW(), NOW()),
('Speed Hiring', 'speed_hiring', 'Recrutement rapide et événements express', '#EF4444', 'clock', true, NOW(), NOW());

-- Vérifier l'ajout
SELECT * FROM event_types WHERE code IN ('talent_acquisition', 'sourcing', 'hiring_drive', 'speed_hiring') ORDER BY nom;
