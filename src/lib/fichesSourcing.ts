import { supabase } from '@/lib/supabase'
import {
  fetchCandidaturesPourDemande,
  type DossierCandidature,
  type DossierDemande,
} from '@/lib/dossierTraitementExcel'
export type FicheSourcingType = 'cv' | 'job_day'
export type FicheSourcingStatut = 'brouillon' | 'soumise' | 'validee' | 'a_revoir'

export type FicheProfil = {
  poste: string
  pole: string
  filiere: string
  niveau: string
  nb_postes: string
}

export type FicheEtape = { date: string; info: string }

export type FichePosteJob = {
  poste: string
  recus: string
  retenus: string
  attente: string
  recrutes: string
}

export type FicheDonnees = {
  reference: string
  date_ouverture: string
  conseiller: string
  entreprise: string
  date_action: string
  profils: FicheProfil[]
  total_profils: string
  total_postes: string
  observations: string
  etapes_cv: Record<string, FicheEtape>
  bilan: {
    cv_recus: string
    cv_preselectionnes: string
    cv_transmis: string
    candidats_retenus: string
    entretiens: string
    recrutements: string
  }
  statut_action: Record<string, boolean>
  date_maj: string
  prochaine_action: string
  pieces_cv: Record<string, boolean>
  pieces_autre: string
  etapes_prep: Record<string, FicheEtape>
  realisation: {
    contactes: string
    convoques: string
    confirmes: string
    presents: string
    absents: string
    taux_presence: string
  }
  postes_job: FichePosteJob[]
  total_retenus: string
  total_recrutements: string
  etapes_suivi: Record<string, FicheEtape>
  pieces_job: Record<string, boolean>
  fonction_responsable: string
  signature: string
  date_signature: string
}

export type FicheSourcing = {
  id: string
  demande_id: string
  type_fiche: FicheSourcingType
  statut: FicheSourcingStatut
  donnees: FicheDonnees
  commentaire_admin: string | null
  created_by: string | null
  soumise_par: string | null
  soumise_le: string | null
  validee_par: string | null
  validee_le: string | null
  created_at: string
  updated_at: string
}

export type FicheSourcingResume = {
  demande_id: string
  statut: FicheSourcingStatut
  type_fiche: FicheSourcingType
}

export function isJobDayDemande(demande: {
  type_demande?: string
  evenement_type?: string
}): boolean {
  const type = (demande.type_demande || '').toLowerCase()
  const evt = (demande.evenement_type || '').toLowerCase()
  return type === 'evenement' || evt === 'jobday' || evt.includes('job')
}

const STAFF_HINT =
  'Exécutez supabase_migrations/create_fiches_sourcing.sql dans l’éditeur SQL Supabase, puis rechargez.'

type Referentiel = { id: string; nom: string; pole_id?: string }

function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function minDate(values: Array<string | null | undefined>): string {
  const times = values
    .filter((v): v is string => Boolean(v))
    .map((v) => new Date(v).getTime())
    .filter((t) => !Number.isNaN(t))
  if (!times.length) return ''
  return fmtDate(new Date(Math.min(...times)).toISOString())
}

function num(n: number): string {
  return n ? String(n) : ''
}

function resolvePoleFiliere(
  profil: any,
  poles: Referentiel[],
  filieres: Referentiel[]
): { pole: string; filiere: string } {
  const pole =
    profil?.pole_nom ||
    profil?.nom ||
    poles.find((p) => p.id === profil?.pole_id)?.nom ||
    ''
  const filiere =
    typeof profil?.filiere === 'string' && profil.filiere && !/^[0-9a-f-]{8}/i.test(profil.filiere)
      ? profil.filiere
      : filieres.find((f) => f.id === profil?.filiere_id)?.nom ||
        filieres.find((f) => f.id === profil?.filiere)?.nom ||
        ''
  return { pole, filiere }
}

function etape(date = '', info = ''): FicheEtape {
  return { date, info }
}

export const ETAPES_CV: { key: string; label: string }[] = [
  { key: 'reception', label: 'Réception du besoin' },
  { key: 'annonce', label: 'Élaboration / adaptation de l’annonce' },
  { key: 'validation_annonce', label: 'Validation de l’annonce' },
  { key: 'diffusion', label: 'Diffusion de l’annonce' },
  { key: 'cloture', label: 'Clôture des candidatures' },
  { key: 'tri', label: 'Tri / présélection des CV' },
  { key: 'transmission', label: 'Transmission des CV à l’entreprise' },
  { key: 'retour', label: 'Retour de l’entreprise' },
  { key: 'relance', label: 'Relance entreprise' },
]

