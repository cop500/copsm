import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { getCvTriLabel } from '@/lib/cvTriStatut'

export interface DossierDemande {
  id: string
  entreprise_nom: string
  secteur?: string
  entreprise_adresse?: string
  entreprise_ville?: string
  entreprise_email?: string
  contact_nom?: string
  contact_email?: string
  contact_tel?: string
  profils?: any[]
  evenement_type?: string
  evenement_date?: string
  fichier_url?: string
  type_demande?: string
  statut?: string
  traite_par?: string | null
  traite_par_nom?: string | null
  created_at: string
  updated_at?: string
  reference?: string
}

export interface DossierCandidature {
  id: string
  demande_entreprise_id?: string | null
  entreprise_nom?: string
  poste?: string
  type_contrat?: string
  date_candidature?: string
  statut_candidature?: string
  resultat_final?: string
  motif_refus?: string
  feedback_entreprise?: string
  cv_url?: string
  nom?: string
  prenom?: string
  email?: string
  telephone?: string
  created_at: string
  cv_tri_statut?: string
  cv_tri_par_nom?: string | null
  cv_tri_le?: string | null
  cv_telecharge_le?: string | null
  cv_dernier_envoi_le?: string | null
  cv_nb_envois?: number
}

const STATUT_DEMANDE: Record<string, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  terminee: 'Terminée',
  refusee: 'Refusée',
  annulee: 'Annulée',
}

const STATUT_CANDIDATURE: Record<string, string> = {
  envoye: 'Envoyée',
  en_etude: 'En étude',
  entretien_planifie: 'Entretien planifié',
  accepte: 'Acceptée',
  refuse: 'Refusée',
  en_attente: 'En attente',
}

function formatDate(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function daysBetween(from?: string | null, to?: string | null): string {
  if (!from || !to) return ''
  const a = new Date(from)
  const b = new Date(to)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return ''
  return String(Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000)))
}

function typeDemandeLabel(type?: string, evenement?: string): string {
  if (type === 'evenement' || evenement === 'jobday') return 'Job Day / Événement'
  if (type === 'cv' || evenement === 'cv') return 'Demande CV'
  return type || evenement || ''
}

function profilPoste(profil: any): string {
  return (
    profil?.poste_intitule ||
    profil?.poste ||
    profil?.titre ||
    profil?.fonction ||
    ''
  )
}

function autoFit(ws: XLSX.WorkSheet, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  ws['!cols'] = keys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.map((row) => String(row[key] ?? '').length)
    )
    return { wch: Math.min(48, Math.max(12, maxLen + 2)) }
  })
}

function addSheet(wb: XLSX.WorkBook, name: string, rows: Record<string, unknown>[]) {
  const data = rows.length ? rows : [{ Information: 'Aucune donnée' }]
  const ws = XLSX.utils.json_to_sheet(data)
  autoFit(ws, data)
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
}

function safeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'Entreprise'
}

async function fetchCommentairesDemande(demandeId: string) {
  const { data, error } = await supabase
    .from('commentaires_demandes_entreprises')
    .select('*')
    .eq('demande_id', demandeId)
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('Commentaires demande indisponibles:', error.message)
    return []
  }
  return data || []
}

async function fetchCommentairesCandidatures(candidatureIds: string[]) {
  if (candidatureIds.length === 0) return []
  const { data, error } = await supabase
    .from('commentaires_candidatures')
    .select('*')
    .in('candidature_id', candidatureIds)
    .order('date_creation', { ascending: true })

  if (error) {
    console.warn('Commentaires candidatures indisponibles:', error.message)
    return []
  }
  return data || []
}

export async function fetchCandidaturesPourDemande(demande: DossierDemande): Promise<DossierCandidature[]> {
  const { data: byId, error: errId } = await supabase
    .from('candidatures_stagiaires')
    .select('*')
    .eq('demande_entreprise_id', demande.id)
    .order('created_at', { ascending: true })

  if (!errId && byId && byId.length > 0) {
    return byId as DossierCandidature[]
  }

  const { data: byNom, error: errNom } = await supabase
    .from('candidatures_stagiaires')
    .select('*')
    .eq('entreprise_nom', demande.entreprise_nom)
    .order('created_at', { ascending: true })

  if (errNom) {
    console.warn('Candidatures indisponibles:', errNom.message)
    return []
  }
  return (byNom || []) as DossierCandidature[]
}

