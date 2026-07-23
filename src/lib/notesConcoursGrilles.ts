import type { NotesConcoursGrilleCode } from './notesConcoursGrilleMapping'
import { resolveGrilleCodeFromFiliere } from './notesConcoursGrilleMapping'

export interface NotesConcoursCriterion {
  id: string
  label: string
  maxPoints: number
}

export interface NotesConcoursGrilleBloc {
  id: string
  label: string
  subtotalLabel: string
  criteria: NotesConcoursCriterion[]
}

export interface NotesConcoursGrilleDefinition {
  code: NotesConcoursGrilleCode
  title: string
  secteur: string
  maxTotal: number
  /** Note minimale par critère (grille Santé : 1) */
  scoreMin: number
  /** Note maximale par critère (grille Santé : 5) */
  scoreMax: number
  blocs: NotesConcoursGrilleBloc[]
}

export type NotesConcoursGrilleScores = Record<string, number>
export type NotesConcoursGrilleObservations = Record<string, string>

export interface NotesConcoursGrilleData {
  code: NotesConcoursGrilleCode
  scores: NotesConcoursGrilleScores
  observations: NotesConcoursGrilleObservations
  tpss: number
  tpm: number
  total: number
  savedAt?: string
}

const COMMON_SOFT_SKILLS: NotesConcoursCriterion[] = [
  {
    id: 'presentation',
    label: 'Présentation : aspect vestimentaire, élocution, richesse du vocabulaire',
    maxPoints: 5,
  },
  {
    id: 'interaction',
    label: 'Interaction : assimilation, adaptabilité et aspect relationnel',
    maxPoints: 5,
  },
  { id: 'confiance_soi', label: 'Degré de confiance en soi', maxPoints: 5 },
  { id: 'enthousiasme', label: 'Enthousiasme (motivation)', maxPoints: 5 },
  {
    id: 'esprit_groupe',
    label: 'Esprit de groupe : travail en équipe, collaboration…',
    maxPoints: 5,
  },
  {
    id: 'intelligence_emotionnelle',
    label: 'Intelligence émotionnelle : régularité, travail sous pression',
    maxPoints: 5,
  },
  {
    id: 'protection_environnement',
    label: 'Protection de son environnement et de son cadre de formation',
    maxPoints: 5,
  },
]

const SANTE_SPECIFIQUE: NotesConcoursCriterion[] = [
  { id: 'connaissance_secteur', label: 'Connaissance sur le secteur de la santé', maxPoints: 5 },
  { id: 'motivation_metier', label: 'Motivation du candidat au choix du métier', maxPoints: 5 },
  { id: 'objectifs_choix', label: 'Objectifs derrière ce choix', maxPoints: 5 },
  {
    id: 'connaissances_techniques',
    label:
      'Connaissances techniques et scientifiques de base en relation avec le secteur (interactions, mouvement, énergie…)',
    maxPoints: 5,
  },
  { id: 'travail_hospitalier', label: 'Travail dans le milieu hospitalier', maxPoints: 5 },
  { id: 'travail_groupe', label: 'Travail en groupe', maxPoints: 5 },
  { id: 'projet_carriere', label: 'Projet de carrière / entreprenariat', maxPoints: 5 },
]

export const GRILLE_SANTE: NotesConcoursGrilleDefinition = {
  code: 'SANTE',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Santé',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: SANTE_SPECIFIQUE,
    },
  ],
}

const GM_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'imagination_spatiale',
    label: 'Imagination spatiale : capacité du candidat à imaginer des objets en 3D',
    maxPoints: 5,
  },
  {
    id: 'exploitation_donnees',
    label: 'Capacité à exploiter des données : effectuer des calculs analytiques, etc.',
    maxPoints: 5,
  },
  {
    id: 'esprit_analyse',
    label: "Esprit d'analyse, organisation, précision",
    maxPoints: 5,
  },
  { id: 'aptitude_physique', label: 'Aptitude physique à exercer le métier', maxPoints: 5 },
  { id: 'connaissances_informatiques', label: 'Bonnes connaissances informatiques', maxPoints: 5 },
  {
    id: 'autonomie_bruit',
    label: 'Autonome, capacité à travailler dans le bruit',
    maxPoints: 5,
  },
  {
    id: 'concentration_minutie',
    label:
      'Forte capacité de concentration, faire preuve de minutie, être très consciencieux, habileté manuelle',
    maxPoints: 5,
  },
]

