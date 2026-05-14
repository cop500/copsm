-- À exécuter après create_partenariats_conventions.sql (colonnes existantes + table public.poles).
-- Pôle COP associé à une convention
alter table public.conventions_partenariat
  add column if not exists pole_id uuid null references public.poles(id) on delete set null;

comment on column public.conventions_partenariat.pole_id is 'Pôle COP concerné (paramètres > pôles).';

create index if not exists idx_conventions_partenariat_pole_id
  on public.conventions_partenariat(pole_id);
