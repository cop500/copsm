-- Prénom de la conseillère carrière : Siham → Sihame
UPDATE public.profiles
SET prenom = 'Sihame'
WHERE role = 'conseillere_carriere'
  AND lower(trim(prenom)) = 'siham';