export const ETAPES_PREP: { key: string; label: string }[] = [
  { key: 'reception', label: 'Réception du besoin' },
  { key: 'validation_besoin', label: 'Validation du besoin avec l’entreprise' },
  { key: 'diffusion', label: 'Élaboration / diffusion de l’annonce' },
  { key: 'sourcing', label: 'Sourcing des candidats' },
  { key: 'preselection', label: 'Présélection des candidats' },
  { key: 'convocation', label: 'Convocation des candidats' },
  { key: 'confirmation', label: 'Confirmation avec l’entreprise' },
  { key: 'logistique', label: 'Préparation logistique' },
]

export const ETAPES_SUIVI: { key: string; label: string }[] = [
  { key: 'retour', label: 'Retour de l’entreprise' },
  { key: 'relance', label: 'Relance entreprise' },
  { key: 'suivi_retenus', label: 'Suivi des candidats retenus' },
  { key: 'confirmation_recrut', label: 'Confirmation des recrutements' },
  { key: 'cloture', label: 'Clôture de l’action' },
]

export const STATUT_ACTION_KEYS: { key: string; label: string }[] = [
  { key: 'en_cours', label: 'En cours de sourcing' },
  { key: 'cv_transmis', label: 'CV transmis – en attente de retour' },
  { key: 'retenus', label: 'Candidats retenus – suivi en cours' },
  { key: 'entretiens', label: 'Entretiens en cours' },
  { key: 'recrutes', label: 'Recrutement(s) réalisé(s)' },
  { key: 'cloturee', label: 'Action clôturée' },
  { key: 'annulee', label: 'Action annulée / suspendue' },
]

export const PIECES_CV_KEYS: { key: string; label: string }[] = [
  { key: 'fiche', label: 'Fiche de suivi de l’action' },
  { key: 'annonce', label: 'Annonce / affiche diffusée' },
  { key: 'cv_collectes', label: 'CV collectés' },
  { key: 'cv_transmis', label: 'CV transmis à l’entreprise' },
  { key: 'correspondances', label: 'Correspondances avec l’entreprise' },
  { key: 'retour', label: 'Retour de l’entreprise' },
  { key: 'suivi', label: 'Suivi des candidats retenus' },
  { key: 'autres', label: 'Autres' },
]

export const PIECES_JOB_KEYS: { key: string; label: string }[] = [
  { key: 'fiche', label: 'Fiche de suivi du Job Day' },
  { key: 'annonce', label: 'Annonce / affiche du Job Day' },
  { key: 'emargement', label: 'Liste d’émargement / présence' },
  { key: 'candidatures', label: 'Candidatures collectées' },
]

export function ficheStatutLabel(statut?: FicheSourcingStatut | null): string {
  switch (statut) {
    case 'soumise':
      return 'À valider'
    case 'validee':
      return 'Validée'
    case 'a_revoir':
      return 'À retravailler'
    case 'brouillon':
      return 'Brouillon'
    default:
      return 'Non commencée'
  }
}

function mapTableError(error: { message?: string; code?: string } | null): string {
  const msg = error?.message || ''
  if (error?.code === '42P01' || /fiches_sourcing/i.test(msg) && /does not exist|n'existe pas/i.test(msg)) {
    return STAFF_HINT
  }
  return msg || 'Erreur fiche sourcing'
}

