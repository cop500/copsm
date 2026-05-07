-- Ajouter niveau scolaire et niveau souhaite au registre des visiteurs
alter table public.registre_visiteurs
  add column if not exists niveau_scolaire text null;

alter table public.registre_visiteurs
  add column if not exists niveau_souhaite text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'registre_visiteurs_niveau_scolaire_check'
      and conrelid = 'public.registre_visiteurs'::regclass
  ) then
    alter table public.registre_visiteurs
      add constraint registre_visiteurs_niveau_scolaire_check
      check (niveau_scolaire in ('primaire', 'college', 'lycee', 'bachelier', 'universitaire'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'registre_visiteurs_niveau_souhaite_check'
      and conrelid = 'public.registre_visiteurs'::regclass
  ) then
    alter table public.registre_visiteurs
      add constraint registre_visiteurs_niveau_souhaite_check
      check (niveau_souhaite in ('technicien_specialise', 'technicien', 'qualification', 'formation_qualifiante'));
  end if;
end $$;