export const GRILLE_GM: NotesConcoursGrilleDefinition = {
  code: 'GM',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Génie Mécanique',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: GM_SPECIFIQUE,
    },
  ],
}

const AIG_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'connaissances_secteur_aig',
    label:
      'Connaissances générales sur le secteur AIG (types d\'entreprises, de produits, des équipements, formation…)',
    maxPoints: 5,
  },
  {
    id: 'creativite',
    label: 'Créativité : capacité à imaginer des formes, des couleurs et des univers attractifs',
    maxPoints: 5,
  },
  { id: 'sensibilite_art', label: "Être sensible à l'art", maxPoints: 5 },
  {
    id: 'polyvalence',
    label:
      'Polyvalence : travailler sur des projets de nature variée et s\'adapter à de nouveaux outils',
    maxPoints: 5,
  },
  {
    id: 'outils_technologiques',
    label:
      'Être à l\'aise avec les outils technologiques et avoir des compétences informatiques',
    maxPoints: 5,
  },
  {
    id: 'connaissances_techniques_aig',
    label: 'Connaissances techniques et scientifiques (notions chimiques et optiques, la couleur…)',
    maxPoints: 5,
  },
  {
    id: 'motivation_metiers_aig',
    label: 'Motivation du candidat au choix des métiers AIG',
    maxPoints: 5,
  },
]

export const GRILLE_AIG: NotesConcoursGrilleDefinition = {
  code: 'AIG',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Arts & Industries Graphiques',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: AIG_SPECIFIQUE,
    },
  ],
}

const ARTISANAT_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'connaissances_domaine_artisanat',
    label: 'Connaissances générales sur le domaine de l\'artisanat',
    maxPoints: 5,
  },
  {
    id: 'connaissances_metier',
    label: 'Connaissances sur le métier (activités, formation, débouchés…)',
    maxPoints: 5,
  },
  {
    id: 'dessin_main_levee',
    label: 'Compétences liées au dessin à main levée',
    maxPoints: 5,
  },
  {
    id: 'logiciels_cao_dao',
    label: 'Compétences liées à l\'utilisation des logiciels de CAO/DAO',
    maxPoints: 5,
  },
  { id: 'sensibilite_couleurs', label: 'Sensibilité aux couleurs', maxPoints: 5 },
  {
    id: 'projet_carriere_entreprenariat',
    label: 'Projet de carrière clair / Entreprenariat',
    maxPoints: 5,
  },
  {
    id: 'parents_proches_artisanat',
    label: 'Parents ou proches exerçant dans le domaine de l\'artisanat',
    maxPoints: 5,
  },
]

export const GRILLE_ARTISANAT: NotesConcoursGrilleDefinition = {
  code: 'ARTISANAT',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Artisanat',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: ARTISANAT_SPECIFIQUE,
    },
  ],
}

const BTP_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'connaissance_secteur_btp',
    label:
      'Connaissance générale du secteur BTP (tissu socio-économique, indicateurs, enjeux…)',
    maxPoints: 5,
  },
  {
    id: 'motivation_metiers_btp',
    label: 'Motivation du candidat au choix des métiers BTP',
    maxPoints: 5,
  },
  {
    id: 'connaissance_metiers_filières',
    label: 'Connaissance des métiers du secteur et filières de formation',
    maxPoints: 5,
  },
  {
    id: 'connaissance_equipements_outillage',
    label: 'Connaissance des équipements et outillage',
    maxPoints: 5,
  },
  {
    id: 'connaissances_techniques_scientifiques_btp',
    label:
      'Connaissances techniques et scientifiques de base en relation avec le secteur (interactions, mouvement, énergie…)',
    maxPoints: 5,
  },
  {
    id: 'aspect_calculatoire_physique_maths',
    label:
      'Aspect calculatoire et formules Physique/Mathématique usuelles (calculs de force, équations mathématiques, conversions d\'unités…)',
    maxPoints: 5,
  },
  {
    id: 'projet_carriere_entreprenariat',
    label: 'Projet de carrière clair / Entreprenariat',
    maxPoints: 5,
  },
]

