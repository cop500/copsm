-- Registre public des visiteurs COP
create table if not exists public.registre_visiteurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  genre text null check (genre in ('homme', 'femme')),
  telephone text not null,
  type_visite text not null check (type_visite in ('orientation', 'entreprise', 'autre')),
  pole_id uuid null references public.poles(id) on delete set null,
  pole_nom text null,
  motif_autre text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_registre_visiteurs_created_at
  on public.registre_visiteurs(created_at desc);

create index if not exists idx_registre_visiteurs_telephone_created_at
  on public.registre_visiteurs(telephone, created_at desc);

alter table public.registre_visiteurs
  add column if not exists motif_autre text null;

alter table public.registre_visiteurs
  add column if not exists genre text null;

alter table public.registre_visiteurs enable row level security;

-- Autoriser les visiteurs (public) a enregistrer leur passage
drop policy if exists "public_can_insert_registre_visiteurs" on public.registre_visiteurs;
create policy "public_can_insert_registre_visiteurs"
  on public.registre_visiteurs
  for insert
  to anon, authenticated
  with check (true);

-- Autoriser la consultation aux utilisateurs connectes
drop policy if exists "authenticated_can_read_registre_visiteurs" on public.registre_visiteurs;
create policy "authenticated_can_read_registre_visiteurs"
  on public.registre_visiteurs
  for select
  to authenticated
  using (true);

