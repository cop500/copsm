-- Script simple pour nettoyer les inscriptions orphelines
-- 1. Supprimer les inscriptions qui référencent des ateliers inexistants
DELETE FROM inscriptions_ateliers 
WHERE atelier_id NOT IN (
    SELECT id FROM evenements WHERE type_evenement = 'atelier'
);

-- 2. Afficher le résultat
SELECT 'Inscriptions orphelines supprimées' as message;