export const GRILLE_BTP: NotesConcoursGrilleDefinition = {
  code: 'BTP',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'BTP',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: BTP_SPECIFIQUE,
    },
  ],
}

const DD_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'connaissance_domaine_informatique',
    label: 'Connaissance générale du domaine informatique et ses différents métiers',
    maxPoints: 5,
  },
  {
    id: 'motivation_filiere_dev',
    label:
      'Motivation du candidat au choix de la filière Dév (Web, applications mobiles, IHM, cloud…)',
    maxPoints: 5,
  },
  {
    id: 'connaissance_internet_systemes',
    label: 'Connaissance sur internet et les systèmes informatiques',
    maxPoints: 5,
  },
  {
    id: 'aspect_maths',
    label:
      'Aspect maths : logique, algèbre, calculabilité, probabilités, suites usuelles, fonctions, algorithmique, géométrie',
    maxPoints: 5,
  },
  {
    id: 'aspect_sciences_physiques',
    label: 'Aspect sciences physiques : lois de l\'électricité, propagation des ondes',
    maxPoints: 5,
  },
  {
    id: 'connaissance_entreprises_domaine',
    label: 'Connaissance des entreprises les plus connues du domaine',
    maxPoints: 5,
  },
  {
    id: 'projet_carriere_entreprenariat',
    label: 'Projet de carrière clair / Entreprenariat',
    maxPoints: 5,
  },
]

export const GRILLE_DD: NotesConcoursGrilleDefinition = {
  code: 'DD',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Digital et IA — Développement Digital',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: DD_SPECIFIQUE,
    },
  ],
}

const DES_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'connaissance_domaine_informatique',
    label: 'Connaissance générale du domaine informatique et ses différents métiers',
    maxPoints: 5,
  },
  {
    id: 'motivation_filiere_design',
    label:
      'Motivation du candidat au choix de la filière Design (Web, applications, IHM, créativité, qualité…)',
    maxPoints: 5,
  },
  {
    id: 'connaissance_logiciels_graphiques',
    label: 'Connaissances / expérience avec les logiciels graphiques',
    maxPoints: 5,
  },
  {
    id: 'aspect_maths',
    label:
      'Aspect maths : géométrie, logique, algèbre, calculabilité, suites usuelles, fonctions',
    maxPoints: 5,
  },
  {
    id: 'aspect_sciences_physiques',
    label:
      'Aspect sciences physiques : lois de l\'électricité, propagation des ondes, structures moléculaires',
    maxPoints: 5,
  },
  {
    id: 'besoin_national_domaine',
    label: 'Connaissance du besoin national dans ce domaine',
    maxPoints: 5,
  },
  {
    id: 'projet_carriere_entreprenariat',
    label: 'Projet de carrière clair / Entreprenariat',
    maxPoints: 5,
  },
]

export const GRILLE_DES: NotesConcoursGrilleDefinition = {
  code: 'DES',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Digital et IA — Design Digital',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: DES_SPECIFIQUE,
    },
  ],
}

const FGT_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'connaissances_techniques_scientifiques_fgt',
    label:
      'Connaissances techniques et scientifiques de base en relation avec le secteur (énergie, chaleur, pression…)',
    maxPoints: 5,
  },
  {
    id: 'langage_technique',
    label:
      'Langage technique (français technique et scientifique, richesse en vocabulaire technique…)',
    maxPoints: 5,
  },
  {
    id: 'pertinence_motivation_filiere',
    label: 'Pertinence des éléments motivant le candidat au choix de la filière',
    maxPoints: 5,
  },
  {
    id: 'connaissances_secteur_activite',
    label:
      'Connaissances générales sur le secteur d\'activité (degré d\'exploitation des outils d\'information, orientation…)',
    maxPoints: 5,
  },
  {
    id: 'analyse_donnees_techniques',
    label: 'Degré d\'analyse et d\'exploitation des données techniques',
    maxPoints: 5,
  },
  {
    id: 'aspect_calculatoire_physique_maths',
    label:
      'Aspect calculatoire et formules Physique/Mathématique usuelles (relation tension-courant, chaleur-température, conversion des unités…)',
    maxPoints: 5,
  },
  {
    id: 'aptitude_instruments_outillage',
    label: 'Aptitude d\'utiliser des instruments et outillage de base',
    maxPoints: 5,
  },
]

