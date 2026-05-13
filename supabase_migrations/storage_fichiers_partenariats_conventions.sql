-- Optionnel : politiques Storage pour les PDF de conventions (bucket public `fichiers`).
-- À exécuter seulement si l’upload échoue encore (RLS) après déploiement du chemin
-- `fiches_poste/conventions_partenariat_*` côté application.
--
-- Vérifier d’abord les politiques existantes sur storage.objects pour ce bucket
-- (éviter les doublons inutiles).

-- Lecture publique des objets concernés (affichage PDF / iframe)
drop policy if exists "fichiers partenariats conventions select public" on storage.objects;
create policy "fichiers partenariats conventions select public"
  on storage.objects for select
  to public
  using (
    bucket_id = 'fichiers'
    and (
      (storage.foldername(name))[1] = 'conventions_partenariat'
      or (
        (storage.foldername(name))[1] = 'fiches_poste'
        and name like 'fiches_poste/conventions_partenariat%'
      )
    )
  );

drop policy if exists "fichiers partenariats conventions insert authenticated" on storage.objects;
create policy "fichiers partenariats conventions insert authenticated"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'fichiers'
    and (
      (storage.foldername(name))[1] = 'conventions_partenariat'
      or (
        (storage.foldername(name))[1] = 'fiches_poste'
        and name like 'fiches_poste/conventions_partenariat%'
      )
    )
  );

drop policy if exists "fichiers partenariats conventions update authenticated" on storage.objects;
create policy "fichiers partenariats conventions update authenticated"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'fichiers'
    and (
      (storage.foldername(name))[1] = 'conventions_partenariat'
      or (
        (storage.foldername(name))[1] = 'fiches_poste'
        and name like 'fiches_poste/conventions_partenariat%'
      )
    )
  );

drop policy if exists "fichiers partenariats conventions delete authenticated" on storage.objects;
create policy "fichiers partenariats conventions delete authenticated"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'fichiers'
    and (
      (storage.foldername(name))[1] = 'conventions_partenariat'
      or (
        (storage.foldername(name))[1] = 'fiches_poste'
        and name like 'fiches_poste/conventions_partenariat%'
      )
    )
  );
