export type PorteStagiaire = {
  id: string
  verbe: string
  titre: string
  resume: string
  path: string
  essentielle: boolean
}

/** Portes publiques stagiaire uniquement (hors GOT Talent, satisfaction, entreprises, JPO, COP interne). */
export const PORTES_STAGIAIRE: PorteStagiaire[] = [
  {
    id: 'ateliers',
    verbe: 'Je m’inscris',
    titre: 'Ateliers',
    resume: 'Réserver une place à un atelier d’orientation ou d’insertion.',
    path: '/inscription-ateliers/',
    essentielle: true,
  },
  {
    id: 'cv',
    verbe: 'Je dépose',
    titre: 'CV Connect',
    resume: 'Envoyer mon CV au COP, avec mon pôle et ma filière.',
    path: '/cv-connect/public/',
    essentielle: true,
  },
  {
    id: 'candidature',
    verbe: 'Je postule',
    titre: 'Candidatures',
    resume: 'Voir les offres partenaires et déposer ma candidature.',
    path: '/candidature/',
    essentielle: true,
  },
  {
    id: 'assistance',
    verbe: 'Je demande',
    titre: 'Assistance',
    resume: 'Écrire à un conseiller pour une aide concrète.',
    path: '/assistance-stagiaires/demande/',
    essentielle: true,
  },
  {
    id: 'ambassadeurs',
    verbe: 'Je rayonne',
    titre: 'Ambassadeurs',
    resume: 'Déclarer une action réalisée pour le COP.',
    path: '/ambassadeurs/',
    essentielle: false,
  },
  {
    id: 'insertion',
    verbe: 'Je témoigne',
    titre: 'Enquête insertion',
    resume: 'Dire où j’en suis après la formation.',
    path: '/enquete-insertion/public/',
    essentielle: false,
  },
]