export const GRILLE_FGT: NotesConcoursGrilleDefinition = {
  code: 'FGT',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Froid et Génie Thermique',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: FGT_SPECIFIQUE,
    },
  ],
}

const GC_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'connaissance_secteur_gc',
    label:
      'Connaissance du secteur (présentation générale du secteur économique au Maroc)',
    maxPoints: 5,
  },
  {
    id: 'motivation_choix_filiere',
    label: 'Motivation du choix de la filière',
    maxPoints: 5,
  },
  {
    id: 'connaissance_profil_metier',
    label:
      'Connaissance du profil-métier (qualités d\'un bon commercial / marketeur ou gestionnaire…)',
    maxPoints: 5,
  },
  {
    id: 'aspirations_professionnelles',
    label: 'Aspirations professionnelles (projet professionnel du candidat)',
    maxPoints: 5,
  },
  {
    id: 'esprit_analyse',
    label:
      'Esprit d\'analyse (résolution d\'un scénario d\'une situation problématique)',
    maxPoints: 5,
  },
  {
    id: 'esprit_entrepreneurial',
    label: 'Esprit entrepreneurial (ambition de carrière)',
    maxPoints: 5,
  },
  {
    id: 'perspectives_professionnelles_formation',
    label: 'Connaissance des perspectives professionnelles de la formation choisie',
    maxPoints: 5,
  },
]

export const GRILLE_GC: NotesConcoursGrilleDefinition = {
  code: 'GC',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Gestion et commerce',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: GC_SPECIFIQUE,
    },
  ],
}

const GE_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'sante_securite_travail',
    label:
      'Santé et sécurité au travail (EPI, risques électriques, consignation, premiers secours…)',
    maxPoints: 5,
  },
  {
    id: 'motivation_metiers_electricite',
    label:
      'Motivation aux métiers de l\'électricité (stages, travaux saisonniers, activités commerciales, bricolage…)',
    maxPoints: 5,
  },
  {
    id: 'connaissance_metiers_electricite',
    label:
      'Connaissance des métiers de l\'électricité (installation, essais, maintenance, automatismes, électronique, robotique, domotique, énergies renouvelables…)',
    maxPoints: 5,
  },
  {
    id: 'connaissance_equipements_outillage_electriques',
    label:
      'Connaissance des équipements et outillage électriques (moteurs/génératrices, tableaux électriques, disjoncteurs, automates, appareils de mesure…)',
    maxPoints: 5,
  },
  {
    id: 'organisation_postes_travail',
    label:
      'Organisation des postes de travail (mesures de prévention, 5S, ergonomie, usage des outils, câblage/branchement selon normes…)',
    maxPoints: 5,
  },
  {
    id: 'connaissance_grandeurs_electriques',
    label:
      'Connaissance des grandeurs électriques (courant, tension mono/triphasée, puissance active/réactive, énergie, fréquence, facteur de puissance…)',
    maxPoints: 5,
  },
  {
    id: 'sensibilisation_efficacite_energetique',
    label:
      'Sensibilisation à l\'efficacité énergétique (réduction énergétique, isolation thermique, éclairage intelligent, facteur de puissance…)',
    maxPoints: 5,
  },
]

export const GRILLE_GE: NotesConcoursGrilleDefinition = {
  code: 'GE',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Génie électrique',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: GE_SPECIFIQUE,
    },
  ],
}

