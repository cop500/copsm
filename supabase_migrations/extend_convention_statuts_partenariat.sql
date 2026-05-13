-- Statuts etendus pour conventions_partenariat (negociation, signature, etc.)
alter table public.conventions_partenariat
  drop constraint if exists conventions_partenariat_statut_check;

alter table public.conventions_partenariat
  add constraint conventions_partenariat_statut_check
  check (
    statut in (
      'brouillon',
      'en_negociation',
      'retour_entreprise',
      'en_attente_signature',
      'validee_cop',
      'en_vigueur',
      'suspendue',
      'expiree',
      'renouvelee',
      'archivee'
    )
  );