export function buildDefaultDonnees(
  demande: DossierDemande,
  cvs: DossierCandidature[],
  conseiller: string,
  poles: Referentiel[],
  filieres: Referentiel[]
): FicheDonnees {
  const profilsSrc = Array.isArray(demande.profils) ? [...demande.profils] : []
  while (profilsSrc.length < 4) profilsSrc.push({})
  const profils: FicheProfil[] = profilsSrc.slice(0, 8).map((profil: any) => {
    const { pole, filiere } = resolvePoleFiliere(profil, poles, filieres)
    return {
      poste: profil?.poste_intitule || profil?.poste || profil?.titre || profil?.fonction || '',
      pole,
      filiere,
      niveau: profil?.type_contrat || profil?.niveau || '',
      nb_postes: profil?.nb_profils != null && profil?.nb_profils !== '' ? String(profil.nb_profils) : '',
    }
  })
  const totalProfils = (demande.profils || []).reduce(
    (sum: number, p: any) => sum + (Number(p?.nb_profils) || 0),
    0
  )
  const recus = cvs.length
  const avecCv = cvs.filter((c) => c.cv_url).length
  const preselection = cvs.filter((c) => c.cv_tri_statut === 'accepte').length
  const transmis = cvs.filter((c) => c.cv_telecharge_le).length
  const retenus = cvs.filter((c) => c.resultat_final === 'accepte' || c.resultat_final === 'retenu').length
  const reception = fmtDate(demande.created_at)
  const tri = minDate(cvs.map((c) => c.cv_tri_le))
  const transmission = minDate(cvs.map((c) => c.cv_telecharge_le))
  const dateJob = fmtDate(demande.evenement_date)
  const statut = demande.statut || ''
  const enCours = statut === 'en_attente' || statut === 'en_cours'
  const cloturee = statut === 'terminee'
  const annulee = statut === 'annulee' || statut === 'refusee'
  const cvTransmis = transmis > 0 && !cloturee && !annulee

  const parPoste = new Map<string, DossierCandidature[]>()
  cvs.forEach((c) => {
    const key = c.poste || 'Poste non spécifié'
    const list = parPoste.get(key) || []
    list.push(c)
    parPoste.set(key, list)
  })
  let postes_job: FichePosteJob[] = Array.from(parPoste.entries()).map(([poste, list]) => {
    const ret = list.filter((c) => c.cv_tri_statut === 'accepte').length
    const attente = list.filter((c) => c.cv_tri_statut !== 'accepte' && c.cv_tri_statut !== 'refuse').length
    return {
      poste,
      recus: num(list.length),
      retenus: num(ret),
      attente: num(attente),
      recrutes: '',
    }
  })
  if (!postes_job.length) {
    postes_job = [{ poste: '', recus: '', retenus: '', attente: '', recrutes: '' }]
  }

  const etapes_cv: Record<string, FicheEtape> = {
    reception: etape(reception, ''),
    annonce: etape(reception, demande.fichier_url ? 'Fiche de poste jointe' : ''),
    validation_annonce: etape(),
    diffusion: etape(reception, 'Publication COP Space'),
    cloture: etape(dateJob, ''),
    tri: etape(tri, preselection ? `${preselection} CV accepté(s)` : ''),
    transmission: etape(transmission, transmis ? `${transmis} CV transmis` : ''),
    retour: etape(),
    relance: etape(),
  }

  const etapes_prep: Record<string, FicheEtape> = {
    reception: etape(reception, ''),
    validation_besoin: etape(),
    diffusion: etape(reception, demande.fichier_url ? 'Fiche de poste jointe' : 'Publication COP Space'),
    sourcing: etape(reception, recus ? `${recus} candidature(s)` : ''),
    preselection: etape(tri, preselection ? `${preselection} retenu(s)` : ''),
    convocation: etape(),
    confirmation: etape(),
    logistique: etape(dateJob, ''),
  }

  const etapes_suivi: Record<string, FicheEtape> = {
    retour: etape(),
    relance: etape(),
    suivi_retenus: etape(transmission, ''),
    confirmation_recrut: etape(),
    cloture: etape(cloturee ? fmtDate(demande.updated_at) : '', ''),
  }

  return {
    reference: demande.reference || '',
    date_ouverture: reception,
    conseiller,
    entreprise: [demande.entreprise_nom, demande.entreprise_ville].filter(Boolean).join(' — '),
    date_action: dateJob,
    profils,
    total_profils: num(totalProfils || (demande.profils || []).length),
    total_postes: num(totalProfils),
    observations: '',
    etapes_cv,
    bilan: {
      cv_recus: num(avecCv || recus),
      cv_preselectionnes: num(preselection),
      cv_transmis: num(transmis),
      candidats_retenus: num(retenus),
      entretiens: '',
      recrutements: '',
    },
    statut_action: {
      en_cours: enCours && !cvTransmis,
      cv_transmis: cvTransmis,
      retenus: retenus > 0 && !cloturee,
      entretiens: false,
      recrutes: false,
      cloturee,
      annulee,
    },
    date_maj: fmtDate(demande.updated_at || demande.created_at),
    prochaine_action: '',
    pieces_cv: {
      fiche: true,
      annonce: Boolean(demande.fichier_url),
      cv_collectes: recus > 0,
      cv_transmis: transmis > 0,
      correspondances: false,
      retour: false,
      suivi: false,
      autres: false,
    },
    pieces_autre: '',
    etapes_prep,
    realisation: {
      contactes: num(recus),
      convoques: '',
      confirmes: '',
      presents: '',
      absents: '',
      taux_presence: '',
    },
    postes_job,
    total_retenus: num(preselection),
    total_recrutements: '',
    etapes_suivi,
    pieces_job: {
      fiche: true,
      annonce: Boolean(demande.fichier_url),
      emargement: false,
      candidatures: recus > 0,
    },
    fonction_responsable: '',
    signature: '',
    date_signature: fmtDate(new Date().toISOString()),
  }
}