const ID_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'connaissance_domaine_informatique',
    label: 'Connaissance générale du domaine informatique et ses différents métiers',
    maxPoints: 5,
  },
  {
    id: 'motivation_filiere_id',
    label:
      'Motivation du candidat au choix de la filière ID (systèmes, réseaux, cybersécurité, cloud…)',
    maxPoints: 5,
  },
  {
    id: 'connaissance_internet_equipements',
    label: 'Connaissance sur internet et les équipements informatiques',
    maxPoints: 5,
  },
  {
    id: 'aspect_maths',
    label: 'Aspect maths : logique, algèbre, probabilités, algorithmique…',
    maxPoints: 5,
  },
  {
    id: 'aspect_sciences_physiques',
    label: 'Aspect sciences physiques : lois de l\'électricité, propagation des ondes',
    maxPoints: 5,
  },
  {
    id: 'connaissance_entreprises_domaine',
    label: 'Connaissance des entreprises les plus connues du domaine',
    maxPoints: 5,
  },
  {
    id: 'projet_carriere_entreprenariat',
    label: 'Projet de carrière clair / Entreprenariat',
    maxPoints: 5,
  },
]

export const GRILLE_ID: NotesConcoursGrilleDefinition = {
  code: 'ID',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Digital et IA — Infrastructure Digitale',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: ID_SPECIFIQUE,
    },
  ],
}

const MA_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'motivation_exercer_metier',
    label: 'Motivation pour exercer le métier',
    maxPoints: 5,
  },
  {
    id: 'connaissances_base_secteur_auto',
    label:
      'Connaissances de base sur le secteur (à titre d\'exemple les marques de l\'automobile…)',
    maxPoints: 5,
  },
  {
    id: 'capacite_environnement_industriel',
    label: 'Capacité de travailler dans un environnement industriel',
    maxPoints: 5,
  },
  {
    id: 'imagination_spatiale',
    label: 'Imagination spatiale (capacité du candidat à imaginer des objets en 3D)',
    maxPoints: 5,
  },
  {
    id: 'aspect_calculatoire_physique_maths',
    label:
      'Aspect calculatoire et formules Physique/Mathématique usuelles (relation tension-courant, chaleur-température, conversion des unités…)',
    maxPoints: 5,
  },
  {
    id: 'connaissances_informatiques',
    label: 'Bonnes connaissances informatiques',
    maxPoints: 5,
  },
  {
    id: 'esprit_analyse_organisation_precision',
    label: 'Esprit d\'analyse, organisation, précision',
    maxPoints: 5,
  },
]

export const GRILLE_MA: NotesConcoursGrilleDefinition = {
  code: 'MA',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Métiers de l\'Automobile',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: MA_SPECIFIQUE,
    },
  ],
}

const MH_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'connaissances_domaine_tourisme',
    label: 'Connaissances générales sur le domaine du tourisme',
    maxPoints: 5,
  },
  {
    id: 'connaissances_metier',
    label: 'Connaissances sur le métier (activités, formation, débouchés…)',
    maxPoints: 5,
  },
  {
    id: 'competences_langues_etrangeres',
    label: 'Compétences liées aux langues étrangères (français-anglais)',
    maxPoints: 5,
  },
  {
    id: 'competences_logiciels_informatiques',
    label: 'Compétences liées à l\'utilisation des logiciels informatiques',
    maxPoints: 5,
  },
  {
    id: 'polyvalence_disponibilite_stress',
    label: 'Polyvalence — disponibilité — résistance au stress',
    maxPoints: 5,
  },
  {
    id: 'projet_carriere_entreprenariat',
    label: 'Projet de carrière clair / Entreprenariat',
    maxPoints: 5,
  },
  {
    id: 'parents_proches_hotellerie',
    label: 'Parents ou proches exerçant dans le domaine de l\'hôtellerie',
    maxPoints: 5,
  },
]

export const GRILLE_MH: NotesConcoursGrilleDefinition = {
  code: 'MH',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Management hôtelier',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: MH_SPECIFIQUE,
    },
  ],
}

