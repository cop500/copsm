'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Smartphone,
  Upload,
  FileSpreadsheet,
  MessageSquare,
  Layers,
  Download,
  Sparkles,
  Copy,
  CheckCircle2,
  Info,
  X,
  ChevronRight,
  Users,
  Hash,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'

export interface SmsRecipient {
  numero: string
}

const DEFAULT_COUNTRY_CODE = '+212'

const STEPS = [
  { id: 1, label: 'Destinataires', icon: Users },
  { id: 2, label: 'Message', icon: MessageSquare },
  { id: 3, label: 'Lots & export', icon: Layers },
] as const

const DEFAULT_TEMPLATE = `Bonjour,

Le COP vous informe d'une opportunité professionnelle ({{pole}} — {{filiere}}) chez {{entreprise}}.

{{instruction_date}}

Réf. : {{reference_offre}} | Lieu : {{lieu}} | Heure : {{heure}}

Merci de nous envoyer votre CV à l'adresse indiquée.`

function normalizeNumero(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('212')) return digits
  if (digits.startsWith('0')) return `212${digits.slice(1)}`
  if (digits.length >= 9) return `212${digits}`
  return digits
}

function formatNumero(raw: string): string {
  const n = normalizeNumero(raw)
  return n ? `${DEFAULT_COUNTRY_CODE}${n.startsWith('212') ? n.slice(3) : n}` : raw
}

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) =>
    String(h || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  )
  for (const c of candidates) {
    const idx = normalized.findIndex((h) => h.includes(c))
    if (idx >= 0) return idx
  }
  return -1
}

async function parseExcelFile(file: File): Promise<SmsRecipient[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: '' })
  if (rows.length < 2) throw new Error('Le fichier doit contenir au moins une ligne de données.')

  const headers = (rows[0] || []).map(String)
  const numCol = findColumn(headers, ['numero', 'telephone', 'phone', 'tel', 'gsm', 'mobile'])
  if (numCol < 0) throw new Error('Colonne « Numéro » ou « Téléphone » introuvable dans le fichier.')

  const list: SmsRecipient[] = []
  const seen = new Set<string>()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const raw = String(row[numCol] ?? '').trim()
    if (!raw) continue
    const key = normalizeNumero(raw)
    if (key.length < 9 || seen.has(key)) continue
    seen.add(key)
    list.push({ numero: key.startsWith('212') ? key.slice(3) : key.replace(/^0/, '') })
  }

  if (list.length === 0) throw new Error('Aucun numéro valide trouvé dans le fichier.')
  return list
}

function parsePastedNumbers(text: string): SmsRecipient[] {
  const seen = new Set<string>()
  const list: SmsRecipient[] = []
  for (const part of text.split(/[\n,;\s]+/)) {
    const raw = part.trim()
    if (!raw) continue
    const key = normalizeNumero(raw)
    if (key.length < 9 || seen.has(key)) continue
    seen.add(key)
    list.push({ numero: key.startsWith('212') ? key.slice(3) : key.replace(/^0/, '') })
  }
  return list
}

function smsSegments(text: string): number {
  const len = text.length
  if (len === 0) return 0
  const hasUnicode = /[^\x00-\x7F]/.test(text)
  const single = hasUnicode ? 70 : 160
  const multi = hasUnicode ? 67 : 153
  if (len <= single) return 1
  return Math.ceil((len - single) / multi) + 1
}

