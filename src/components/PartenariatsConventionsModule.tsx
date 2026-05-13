'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/hooks/useRole'
import {
  Building2,
  FileText,
  Handshake,
  Plus,
  RefreshCw,
  Download,
  Eye,
  X,
  Calendar,
  Trash2,
  ExternalLink,
  Pencil,
  Upload,
} from 'lucide-react'

type ConventionType = 'stage' | 'alternance' | 'recrutement' | 'convention_cadre' | 'autre'
type ConventionStatut =
  | 'brouillon'
  | 'en_negociation'
  | 'retour_entreprise'
  | 'en_attente_signature'
  | 'validee_cop'
  | 'en_vigueur'
  | 'suspendue'
  | 'expiree'
  | 'renouvelee'
  | 'archivee'

interface PartenaireEntreprise {
  id: string
  nom: string
  secteur?: string | null
  contact_nom?: string | null
  contact_email?: string | null
  contact_telephone?: string | null
  notes?: string | null
  created_at: string
}

interface ConventionRow {
  id: string
  entreprise_id: string
  reference_interne?: string | null
  type_convention: ConventionType
  date_signature?: string | null
  date_debut?: string | null
  date_fin?: string | null
  statut: ConventionStatut
  fichier_url?: string | null
  fichier_path?: string | null
  notes_internes?: string | null
  created_at: string
  partenaires_entreprises?: { nom: string } | null
}

const TYPE_LABEL: Record<ConventionType, string> = {
  stage: 'Stage',
  alternance: 'Alternance',
  recrutement: 'Recrutement',
  convention_cadre: 'Convention cadre',
  autre: 'Autre',
}

const STATUT_LABEL: Record<ConventionStatut, string> = {
  brouillon: 'Brouillon',
  en_negociation: 'En négociation',
  retour_entreprise: 'Retour entreprise',
  en_attente_signature: 'En attente de signature',
  validee_cop: 'Validée COP',
  en_vigueur: 'En vigueur',
  suspendue: 'Suspendue',
  expiree: 'Expirée',
  renouvelee: 'Renouvelée',
  archivee: 'Archivée',
}

const STATUT_BADGE: Record<ConventionStatut, string> = {
  brouillon: 'bg-slate-100 text-slate-800 border border-slate-200',
  en_negociation: 'bg-violet-100 text-violet-900 border border-violet-200',
  retour_entreprise: 'bg-orange-100 text-orange-900 border border-orange-200',
  en_attente_signature: 'bg-sky-100 text-sky-900 border border-sky-200',
  validee_cop: 'bg-teal-100 text-teal-900 border border-teal-200',
  en_vigueur: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  suspendue: 'bg-amber-100 text-amber-900 border border-amber-200',
  expiree: 'bg-gray-200 text-gray-700 border border-gray-300',
  renouvelee: 'bg-blue-100 text-blue-800 border border-blue-200',
  archivee: 'bg-neutral-200 text-neutral-700 border border-neutral-300',
}

function getTypeLabel(t: string): string {
  return TYPE_LABEL[t as ConventionType] ?? t
}

function getStatutLabel(s: string): string {
  return STATUT_LABEL[s as ConventionStatut] ?? s
}

function formatDateFr(isoDate: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? new Date(`${isoDate}T12:00:00`) : new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('fr-FR')
}

/** Date affichée sur la carte liste : signature > début > création */
function getConventionListDate(c: ConventionRow): { text: string; title: string } {
  if (c.date_signature) {
    return { text: formatDateFr(c.date_signature), title: 'Date de signature' }
  }
  if (c.date_debut) {
    return { text: formatDateFr(c.date_debut), title: 'Date de début' }
  }
  return { text: formatDateFr(c.created_at), title: 'Date de création' }
}