const MT_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'connaissances_domaine_tourisme',
    label: 'Connaissances générales sur le domaine du tourisme',
    maxPoints: 5,
  },
  {
    id: 'connaissances_metier',
    label: 'Connaissances sur le métier (activités, formation, débouchés…)',
    maxPoints: 5,
  },
  {
    id: 'competences_langues_etrangeres',
    label: 'Compétences liées aux langues étrangères (français-anglais)',
    maxPoints: 5,
  },
  {
    id: 'competences_logiciels_informatiques',
    label: 'Compétences liées à l\'utilisation des logiciels informatiques',
    maxPoints: 5,
  },
  {
    id: 'culture_generale_maroc',
    label: 'Culture générale liée à l\'histoire et géographie du Maroc',
    maxPoints: 5,
  },
  {
    id: 'projet_carriere_entreprenariat',
    label: 'Projet de carrière clair / Entreprenariat',
    maxPoints: 5,
  },
  {
    id: 'parents_proches_tourisme',
    label: 'Parents ou proches exerçant dans le domaine du tourisme',
    maxPoints: 5,
  },
]

export const GRILLE_MT: NotesConcoursGrilleDefinition = {
  code: 'MT',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Management touristique',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: MT_SPECIFIQUE,
    },
  ],
}

const QHSE_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'sensibilisation_pluridisciplinaire',
    label:
      'Sensibilisation au caractère pluridisciplinaire du métier (champ d\'application, connaissances de base…)',
    maxPoints: 5,
  },
  {
    id: 'gestion_risques_professionnels',
    label:
      'Initiation à la démarche de gestion de risques professionnels (identification, analyse, prévention, EPI, EPC…)',
    maxPoints: 5,
  },
  {
    id: 'connaissances_base_chimie_maths_physique',
    label: 'Connaissance de base en chimie, mathématique et physique',
    maxPoints: 5,
  },
  {
    id: 'analyser_convaincre_communiquer',
    label: 'Capacité d\'analyser, de convaincre et de communiquer',
    maxPoints: 5,
  },
  {
    id: 'protection_environnement_developpement_durable',
    label:
      'Sensibilisation à la protection de l\'environnement et au développement durable',
    maxPoints: 5,
  },
  {
    id: 'motivation_metier_qhse',
    label: 'Motivation au métier de QHSE',
    maxPoints: 5,
  },
  {
    id: 'projet_carriere_clair',
    label: 'Projet de carrière clair',
    maxPoints: 5,
  },
]

export const GRILLE_QHSE: NotesConcoursGrilleDefinition = {
  code: 'QHSE',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Qualité Hygiène Sécurité Environnement',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: QHSE_SPECIFIQUE,
    },
  ],
}

const AGRI_SPECIFIQUE: NotesConcoursCriterion[] = [
  {
    id: 'connaissance_secteur_agricole',
    label: 'Connaissance générale du secteur agricole',
    maxPoints: 5,
  },
  {
    id: 'connaissances_techniques_prerequis',
    label:
      'Connaissances techniques et prérequis de base en relation avec le secteur',
    maxPoints: 5,
  },
  {
    id: 'lien_monde_rural',
    label: 'Lien avec le monde rural',
    maxPoints: 5,
  },
  {
    id: 'transversalite_polyvalence',
    label: 'Esprit de transversalité et polyvalence',
    maxPoints: 5,
  },
  {
    id: 'motivation_nature_metier',
    label: 'Motivation par rapport à la nature du métier',
    maxPoints: 5,
  },
  {
    id: 'interaction_problematiques',
    label:
      'Interaction face aux problématiques posées : réactivité, réflexion…',
    maxPoints: 5,
  },
  {
    id: 'perspectives_professionnelles',
    label: 'Perspectives professionnelles',
    maxPoints: 5,
  },
]

export const GRILLE_AGRI: NotesConcoursGrilleDefinition = {
  code: 'AGRI',
  title: "Grille d'évaluation — Entretien candidats CMC",
  secteur: 'Agriculture',
  maxTotal: 70,
  scoreMin: 1,
  scoreMax: 5,
  blocs: [
    {
      id: 'soft_skills',
      label: 'Soft skills',
      subtotalLabel: 'TPSS : Total des points Soft Skills',
      criteria: COMMON_SOFT_SKILLS,
    },
    {
      id: 'specifique',
      label: 'Spécifique',
      subtotalLabel: 'TPM : Total des points Métier',
      criteria: AGRI_SPECIFIQUE,
    },
  ],
}

