-- Mettre à jour les ateliers existants avec des valeurs par défaut
UPDATE evenements 
SET 
  capacite_maximale = COALESCE(capacite_maximale, 20),
  capacite_actuelle = COALESCE(capacite_actuelle, 0),
  visible_inscription = COALESCE(visible_inscription, false)
WHERE type_evenement = 'atelier';

-- Vérifier les mises à jour
SELECT 
  id,
  titre,
  type_evenement,
  capacite_maximale,
  capacite_actuelle,
  visible_inscription
FROM evenements 
WHERE type_evenement = 'atelier'
ORDER BY created_at DESC
LIMIT 5;