function suggestVariations(base: string): string[] {
  const swaps: [RegExp, string][] = [
    [/Merci de nous envoyer votre CV à l'adresse indiquée\.?/gi, "N'hésitez pas à nous transmettre votre CV mis à jour."],
    [/Le COP vous informe/gi, 'Le Centre COP vous informe'],
    [/opportunité professionnelle/gi, 'nouvelle opportunité'],
    [/Bonjour,/gi, 'Bonjour et bonne journée,'],
    [/Merci de nous envoyer votre CV/gi, 'Merci de bien vouloir nous adresser votre CV'],
  ]
  const results: string[] = []
  for (const [pattern, replacement] of swaps) {
    if (pattern.test(base)) {
      const variant = base.replace(pattern, replacement)
      if (variant !== base && !results.includes(variant)) results.push(variant)
    }
  }
  if (results.length === 0) {
    results.push(`${base.trim()}\n\nNous restons à votre disposition.`)
  }
  return results.slice(0, 3)
}

export default function SmsModule() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [fileName, setFileName] = useState<string | null>(null)
  const [excelRecipients, setExcelRecipients] = useState<SmsRecipient[] | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [numberOfLots, setNumberOfLots] = useState(3)
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_TEMPLATE)
  const [variations, setVariations] = useState<string[]>([
    "Merci de nous envoyer votre CV à l'adresse indiquée.",
  ])
  const [entreprise, setEntreprise] = useState('')
  const [referenceOffre, setReferenceOffre] = useState('')
  const [lieu, setLieu] = useState('')
  const [heure, setHeure] = useState('')
  const [pole, setPole] = useState('')
  const [filiere, setFiliere] = useState('')
  const [lienPostuler, setLienPostuler] = useState('')
  const [dateEvenement, setDateEvenement] = useState('')
  const [dateMode, setDateMode] = useState<'cv_avant' | 'presenter'>('cv_avant')
  const [copiedLot, setCopiedLot] = useState<number | null>(null)
  const [textoConfigured, setTextoConfigured] = useState(false)
  const [textoLoading, setTextoLoading] = useState(true)
  const [testNumber, setTestNumber] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [delayMs, setDelayMs] = useState(3000)
  const [campaignSending, setCampaignSending] = useState(false)
  const [campaignResult, setCampaignResult] = useState<{
    sent: number
    failed: number
    total: number
  } | null>(null)

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Session expirée — reconnectez-vous')
    return { Authorization: `Bearer ${session.access_token}` }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const headers = await getAuthHeaders()
        const res = await fetch('/api/sms/texto/status', { headers })
        if (!res.ok) throw new Error('status')
        const data = await res.json()
        if (!cancelled) setTextoConfigured(Boolean(data.configured))
      } catch {
        if (!cancelled) setTextoConfigured(false)
      } finally {
        if (!cancelled) setTextoLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [getAuthHeaders])

  const pastedRecipients = useMemo(() => parsePastedNumbers(pastedText), [pastedText])
  const recipients = useMemo(
    () => (excelRecipients && excelRecipients.length > 0 ? excelRecipients : pastedRecipients),
    [excelRecipients, pastedRecipients]
  )

  const instructionDate = useMemo(() => {
    if (!dateEvenement) return ''
    return dateMode === 'cv_avant'
      ? `Merci d'envoyer votre CV avant le ${dateEvenement}.`
      : `Merci de vous présenter à la journée de recrutement le ${dateEvenement}.`
  }, [dateEvenement, dateMode])

  const getLotIndex = (index: number) => {
    if (recipients.length === 0 || numberOfLots <= 1) return 0
    const size = Math.ceil(recipients.length / numberOfLots)
    return Math.min(Math.floor(index / size), numberOfLots - 1)
  }

  const getVariation = (lotIndex: number) => variations[lotIndex % variations.length] || ''

  const buildMessageForLot = (lotIndex: number) => {
    let msg = messageTemplate
      .replace(/\{\{entreprise\}\}/g, entreprise || '—')
      .replace(/\{\{reference_offre\}\}/g, referenceOffre || '—')
      .replace(/\{\{lieu\}\}/g, lieu || '—')
      .replace(/\{\{heure\}\}/g, heure || '—')
      .replace(/\{\{pole\}\}/g, pole || '—')
      .replace(/\{\{filiere\}\}/g, filiere || '—')
      .replace(/\{\{lien_postuler\}\}/g, lienPostuler || '—')
      .replace(/\{\{date\}\}/g, dateEvenement || '—')
      .replace(/\{\{instruction_date\}\}/g, instructionDate)

    const variation = getVariation(lotIndex)
    const anchor = variations.find((v) => v && msg.includes(v))
    if (anchor && variation) msg = msg.replace(anchor, variation)
    else if (variation && !msg.includes(variation)) msg = `${msg.trim()}\n\n${variation}`

    return msg.replace(/\n{3,}/g, '\n\n').trim()
  }

  const lotPreviews = useMemo(() => {
    return Array.from({ length: Math.min(numberOfLots, 5) }, (_, lotIndex) => ({
      lot: lotIndex + 1,
      message: buildMessageForLot(lotIndex),
      count: recipients.filter((_, i) => getLotIndex(i) === lotIndex).length,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipients, numberOfLots, messageTemplate, variations, entreprise, referenceOffre, lieu, heure, pole, filiere, lienPostuler, dateEvenement, instructionDate])

  const previewMessage = lotPreviews[0]?.message ?? ''
  const charCount = previewMessage.length
  const segmentCount = smsSegments(previewMessage)

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const list = await parseExcelFile(file)
      setExcelRecipients(list)
      setFileName(file.name)
      setPastedText('')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier.')
    }
    e.target.value = ''
  }

  const exportExcel = () => {
    const data = recipients.map((r, i) => {
      const lotIndex = getLotIndex(i)
      return {
        Lot: lotIndex + 1,
        Numéro: formatNumero(r.numero),
        Message: buildMessageForLot(lotIndex),
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'SMS')
    XLSX.writeFile(wb, `sms_cop_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const copyLotMessage = async (lotIndex: number) => {
    await navigator.clipboard.writeText(buildMessageForLot(lotIndex))
    setCopiedLot(lotIndex)
    setTimeout(() => setCopiedLot(null), 2000)
  }

  const addVariation = () => {
    const suggestions = suggestVariations(messageTemplate)
    const next = suggestions.find((s) => !variations.includes(s))
    if (next) setVariations((v) => [...v, next])
    else setVariations((v) => [...v, `${v[v.length - 1] || ''}`.trim()])
  }

  const buildCampaignMessages = () =>
    recipients.map((r, i) => {
      const lotIndex = getLotIndex(i)
      return {
        numero: r.numero,
        lot: lotIndex + 1,
        message: buildMessageForLot(lotIndex),
      }
    })

  const sendTestSms = async () => {
    const to = testNumber.trim() || recipients[0]?.numero
    if (!to) {
      setTestResult({ ok: false, message: 'Indiquez un numéro de test ou importez des destinataires.' })
      return
    }
    setTestSending(true)
    setTestResult(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/sms/texto/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ to, message: buildMessageForLot(0) }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult({ ok: true, message: 'SMS test envoyé avec succès via Texto.' })
      } else {
        setTestResult({
          ok: false,
          message: typeof data.response === 'object' ? JSON.stringify(data.response) : data.error || 'Échec envoi',
        })
      }
    } catch (err: unknown) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Erreur réseau',
      })
    } finally {
      setTestSending(false)
    }
  }

  const sendCampaign = async () => {
    if (recipients.length === 0) return
    const confirmSend = window.confirm(
      `Envoyer ${recipients.length} SMS via Texto ?\nDélai entre chaque envoi : ${delayMs / 1000}s`
    )
    if (!confirmSend) return

    setCampaignSending(true)
    setCampaignResult(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/sms/texto/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          messages: buildCampaignMessages(),
          delayMs,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec campagne')
      setCampaignResult({ sent: data.sent, failed: data.failed, total: data.total })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
    } finally {
      setCampaignSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20">
                <Smartphone className="h-7 w-7 text-indigo-200" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-semibold tracking-tight">Studio SMS</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                      textoLoading
                        ? 'bg-slate-400/20 text-slate-200 ring-slate-400/30'
                        : textoConfigured
                          ? 'bg-emerald-400/20 text-emerald-200 ring-emerald-400/30'
                          : 'bg-amber-400/20 text-amber-200 ring-amber-400/30'
                    }`}
                  >
                    {textoLoading
                      ? 'Texto…'
                      : textoConfigured
                        ? 'Texto connecté'
                        : 'Texto · token à configurer'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-300 max-w-xl">
                  Importez vos numéros, composez le message, répartissez en lots avec variantes — export Excel prêt pour votre outil d&apos;envoi.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur ring-1 ring-white/10">
                <div className="text-2xl font-bold">{recipients.length}</div>
                <div className="text-xs text-slate-300">Numéros</div>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur ring-1 ring-white/10">
                <div className="text-2xl font-bold">{numberOfLots}</div>
                <div className="text-xs text-slate-300">Lots</div>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur ring-1 ring-white/10">
                <div className="text-2xl font-bold">{segmentCount}</div>
                <div className="text-xs text-slate-300">SMS / lot</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step) => {
          const Icon = step.icon
          const isActive = activeStep === step.id
          const isDone = activeStep > step.id
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id as 1 | 2 | 3)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : isDone
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-indigo-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {step.label}
              {isDone && <CheckCircle2 className="h-4 w-4 text-indigo-500" />}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="xl:col-span-2 space-y-6">
          {activeStep === 1 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Destinataires</h3>
              <p className="text-sm text-gray-500 mb-6">
                Fichier Excel avec une colonne Numéro / Téléphone, ou collez les numéros directement.
              </p>

              <div
                className="group relative mb-6 cursor-pointer rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
                <Upload className="mx-auto h-10 w-10 text-indigo-400 group-hover:text-indigo-600" />
                <p className="mt-3 font-medium text-gray-800">Glisser ou cliquer pour importer Excel</p>
                <p className="text-xs text-gray-500 mt-1">Colonne requise : Numéro ou Téléphone</p>
                {fileName && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-indigo-700 ring-1 ring-indigo-100">
                    <FileSpreadsheet className="h-4 w-4" />
                    {fileName}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExcelRecipients(null)
                        setFileName(null)
                      }}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou coller les numéros (un par ligne, virgule ou espace)
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value)
                    if (e.target.value.trim()) {
                      setExcelRecipients(null)
                      setFileName(null)
                    }
                  }}
                  rows={5}
                  placeholder="0612345678&#10;0623456789&#10;..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  disabled={!!fileName}
                />
              </div>

              {recipients.length > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  {recipients.length} numéro(s) prêt(s) · format {DEFAULT_COUNTRY_CODE} appliqué automatiquement
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={recipients.length === 0}
                  onClick={() => setActiveStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  Continuer
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Message & détails de l&apos;offre</h3>
                <p className="text-sm text-gray-500">
                  Un message par lot (pas de personnalisation par numéro). Les champs ci-dessous remplissent le texte.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Entreprise', value: entreprise, set: setEntreprise },
                  { label: 'Référence offre', value: referenceOffre, set: setReferenceOffre },
                  { label: 'Pôle', value: pole, set: setPole },
                  { label: 'Filière', value: filiere, set: setFiliere },
                  { label: 'Lieu', value: lieu, set: setLieu },
                  { label: 'Heure', value: heure, set: setHeure },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <input
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Lien postuler (optionnel)</label>
                  <input
                    value={lienPostuler}
                    onChange={(e) => setLienPostuler(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">Date & consigne</label>
                <input
                  type="text"
                  value={dateEvenement}
                  onChange={(e) => setDateEvenement(e.target.value)}
                  placeholder="Ex. 25/06/2026"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      checked={dateMode === 'cv_avant'}
                      onChange={() => setDateMode('cv_avant')}
                      className="text-indigo-600"
                    />
                    Envoyer le CV avant cette date
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      checked={dateMode === 'presenter'}
                      onChange={() => setDateMode('presenter')}
                      className="text-indigo-600"
                    />
                    Se présenter à la journée de recrutement
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Texte du message</label>
                  <span className={`text-xs ${charCount > 160 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {charCount} car. · {segmentCount} SMS
                  </span>
                </div>
                <textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono leading-relaxed focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-2 text-xs text-gray-400">
                  Variables : {'{{entreprise}}'}, {'{{pole}}'}, {'{{filiere}}'}, {'{{reference_offre}}'}, {'{{lieu}}'}, {'{{heure}}'}, {'{{instruction_date}}'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addVariation}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 ring-1 ring-violet-100 hover:bg-violet-100"
                >
                  <Sparkles className="h-4 w-4" />
                  Ajouter une variante
                </button>
              </div>

              {variations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Variantes par lot</p>
                  {variations.map((v, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                        {i + 1}
                      </span>
                      <input
                        value={v}
                        onChange={(e) => {
                          const next = [...variations]
                          next[i] = e.target.value
                          setVariations(next)
                        }}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                      {variations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setVariations((arr) => arr.filter((_, j) => j !== i))}
                          className="text-gray-400 hover:text-red-500 px-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setActiveStep(1)} className="text-sm text-gray-500 hover:text-gray-800">
                  ← Retour
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Continuer
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Répartition & export</h3>
                <p className="text-sm text-gray-500">
                  Chaque lot reçoit une variante différente du message pour limiter le filtrage opérateur.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de lots : <span className="text-indigo-600 font-bold">{numberOfLots}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, Math.min(10, recipients.length))}
                  value={numberOfLots}
                  onChange={(e) => setNumberOfLots(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 lot</span>
                  <span>~{Math.ceil(recipients.length / numberOfLots)} num./lot</span>
                  <span>{Math.min(10, recipients.length)} lots max</span>
                </div>
              </div>

              <div className="space-y-3">
                {lotPreviews.map(({ lot, message, count }) => (
                  <div key={lot} className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                          {lot}
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          Lot {lot} · {count} numéro(s)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyLotMessage(lot - 1)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        {copiedLot === lot - 1 ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copier message
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{message}</p>
                  </div>
                ))}
                {numberOfLots > 5 && (
                  <p className="text-xs text-gray-400 text-center">+ {numberOfLots - 5} lot(s) supplémentaire(s) dans l&apos;export</p>
                )}
              </div>

              <button
                type="button"
                disabled={recipients.length === 0}
                onClick={exportExcel}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
              >
                <Download className="h-5 w-5" />
                Télécharger Excel (Lot · Numéro · Message)
              </button>

              {/* Texto.ma */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-indigo-600" />
                  <h4 className="font-semibold text-gray-900">Envoi via Texto.ma</h4>
                </div>

                {!textoConfigured && !textoLoading && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>
                      Ajoutez <code className="text-xs bg-amber-100 px-1 rounded">TEXTO_API_TOKEN</code> dans{' '}
                      <code className="text-xs bg-amber-100 px-1 rounded">.env.local</code> puis redémarrez le serveur.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SMS test (1 numéro)</label>
                    <input
                      value={testNumber}
                      onChange={(e) => setTestNumber(e.target.value)}
                      placeholder={recipients[0] ? formatNumero(recipients[0].numero) : '0612345678'}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={!textoConfigured || testSending}
                      onClick={sendTestSms}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                    >
                      {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Tester l&apos;envoi
                    </button>
                  </div>
                </div>

                {testResult && (
                  <p
                    className={`text-sm rounded-lg px-3 py-2 ${
                      testResult.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                    }`}
                  >
                    {testResult.message}
                  </p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Délai entre envois : <span className="text-indigo-600">{delayMs / 1000}s</span>
                  </label>
                  <input
                    type="range"
                    min={1000}
                    max={30000}
                    step={500}
                    value={delayMs}
                    onChange={(e) => setDelayMs(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <button
                  type="button"
                  disabled={!textoConfigured || campaignSending || recipients.length === 0}
                  onClick={sendCampaign}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-40"
                >
                  {campaignSending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Envoyer {recipients.length} SMS via Texto
                    </>
                  )}
                </button>

                {campaignResult && (
                  <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    Campagne terminée : {campaignResult.sent} envoyé(s), {campaignResult.failed} échec(s) sur{' '}
                    {campaignResult.total}.
                  </div>
                )}

                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>
                    Commencez toujours par un SMS test. Le sender ID par défaut Texto s&apos;applique tant que votre
                    nom personnalisé n&apos;est pas validé.
                  </p>
                </div>
              </div>

              <div className="flex justify-start">
                <button type="button" onClick={() => setActiveStep(2)} className="text-sm text-gray-500 hover:text-gray-800">
                  ← Retour
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Aperçu téléphone */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <div className="mx-auto max-w-[280px]">
              <div className="rounded-[2rem] bg-slate-900 p-3 shadow-2xl ring-1 ring-slate-700">
                <div className="rounded-[1.5rem] bg-slate-100 overflow-hidden">
                  <div className="bg-slate-800 px-4 py-3 text-center">
                    <p className="text-xs text-slate-400">Aperçu SMS</p>
                    <p className="text-sm font-medium text-white truncate">COP · CMC SM</p>
                  </div>
                  <div className="min-h-[320px] p-4 bg-gradient-to-b from-slate-100 to-slate-200">
                    {previewMessage ? (
                      <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-indigo-600 px-3 py-2.5 text-xs text-white shadow-md whitespace-pre-wrap leading-relaxed">
                        {previewMessage}
                      </div>
                    ) : (
                      <p className="text-center text-xs text-gray-400 mt-20">Composez votre message…</p>
                    )}
                  </div>
                  <div className="border-t border-slate-200 bg-white px-4 py-2 flex justify-between text-[10px] text-gray-400">
                    <span>{charCount} caractères</span>
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {segmentCount} segment(s)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              Aperçu lot 1 · Les autres lots utilisent les variantes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