function slugifyHeaderCell(h: unknown): string {
  return String(h ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

type EntrepriseImportField = 'nom' | 'secteur' | 'contact_nom' | 'contact_email' | 'contact_telephone' | 'notes'

const HEADER_TO_ENTREPRISE_FIELD: Record<string, EntrepriseImportField> = {
  nom: 'nom',
  entreprise: 'nom',
  'raison sociale': 'nom',
  secteur: 'secteur',
  contact: 'contact_nom',
  'contact nom': 'contact_nom',
  'nom du contact': 'contact_nom',
  email: 'contact_email',
  mail: 'contact_email',
  courriel: 'contact_email',
  'e-mail': 'contact_email',
  telephone: 'contact_telephone',
  tel: 'contact_telephone',
  notes: 'notes',
}

function cellStr(row: unknown[], i: number | undefined): string {
  if (i === undefined || i < 0) return ''
  const v = row[i]
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number') return String(v).trim()
  return String(v).trim()
}

function buildEntrepriseImportColumnMap(headerRow: unknown[]): Partial<Record<EntrepriseImportField, number>> {
  const map: Partial<Record<EntrepriseImportField, number>> = {}
  headerRow.forEach((cell, idx) => {
    const slug = slugifyHeaderCell(cell)
    const field = HEADER_TO_ENTREPRISE_FIELD[slug]
    if (field && map[field] === undefined) map[field] = idx
  })
  return map
}

function conventionPdfFilename(c: ConventionRow): string {
  const raw = (c.reference_interne || `${getTypeLabel(c.type_convention)}_${c.partenaires_entreprises?.nom || 'convention'}`)
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
  const base = raw || 'convention'
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`
}

/** Téléchargement local du PDF (évite l’ouverture seule dans un nouvel onglet selon le navigateur). */
async function downloadConventionPdfFile(c: ConventionRow): Promise<void> {
  const url = c.fichier_url
  if (!url) return
  const name = conventionPdfFilename(c)
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error(String(res.status))
    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = name
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export default function PartenariatsConventionsModule() {
  const { isAdmin, isDirecteur, isManager, isConseiller, isCarriere } = useRole()
  /** Le directeur n’a pas accès pour l’instant ; manager / conseillers / carrière : lecture seule */
  const canView =
    !isDirecteur && (isAdmin || isManager || isConseiller || isCarriere)
  /** Tous les droits réservés au rôle admin métier (business_developer) */
  const canEdit = isAdmin
  const [loading, setLoading] = useState(true)
  const [entreprises, setEntreprises] = useState<PartenaireEntreprise[]>([])
  const [conventions, setConventions] = useState<ConventionRow[]>([])
  const [search, setSearch] = useState('')
  const [filterEntrepriseId, setFilterEntrepriseId] = useState<string>('tous')

  const [showEntrepriseForm, setShowEntrepriseForm] = useState(false)
  const [editingEntrepriseId, setEditingEntrepriseId] = useState<string | null>(null)
  const [showConventionForm, setShowConventionForm] = useState(false)
  const [editingConventionId, setEditingConventionId] = useState<string | null>(null)
  const [detailConvention, setDetailConvention] = useState<ConventionRow | null>(null)

  const [eNom, setENom] = useState('')
  const [eSecteur, setESecteur] = useState('')
  const [eContact, setEContact] = useState('')
  const [eEmail, setEEmail] = useState('')
  const [eTel, setETel] = useState('')
  const [eNotes, setENotes] = useState('')

  const [cEntrepriseId, setCEntrepriseId] = useState('')
  const [cRef, setCRef] = useState('')
  const [cType, setCType] = useState<ConventionType>('stage')
  const [cStatut, setCStatut] = useState<ConventionStatut>('brouillon')
  const [cDateSig, setCDateSig] = useState('')
  const [cDateDebut, setCDateDebut] = useState('')
  const [cDateFin, setCDateFin] = useState('')
  const [cNotes, setCNotes] = useState('')
  const [cFile, setCFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [downloadingConvId, setDownloadingConvId] = useState<string | null>(null)
  const [entrepriseImporting, setEntrepriseImporting] = useState(false)
  const entrepriseImportInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [eRes, cRes] = await Promise.all([
        supabase.from('partenaires_entreprises').select('*').order('nom'),
        supabase
          .from('conventions_partenariat')
          .select('*, partenaires_entreprises ( nom )')
          .order('created_at', { ascending: false }),
      ])
      if (eRes.error) throw eRes.error
      if (cRes.error) throw cRes.error
      setEntreprises((eRes.data as PartenaireEntreprise[]) || [])
      setConventions((cRes.data as ConventionRow[]) || [])
    } catch (err) {
      console.error('Erreur chargement partenariats:', err)
      alert('Erreur lors du chargement. Verifiez que les tables SQL ont ete creees sur Supabase.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredConventions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return conventions.filter((c) => {
      const nomE = (c.partenaires_entreprises?.nom || '').toLowerCase()
      const ref = (c.reference_interne || '').toLowerCase()
      const matchEnt = filterEntrepriseId === 'tous' || c.entreprise_id === filterEntrepriseId
      const matchQ =
        q === '' ||
        nomE.includes(q) ||
        ref.includes(q) ||
        getTypeLabel(c.type_convention).toLowerCase().includes(q) ||
        getStatutLabel(c.statut).toLowerCase().includes(q)
      return matchEnt && matchQ
    })
  }, [conventions, search, filterEntrepriseId])

  const resetEntrepriseForm = () => {
    setEditingEntrepriseId(null)
    setENom('')
    setESecteur('')
    setEContact('')
    setEEmail('')
    setETel('')
    setENotes('')
  }

  const openEditEntreprise = (en: PartenaireEntreprise) => {
    setEditingEntrepriseId(en.id)
    setENom(en.nom)
    setESecteur(en.secteur || '')
    setEContact(en.contact_nom || '')
    setEEmail(en.contact_email || '')
    setETel(en.contact_telephone || '')
    setENotes(en.notes || '')
    setShowEntrepriseForm(true)
  }

  const resetConventionForm = () => {
    setEditingConventionId(null)
    setCEntrepriseId(entreprises[0]?.id || '')
    setCRef('')
    setCType('stage')
    setCStatut('brouillon')
    setCDateSig('')
    setCDateDebut('')
    setCDateFin('')
    setCNotes('')
    setCFile(null)
  }

  const openEditConvention = (c: ConventionRow) => {
    setEditingConventionId(c.id)
    setCEntrepriseId(c.entreprise_id)
    setCRef(c.reference_interne || '')
    setCType((c.type_convention as ConventionType) || 'stage')
    setCStatut((c.statut as ConventionStatut) || 'brouillon')
    setCDateSig(c.date_signature || '')
    setCDateDebut(c.date_debut || '')
    setCDateFin(c.date_fin || '')
    setCNotes(c.notes_internes || '')
    setCFile(null)
    setShowConventionForm(true)
  }

  useEffect(() => {
    if (showConventionForm && entreprises.length && !cEntrepriseId) {
      setCEntrepriseId(entreprises[0].id)
    }
  }, [showConventionForm, entreprises, cEntrepriseId])

  const saveEntreprise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eNom.trim()) {
      alert('Le nom de l\'entreprise est obligatoire.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        nom: eNom.trim(),
        secteur: eSecteur.trim() || null,
        contact_nom: eContact.trim() || null,
        contact_email: eEmail.trim() || null,
        contact_telephone: eTel.trim() || null,
        notes: eNotes.trim() || null,
        updated_at: new Date().toISOString(),
      }
      if (editingEntrepriseId) {
        const { error } = await supabase.from('partenaires_entreprises').update(payload).eq('id', editingEntrepriseId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('partenaires_entreprises').insert(payload)
        if (error) throw error
      }
      setShowEntrepriseForm(false)
      resetEntrepriseForm()
      await loadData()
    } catch (err) {
      console.error(err)
      alert('Erreur lors de l\'enregistrement de l\'entreprise.')
    } finally {
      setSaving(false)
    }
  }

  const saveConvention = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cEntrepriseId) {
      alert('Veuillez creer au moins une entreprise partenaire avant d\'ajouter une convention.')
      return
    }
    setSaving(true)
    let fichier_url: string | null = null
    let fichier_path: string | null = null
    try {
      if (cFile) {
        const safeName = cFile.name.replace(/[^\w.\-]+/g, '_')
        fichier_path = `conventions_partenariat/${Date.now()}_${safeName}`
        const up = await supabase.storage.from('fichiers').upload(fichier_path, cFile)
        if (up.error) throw up.error
        const pub = supabase.storage.from('fichiers').getPublicUrl(fichier_path)
        fichier_url = pub.data.publicUrl
      }

      const basePayload = {
        entreprise_id: cEntrepriseId,
        reference_interne: cRef.trim() || null,
        type_convention: cType,
        statut: cStatut,
        date_signature: cDateSig || null,
        date_debut: cDateDebut || null,
        date_fin: cDateFin || null,
        notes_internes: cNotes.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (editingConventionId) {
        const updatePayload: Record<string, unknown> = { ...basePayload }
        if (fichier_url && fichier_path) {
          updatePayload.fichier_url = fichier_url
          updatePayload.fichier_path = fichier_path
        }
        const { error } = await supabase
          .from('conventions_partenariat')
          .update(updatePayload)
          .eq('id', editingConventionId)
        if (error) throw error
      } else {
        const { data: userData } = await supabase.auth.getUser()
        const { error } = await supabase.from('conventions_partenariat').insert({
          ...basePayload,
          fichier_url,
          fichier_path,
          created_by: userData.user?.id ?? null,
        })
        if (error) throw error
      }

      setShowConventionForm(false)
      resetConventionForm()
      await loadData()
    } catch (err) {
      console.error(err)
      alert('Erreur lors de l\'enregistrement de la convention (fichier ou base de donnees).')
    } finally {
      setSaving(false)
    }
  }

  const deleteEntreprise = async (id: string, nom: string) => {
    if (!confirm(`Supprimer l'entreprise "${nom}" et toutes ses conventions ?`)) return
    const { error } = await supabase.from('partenaires_entreprises').delete().eq('id', id)
    if (error) {
      alert('Suppression impossible.')
      return
    }
    await loadData()
  }

  const deleteConvention = async (id: string) => {
    if (!confirm('Supprimer cette convention ?')) return
    const { error } = await supabase.from('conventions_partenariat').delete().eq('id', id)
    if (error) {
      alert('Suppression impossible.')
      return
    }
    setDetailConvention(null)
    await loadData()
  }

  const exportExcel = () => {
    const rows = filteredConventions.map((c) => ({
      Date_creation: new Date(c.created_at).toLocaleString('fr-FR'),
      Entreprise: c.partenaires_entreprises?.nom || '',
      Reference: c.reference_interne || '',
      Type: getTypeLabel(c.type_convention),
      Statut: getStatutLabel(c.statut),
      Date_signature: c.date_signature || '',
      Date_debut: c.date_debut || '',
      Date_fin: c.date_fin || '',
      Fichier: c.fichier_url || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Conventions')
    XLSX.writeFile(wb, `conventions_partenariat_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const downloadEntrepriseImportTemplate = useCallback(() => {
    const headers = ['Nom', 'Secteur', 'Contact', 'Email', 'Téléphone', 'Notes']
    const example = [
      'Exemple SARL',
      'Services',
      'Prénom Nom',
      'contact@exemple.ma',
      '+212612345678',
      'Supprimez cette ligne exemple avant import',
    ]
    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    ws['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 42 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Entreprises')
    XLSX.writeFile(wb, 'modele_import_entreprises_partenariat.xlsx')
  }, [])

  const parseAndImportEntreprisesFile = async (file: File) => {
    setEntrepriseImporting(true)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][]
      if (!matrix.length) {
        alert('Fichier vide.')
        return
      }
      const colMap = buildEntrepriseImportColumnMap(matrix[0])
      if (colMap.nom === undefined) {
        alert(
          'Colonne « Nom » introuvable. Téléchargez le modèle Excel (bouton « Modèle import ») : la première ligne doit contenir les en-têtes.',
        )
        return
      }
      const payloads: Array<{
        nom: string
        secteur: string | null
        contact_nom: string | null
        contact_email: string | null
        contact_telephone: string | null
        notes: string | null
        updated_at: string
      }> = []
      for (let r = 1; r < matrix.length; r++) {
        const row = matrix[r] as unknown[]
        if (!row?.length) continue
        const nom = cellStr(row, colMap.nom)
        if (!nom) continue
        payloads.push({
          nom,
          secteur: cellStr(row, colMap.secteur) || null,
          contact_nom: cellStr(row, colMap.contact_nom) || null,
          contact_email: cellStr(row, colMap.contact_email) || null,
          contact_telephone: cellStr(row, colMap.contact_telephone) || null,
          notes: cellStr(row, colMap.notes) || null,
          updated_at: new Date().toISOString(),
        })
      }
      if (!payloads.length) {
        alert('Aucune ligne à importer : renseignez au moins une colonne « Nom » par ligne.')
        return
      }
      const CHUNK = 50
      for (let i = 0; i < payloads.length; i += CHUNK) {
        const chunk = payloads.slice(i, i + CHUNK)
        const { error } = await supabase.from('partenaires_entreprises').insert(chunk)
        if (error) throw error
      }
      await loadData()
      alert(`Import terminé : ${payloads.length} entreprise(s) ajoutée(s).`)
    } catch (e) {
      console.error(e)
      alert("Erreur lors de l'import. Vérifiez le fichier ou les droits sur la table partenaires_entreprises.")
    } finally {
      setEntrepriseImporting(false)
      if (entrepriseImportInputRef.current) entrepriseImportInputRef.current.value = ''
    }
  }

  const handleDownloadConvention = async (c: ConventionRow) => {
    if (!c.fichier_url) return
    setDownloadingConvId(c.id)
    try {
      await downloadConventionPdfFile(c)
    } finally {
      setDownloadingConvId(null)
    }
  }

  if (!canView) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-700 font-medium">Accès réservé à l&apos;équipe CMC.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Handshake className="w-6 h-6 text-blue-600" />
              Partenariats et conventions
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Suivi des conventions signees entre le CMC et les entreprises (plusieurs conventions par entreprise).
            </p>
            {!canEdit && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                Consultation seule : la création ou la modification des fiches est réservée à
                l&apos;administration.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <>
                <input
                  ref={entrepriseImportInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void parseAndImportEntreprisesFile(f)
                  }}
                />
                <button
                  type="button"
                  onClick={downloadEntrepriseImportTemplate}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 text-blue-800 rounded-lg hover:bg-blue-50 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Modèle import
                </button>
                <button
                  type="button"
                  disabled={entrepriseImporting}
                  onClick={() => entrepriseImportInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {entrepriseImporting ? 'Import...' : 'Importer entreprises'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetEntrepriseForm()
                    setShowEntrepriseForm(true)
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Building2 className="w-4 h-4" />
                  Nouvelle entreprise
                </button>
              </>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  resetConventionForm()
                  setShowConventionForm(true)
                }}
                className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Nouvelle convention
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={exportExcel}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            )}
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Entreprises partenaires ({entreprises.length})
          </h4>
          {loading ? (
            <p className="text-gray-500 text-sm">Chargement...</p>
          ) : entreprises.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {canEdit ? 'Aucune entreprise. Ajoutez-en une pour commencer.' : 'Aucune entreprise enregistrée.'}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {entreprises.map((en) => (
                <li key={en.id} className="py-2 flex justify-between gap-2 items-start">
                  <div>
                    <p className="font-medium text-gray-900">{en.nom}</p>
                    {en.secteur && <p className="text-xs text-gray-500">{en.secteur}</p>}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditEntreprise(en)}
                        className="text-blue-600 p-1 hover:bg-blue-50 rounded"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEntreprise(en.id, en.nom)}
                        className="text-red-600 p-1 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Conventions ({filteredConventions.length})
          </h4>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={filterEntrepriseId}
              onChange={(e) => setFilterEntrepriseId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="tous">Toutes les entreprises</option>
              {entreprises.map((en) => (
                <option key={en.id} value={en.id}>
                  {en.nom}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <p className="text-gray-500 text-sm">Chargement...</p>
          ) : filteredConventions.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune convention pour ces filtres.</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {filteredConventions.map((c) => (
                <li key={c.id} className="py-2 flex justify-between gap-2 items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{c.partenaires_entreprises?.nom || '—'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{getTypeLabel(c.type_convention)}</span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          STATUT_BADGE[c.statut as ConventionStatut] ?? 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {getStatutLabel(c.statut)}
                      </span>
                      <span
                        className="inline-flex items-center gap-0.5 text-xs text-gray-500"
                        title={getConventionListDate(c).title}
                      >
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-gray-400" aria-hidden />
                        {getConventionListDate(c).text}
                      </span>
                      {c.reference_interne && (
                        <span className="text-xs text-gray-500">Ref. {c.reference_interne}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => openEditConvention(c)}
                        className="inline-flex items-center gap-1 text-gray-700 text-sm px-2 py-1 rounded-lg hover:bg-gray-100"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="hidden sm:inline">Modifier</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDetailConvention(c)}
                      className="inline-flex items-center gap-1 text-blue-600 text-sm px-2 py-1 rounded-lg hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </button>
                    {c.fichier_url && (
                      <button
                        type="button"
                        title="Télécharger le PDF"
                        disabled={downloadingConvId === c.id}
                        onClick={() => void handleDownloadConvention(c)}
                        className="inline-flex items-center gap-1 text-gray-700 text-sm px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showEntrepriseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => {
                setShowEntrepriseForm(false)
                resetEntrepriseForm()
              }}
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-semibold mb-4">
              {editingEntrepriseId ? 'Modifier l\'entreprise partenaire' : 'Nouvelle entreprise partenaire'}
            </h4>
            <form onSubmit={saveEntreprise} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nom *</label>
                <input
                  required
                  value={eNom}
                  onChange={(e) => setENom(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Secteur</label>
                <input value={eSecteur} onChange={(e) => setESecteur(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact</label>
                  <input value={eContact} onChange={(e) => setEContact(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telephone</label>
                  <input value={eTel} onChange={(e) => setETel(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <textarea value={eNotes} onChange={(e) => setENotes(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : editingEntrepriseId ? 'Mettre a jour' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showConventionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative my-8">
            <button
              type="button"
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => {
                setShowConventionForm(false)
                resetConventionForm()
              }}
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-semibold mb-4">
              {editingConventionId ? 'Modifier la convention' : 'Nouvelle convention'}
            </h4>
            <form onSubmit={saveConvention} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Entreprise *</label>
                <select
                  required
                  value={cEntrepriseId}
                  onChange={(e) => setCEntrepriseId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                >
                  {entreprises.map((en) => (
                    <option key={en.id} value={en.id}>
                      {en.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Reference interne</label>
                <input value={cRef} onChange={(e) => setCRef(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <select value={cType} onChange={(e) => setCType(e.target.value as ConventionType)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                    {(Object.keys(TYPE_LABEL) as ConventionType[]).map((k) => (
                      <option key={k} value={k}>
                        {TYPE_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Statut</label>
                  <select value={cStatut} onChange={(e) => setCStatut(e.target.value as ConventionStatut)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                    {(Object.keys(STATUT_LABEL) as ConventionStatut[]).map((k) => (
                      <option key={k} value={k}>
                        {STATUT_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Signature</label>
                  <input type="date" value={cDateSig} onChange={(e) => setCDateSig(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Debut</label>
                  <input type="date" value={cDateDebut} onChange={(e) => setCDateDebut(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fin</label>
                  <input type="date" value={cDateFin} onChange={(e) => setCDateFin(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fichier convention (PDF)</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setCFile(e.target.files?.[0] || null)}
                  className="w-full text-sm mt-1"
                />
                {editingConventionId && (
                  <p className="text-xs text-gray-500 mt-1">Laisser vide pour conserver le fichier actuel.</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Notes internes</label>
                <textarea value={cNotes} onChange={(e) => setCNotes(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <button
                type="submit"
                disabled={saving || entreprises.length === 0}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : editingConventionId ? 'Mettre a jour' : 'Enregistrer la convention'}
              </button>
            </form>
          </div>
        </div>
      )}

      {detailConvention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 relative my-8">
            <button
              type="button"
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => setDetailConvention(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-semibold mb-2 flex flex-wrap items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {detailConvention.partenaires_entreprises?.nom} — {getTypeLabel(detailConvention.type_convention)}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  STATUT_BADGE[detailConvention.statut as ConventionStatut] ?? 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {getStatutLabel(detailConvention.statut)}
              </span>
            </h4>
            <p className="text-sm text-gray-600 mb-4 flex flex-wrap gap-3">
              {detailConvention.reference_interne && <span>Ref. {detailConvention.reference_interne}</span>}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    const row = detailConvention
                    setDetailConvention(null)
                    openEditConvention(row)
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm hover:bg-gray-200"
                >
                  <Pencil className="w-4 h-4" />
                  Modifier
                </button>
              )}
              {detailConvention.fichier_url && (
                <>
                  <button
                    type="button"
                    disabled={downloadingConvId === detailConvention.id}
                    onClick={() => void handleDownloadConvention(detailConvention)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-900 rounded-lg text-sm hover:bg-emerald-200 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le PDF
                  </button>
                  <a
                    href={detailConvention.fichier_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir le PDF
                  </a>
                </>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => deleteConvention(detailConvention.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              )}
            </div>
            {detailConvention.fichier_url ? (
              <div className="border rounded-lg overflow-hidden h-[70vh] min-h-[400px]">
                <iframe title="Convention PDF" src={detailConvention.fichier_url} className="w-full h-full" />
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucun fichier joint.</p>
            )}
            {detailConvention.notes_internes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium text-gray-800 mb-1">Notes internes</p>
                <p className="text-gray-700 whitespace-pre-wrap">{detailConvention.notes_internes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
