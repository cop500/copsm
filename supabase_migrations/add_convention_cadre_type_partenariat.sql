-- Ajouter le type de convention "convention_cadre" (bases deja deployees)
alter table public.conventions_partenariat
  drop constraint if exists conventions_partenariat_type_convention_check;

alter table public.conventions_partenariat
  add constraint conventions_partenariat_type_convention_check
  check (type_convention in ('stage', 'alternance', 'recrutement', 'convention_cadre', 'autre'));