export async function fetchFichesResumes(): Promise<{
  data: FicheSourcingResume[]
  error?: string
}> {
  const { data, error } = await supabase
    .from('fiches_sourcing')
    .select('demande_id, statut, type_fiche')
  if (error) return { data: [], error: mapTableError(error) }
  return { data: (data || []) as FicheSourcingResume[] }
}

export async function fetchFichePourDemande(demandeId: string): Promise<{
  data: FicheSourcing | null
  error?: string
}> {
  const { data, error } = await supabase
    .from('fiches_sourcing')
    .select('*')
    .eq('demande_id', demandeId)
    .maybeSingle()
  if (error) return { data: null, error: mapTableError(error) }
  return { data: data as FicheSourcing | null }
}

export async function prepareFicheEditor(
  demande: DossierDemande,
  conseillerNom?: string | null
): Promise<{
  existing: FicheSourcing | null
  typeFiche: FicheSourcingType
  donnees: FicheDonnees
  error?: string
}> {
  const [existingRes, cvs, polesRes, filieresRes] = await Promise.all([
    fetchFichePourDemande(demande.id),
    fetchCandidaturesPourDemande(demande),
    supabase.from('poles').select('id, nom'),
    supabase.from('filieres').select('id, nom, pole_id'),
  ])
  if (existingRes.error) {
    return {
      existing: null,
      typeFiche: isJobDayDemande(demande) ? 'job_day' : 'cv',
      donnees: buildDefaultDonnees(demande, [], conseillerNom || '', [], []),
      error: existingRes.error,
    }
  }
  const conseiller = conseillerNom || demande.traite_par_nom || ''
  const defaults = buildDefaultDonnees(
    demande,
    cvs,
    conseiller,
    (polesRes.data || []) as Referentiel[],
    (filieresRes.data || []) as Referentiel[]
  )
  const existing = existingRes.data
  if (existing) {
    return {
      existing,
      typeFiche: existing.type_fiche,
      donnees: { ...defaults, ...(existing.donnees || {}) },
    }
  }
  return {
    existing: null,
    typeFiche: isJobDayDemande(demande) ? 'job_day' : 'cv',
    donnees: defaults,
  }
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id || null
}

export async function saveFicheSourcing(params: {
  demandeId: string
  existingId?: string | null
  typeFiche: FicheSourcingType
  statut: FicheSourcingStatut
  donnees: FicheDonnees
  commentaireAdmin?: string | null
  markSubmitted?: boolean
  markValidated?: boolean
  markReturned?: boolean
}): Promise<{ data: FicheSourcing | null; error?: string }> {
  const uid = await currentUserId()
  const now = new Date().toISOString()
  const row: Record<string, unknown> = {
    demande_id: params.demandeId,
    type_fiche: params.typeFiche,
    statut: params.statut,
    donnees: params.donnees,
    updated_at: now,
  }
  if (params.commentaireAdmin !== undefined) {
    row.commentaire_admin = params.commentaireAdmin
  }
  if (params.markSubmitted) {
    row.soumise_par = uid
    row.soumise_le = now
  }
  if (params.markValidated) {
    row.validee_par = uid
    row.validee_le = now
  }
  if (params.markReturned) {
    row.validee_par = null
    row.validee_le = null
  }

  if (params.existingId) {
    const { data, error } = await supabase
      .from('fiches_sourcing')
      .update(row)
      .eq('id', params.existingId)
      .select('*')
      .single()
    if (error) return { data: null, error: mapTableError(error) }
    return { data: data as FicheSourcing }
  }

  row.created_by = uid
  const { data, error } = await supabase.from('fiches_sourcing').insert(row).select('*').single()
  if (error) return { data: null, error: mapTableError(error) }
  return { data: data as FicheSourcing }
}