export function downloadDossierTraitementWorkbook(
  demande: DossierDemande,
  candidatures: DossierCandidature[],
  commentairesDemande: any[],
  commentairesCandidatures: any[]
) {
  const cvs = candidatures
  const dates = cvs
    .map((c) => c.date_candidature || c.created_at)
    .filter(Boolean)
    .sort()
  const premiere = dates[0] || ''
  const derniere = dates[dates.length - 1] || ''
  const avecCv = cvs.filter((c) => Boolean(c.cv_url)).length
  const acceptes = cvs.filter((c) => c.cv_tri_statut === 'accepte').length
  const refuses = cvs.filter((c) => c.cv_tri_statut === 'refuse').length
  const aTrier = cvs.length - acceptes - refuses
  const envoyes = cvs.filter((c) => c.cv_telecharge_le || (c.cv_nb_envois || 0) > 0).length
  const nbEnvois = cvs.reduce((sum, c) => sum + (c.cv_nb_envois || 0), 0)

  const demandeRows: Record<string, unknown>[] = [
    { Champ: 'Référence', Valeur: demande.reference || demande.id },
    { Champ: 'Entreprise', Valeur: demande.entreprise_nom },
    { Champ: 'Secteur', Valeur: demande.secteur || '' },
    { Champ: 'Adresse', Valeur: demande.entreprise_adresse || '' },
    { Champ: 'Ville', Valeur: demande.entreprise_ville || '' },
    { Champ: 'Email entreprise', Valeur: demande.entreprise_email || '' },
    { Champ: 'Contact', Valeur: demande.contact_nom || '' },
    { Champ: 'Email contact', Valeur: demande.contact_email || '' },
    { Champ: 'Téléphone', Valeur: demande.contact_tel || '' },
    { Champ: 'Type de demande', Valeur: typeDemandeLabel(demande.type_demande, demande.evenement_type) },
    { Champ: 'Date événement', Valeur: formatDate(demande.evenement_date) },
    { Champ: 'Statut', Valeur: STATUT_DEMANDE[demande.statut || ''] || demande.statut || '' },
    { Champ: 'Traité par', Valeur: demande.traite_par_nom || '' },
    { Champ: 'Date de réception', Valeur: formatDateTime(demande.created_at) },
    { Champ: 'Dernière mise à jour', Valeur: formatDateTime(demande.updated_at) },
    { Champ: 'Fiche de poste (lien)', Valeur: demande.fichier_url || '' },
    { Champ: 'Export généré le', Valeur: formatDateTime(new Date().toISOString()) },
  ]

  const profils = Array.isArray(demande.profils) ? demande.profils : []
  const profilsRows = profils.map((profil, index) => ({
    N: index + 1,
    Pôle: profil?.nom || profil?.pole || '',
    Filière: profil?.filiere || '',
    Poste: profilPoste(profil),
    Description: profil?.poste_description || '',
    Compétences: profil?.competences || '',
    'Nb profils': profil?.nb_profils ?? '',
    'Type contrat': profil?.type_contrat || '',
    Durée: profil?.duree || '',
    'Date début': formatDate(profil?.date_debut),
    Salaire: profil?.salaire || '',
  }))

  const bilanRows: Record<string, unknown>[] = [
    { Indicateur: 'Nombre de candidatures reçues', Valeur: cvs.length },
    { Indicateur: 'Nombre de CV joints', Valeur: avecCv },
    { Indicateur: 'CV à trier', Valeur: aTrier },
    { Indicateur: 'CV acceptés', Valeur: acceptes },
    { Indicateur: 'CV refusés', Valeur: refuses },
    { Indicateur: 'CV déjà envoyés / téléchargés', Valeur: envoyes },
    { Indicateur: 'Nombre total d’envois CV', Valeur: nbEnvois },
    { Indicateur: 'Date première candidature', Valeur: formatDateTime(premiere) },
    { Indicateur: 'Date dernière candidature', Valeur: formatDateTime(derniere) },
    {
      Indicateur: 'Délai demande → 1re candidature (jours)',
      Valeur: daysBetween(demande.created_at, premiere),
    },
    { Indicateur: 'Nombre de postes demandés', Valeur: profils.length },
    { Indicateur: 'Nombre d’échanges internes', Valeur: commentairesDemande.length },
  ]

  const candidaturesRows = cvs.map((c) => ({
    Date: formatDateTime(c.date_candidature || c.created_at),
    Nom: c.nom || '',
    Prénom: c.prenom || '',
    Email: c.email || '',
    Téléphone: c.telephone || '',
    Poste: c.poste || '',
    'Type contrat': c.type_contrat || '',
    'Statut candidature': STATUT_CANDIDATURE[c.statut_candidature || ''] || c.statut_candidature || '',
    'Tri CV': getCvTriLabel(c.cv_tri_statut),
    'Trié par': c.cv_tri_par_nom || '',
    'Date tri': formatDateTime(c.cv_tri_le),
    'CV joint': c.cv_url ? 'Oui' : 'Non',
    '1er envoi CV': formatDateTime(c.cv_telecharge_le),
    'Dernier envoi CV': formatDateTime(c.cv_dernier_envoi_le),
    'Nb envois': c.cv_nb_envois || 0,
    Résultat: c.resultat_final || '',
    'Motif refus': c.motif_refus || '',
    Feedback: c.feedback_entreprise || '',
  }))

  const echangesRows: Record<string, unknown>[] = [
    ...commentairesDemande.map((c) => ({
      Date: formatDateTime(c.created_at),
      Source: 'Demande entreprise',
      Auteur: c.auteur || '',
      Candidat: '',
      Message: c.contenu || c.message || '',
    })),
    ...commentairesCandidatures.map((c) => {
      const linked = cvs.find((cand) => cand.id === c.candidature_id)
      return {
        Date: formatDateTime(c.date_creation || c.created_at),
        Source: 'Candidature',
        Auteur: c.utilisateur_nom || c.auteur || '',
        Candidat: linked ? `${linked.prenom || ''} ${linked.nom || ''}`.trim() : '',
        Message: c.contenu || '',
      }
    }),
  ].sort((a, b) => String(a.Date).localeCompare(String(b.Date), 'fr'))

  const wb = XLSX.utils.book_new()
  addSheet(wb, 'Demande', demandeRows)
  addSheet(wb, 'Profils demandés', profilsRows)
  addSheet(wb, 'Bilan traitement', bilanRows)
  addSheet(wb, 'Candidatures', candidaturesRows)
  addSheet(wb, 'Échanges', echangesRows)

  const fileName = `Dossier_Traitement_${safeFilePart(demande.entreprise_nom)}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export async function downloadDossierTraitementExcel(
  demande: DossierDemande,
  candidatures?: DossierCandidature[]
) {
  const cvs = candidatures ?? (await fetchCandidaturesPourDemande(demande))

  const [commentairesDemande, commentairesCandidatures] = await Promise.all([
    fetchCommentairesDemande(demande.id),
    fetchCommentairesCandidatures(cvs.map((c) => c.id)),
  ])

  downloadDossierTraitementWorkbook(demande, cvs, commentairesDemande, commentairesCandidatures)
}

export function downloadCandidaturesRecuesExcel(candidatures: DossierCandidature[]) {
  const parEntreprise = new Map<string, DossierCandidature[]>()
  candidatures.forEach((c) => {
    const key = c.entreprise_nom || 'Sans entreprise'
    const list = parEntreprise.get(key) || []
    list.push(c)
    parEntreprise.set(key, list)
  })

  const bilanRows = Array.from(parEntreprise.entries()).map(([entreprise, list]) => {
    const dates = list.map((c) => c.date_candidature || c.created_at).filter(Boolean).sort()
    return {
      Entreprise: entreprise,
      'Nb candidatures': list.length,
      'Nb CV': list.filter((c) => Boolean(c.cv_url)).length,
      'CV acceptés': list.filter((c) => c.cv_tri_statut === 'accepte').length,
      'CV refusés': list.filter((c) => c.cv_tri_statut === 'refuse').length,
      'Première candidature': formatDateTime(dates[0]),
      'Dernière candidature': formatDateTime(dates[dates.length - 1]),
    }
  })

  const detailRows = candidatures.map((c) => ({
    Date: formatDateTime(c.date_candidature || c.created_at),
    Entreprise: c.entreprise_nom || '',
    Poste: c.poste || '',
    Nom: c.nom || '',
    Prénom: c.prenom || '',
    Email: c.email || '',
    Téléphone: c.telephone || '',
    'Statut candidature': STATUT_CANDIDATURE[c.statut_candidature || ''] || c.statut_candidature || '',
    'Tri CV': getCvTriLabel(c.cv_tri_statut),
    'CV joint': c.cv_url ? 'Oui' : 'Non',
    '1er envoi CV': formatDateTime(c.cv_telecharge_le),
    'Nb envois': c.cv_nb_envois || 0,
    Résultat: c.resultat_final || '',
    Feedback: c.feedback_entreprise || '',
  }))

  const wb = XLSX.utils.book_new()
  addSheet(wb, 'Bilan par entreprise', bilanRows)
  addSheet(wb, 'Candidatures', detailRows)

  const fileName = `Candidatures_recues_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}
