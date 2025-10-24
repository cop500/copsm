-- SOLUTION FINALE : Corriger la clé étrangère définitivement

-- 1. Vérifier la contrainte actuelle
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='inscriptions_ateliers';

-- 2. Supprimer l'ancienne contrainte
ALTER TABLE public.inscriptions_ateliers 
DROP CONSTRAINT IF EXISTS inscriptions_ateliers_atelier_id_fkey;

-- 3. Ajouter la nouvelle contrainte vers evenements
ALTER TABLE public.inscriptions_ateliers 
ADD CONSTRAINT inscriptions_ateliers_atelier_id_fkey 
FOREIGN KEY (atelier_id) REFERENCES public.evenements(id) ON DELETE CASCADE;

-- 4. Vérifier que l'atelier "test 1 pour norification" existe dans evenements
SELECT 
    'Atelier test 1' as info,
    id, 
    titre, 
    type_evenement,
    visible_inscription,
    statut
FROM evenements 
WHERE titre ILIKE '%test 1%' OR titre ILIKE '%norification%';

-- 5. Supprimer toutes les inscriptions orphelines
DELETE FROM inscriptions_ateliers 
WHERE atelier_id NOT IN (
    SELECT id FROM evenements WHERE type_evenement = 'atelier'
);

-- 6. Vérifier le résultat
SELECT 
    'Inscriptions valides' as info,
    COUNT(*) as nombre_inscriptions
FROM inscriptions_ateliers ia
JOIN evenements e ON ia.atelier_id = e.id
WHERE e.type_evenement = 'atelier';