const GRILLES_BY_CODE: Partial<Record<NotesConcoursGrilleCode, NotesConcoursGrilleDefinition>> = {
  AGRI: GRILLE_AGRI,
  SANTE: GRILLE_SANTE,
  GM: GRILLE_GM,
  AIG: GRILLE_AIG,
  ARTISANAT: GRILLE_ARTISANAT,
  BTP: GRILLE_BTP,
  DD: GRILLE_DD,
  DES: GRILLE_DES,
  FGT: GRILLE_FGT,
  GC: GRILLE_GC,
  GE: GRILLE_GE,
  ID: GRILLE_ID,
  MA: GRILLE_MA,
  MH: GRILLE_MH,
  MT: GRILLE_MT,
  QHSE: GRILLE_QHSE,
}

export function getGrilleDefinition(
  code: NotesConcoursGrilleCode
): NotesConcoursGrilleDefinition | null {
  return GRILLES_BY_CODE[code] ?? null
}

export function getGrilleForFiliere(
  filiere: string | null | undefined
): NotesConcoursGrilleDefinition | null {
  const code = resolveGrilleCodeFromFiliere(filiere)
  if (!code) return null
  return getGrilleDefinition(code)
}

export function getAllCriteria(definition: NotesConcoursGrilleDefinition): NotesConcoursCriterion[] {
  return definition.blocs.flatMap((b) => b.criteria)
}

export function computeBlocSubtotal(
  bloc: NotesConcoursGrilleBloc,
  scores: NotesConcoursGrilleScores
): number {
  return bloc.criteria.reduce((sum, c) => sum + (Number(scores[c.id]) || 0), 0)
}

export function computeGrilleTotal(
  definition: NotesConcoursGrilleDefinition,
  scores: NotesConcoursGrilleScores
): number {
  return getAllCriteria(definition).reduce((sum, c) => sum + (Number(scores[c.id]) || 0), 0)
}

export function validateGrilleScores(
  definition: NotesConcoursGrilleDefinition,
  scores: NotesConcoursGrilleScores
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  for (const c of getAllCriteria(definition)) {
    const raw = scores[c.id]
    if (raw == null || Number.isNaN(Number(raw)) || Number(raw) === 0) {
      errors.push(`Critère non noté : ${c.label.slice(0, 60)}…`)
      continue
    }
    const n = Number(raw)
    if (!Number.isInteger(n) || n < definition.scoreMin || n > definition.scoreMax) {
      errors.push(
        `Note invalide pour « ${c.label.slice(0, 40)}… » (${definition.scoreMin} à ${definition.scoreMax})`
      )
    }
  }
  const total = computeGrilleTotal(definition, scores)
  if (total > definition.maxTotal) {
    errors.push(`Total ${total} dépasse le maximum ${definition.maxTotal}.`)
  }
  return { valid: errors.length === 0, errors }
}

export function buildGrilleData(
  definition: NotesConcoursGrilleDefinition,
  scores: NotesConcoursGrilleScores,
  observations: NotesConcoursGrilleObservations = {}
): NotesConcoursGrilleData {
  const softBloc = definition.blocs.find((b) => b.id === 'soft_skills')
  const specBloc = definition.blocs.find((b) => b.id === 'specifique')
  return {
    code: definition.code,
    scores,
    observations,
    tpss: softBloc ? computeBlocSubtotal(softBloc, scores) : 0,
    tpm: specBloc ? computeBlocSubtotal(specBloc, scores) : 0,
    total: computeGrilleTotal(definition, scores),
    savedAt: new Date().toISOString(),
  }
}

export function initEmptyGrilleScores(
  definition: NotesConcoursGrilleDefinition
): NotesConcoursGrilleScores {
  const scores: NotesConcoursGrilleScores = {}
  for (const c of getAllCriteria(definition)) {
    scores[c.id] = 0
  }
  return scores
}

export const GRILLES_DISPONIBLES = Object.keys(GRILLES_BY_CODE) as NotesConcoursGrilleCode[]
