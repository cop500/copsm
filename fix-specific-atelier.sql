-- Mettre à jour l'atelier "test inscription" spécifiquement
UPDATE evenements 
SET 
  capacite_maximale = 20,
  capacite_actuelle = 0,
  visible_inscription = true
WHERE titre = 'test inscription' AND type_evenement = 'atelier';

-- Vérifier la mise à jour
SELECT 
  id,
  titre,
  type_evenement,
  capacite_maximale,
  capacite_actuelle,
  visible_inscription
FROM evenements 
WHERE titre = 'test inscription' AND type_evenement = 'atelier';
