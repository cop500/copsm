-- Partenariats CMC : entreprises et conventions (plusieurs conventions par entreprise)
-- Après exécution : vérifier que le bucket Storage "fichiers" autorise l'upload sur le préfixe conventions_partenariat/
-- (policies Storage distinctes des tables SQL).

create table if not exists public.partenaires_entreprises (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  secteur text null,
  contact_nom text null,
  contact_email text null,
  contact_telephone text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conventions_partenariat (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.partenaires_entreprises(id) on delete cascade,
  reference_interne text null,
  type_convention text not null
    check (type_convention in ('stage', 'alternance', 'recrutement', 'autre')),
  date_signature date null,
  date_debut date null,
  date_fin date null,
  statut text not null default 'brouillon'
    check (statut in ('brouillon', 'en_vigueur', 'suspendue', 'expiree', 'renouvelee')),
  fichier_url text null,
  fichier_path text null,
  notes_internes text null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conventions_partenariat_entreprise
  on public.conventions_partenariat(entreprise_id);

create index if not exists idx_conventions_partenariat_created_at
  on public.conventions_partenariat(created_at desc);

create index if not exists idx_partenaires_entreprises_nom
  on public.partenaires_entreprises(nom);

alter table public.partenaires_entreprises enable row level security;
alter table public.conventions_partenariat enable row level security;

-- Accès équipe connectée (à affiner plus tard : admin seul, etc.)
drop policy if exists "partenaires_authenticated_select" on public.partenaires_entreprises;
create policy "partenaires_authenticated_select"
  on public.partenaires_entreprises for select to authenticated using (true);

drop policy if exists "partenaires_authenticated_insert" on public.partenaires_entreprises;
create policy "partenaires_authenticated_insert"
  on public.partenaires_entreprises for insert to authenticated with check (true);

drop policy if exists "partenaires_authenticated_update" on public.partenaires_entreprises;
create policy "partenaires_authenticated_update"
  on public.partenaires_entreprises for update to authenticated using (true) with check (true);

drop policy if exists "partenaires_authenticated_delete" on public.partenaires_entreprises;
create policy "partenaires_authenticated_delete"
  on public.partenaires_entreprises for delete to authenticated using (true);

drop policy if exists "conventions_authenticated_select" on public.conventions_partenariat;
create policy "conventions_authenticated_select"
  on public.conventions_partenariat for select to authenticated using (true);

drop policy if exists "conventions_authenticated_insert" on public.conventions_partenariat;
create policy "conventions_authenticated_insert"
  on public.conventions_partenariat for insert to authenticated with check (true);

drop policy if exists "conventions_authenticated_update" on public.conventions_partenariat;
create policy "conventions_authenticated_update"
  on public.conventions_partenariat for update to authenticated using (true) with check (true);

drop policy if exists "conventions_authenticated_delete" on public.conventions_partenariat;
create policy "conventions_authenticated_delete"
  on public.conventions_partenariat for delete to authenticated using (true);
