'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Smartphone,
  Upload,
  FileSpreadsheet,
  MessageSquare,
  Download,
  CheckCircle2,
  Info,
  X,
  Users,
  Hash,
  Send,
  Loader2,
  AlertCircle,
  History,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'

export interface SmsRecipient {
  numero: string
}

interface SmsCampaign {
  id: string
  libelle: string
  entreprise: string | null
  reference_offre: string | null
  pole: string | null
  filiere: string | null
  lieu: string | null
  message: string
  total_count: number
  sent_count: number
  failed_count: number
  created_at: string
}

interface SmsEnvois {
  id: string
  numero: string
  success: boolean
  provider_status: number | null
}

const DEFAULT_COUNTRY_CODE = '+212'
const SMS_MAX_LENGTH = 160
const DEFAULT_SMS_SIGNATURE = 'COPSM'
const SMS_SIGNATURE_MAX = 24

function composeSmsBody(
  poste: string,
  typeContrat: string,
  dateDebut: string,
  lien: string,
  reference: string
) {
  return `Votre profil peut correspondre : ${poste || '…'} (${typeContrat || '…'}). Début ${dateDebut || '…'}. Postulez : ${lien || '…'} – Réf ${reference || '…'}`
}

function buildFinalSmsMessage(
  body: string,
  signatureEnabled: boolean,
  signatureText: string
): string {
  const trimmed = body.trim()
  const sig = signatureText.trim()
  if (!signatureEnabled || !sig) return trimmed
  if (trimmed.endsWith(sig)) return trimmed
  const suffix = ` ${sig}`
  return trimmed ? `${trimmed}${suffix}` : sig
}

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
  if (numCol < 0) throw new Error('Colonne « Numéro » ou « Téléphone » introuvable.')

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

  if (list.length === 0) throw new Error('Aucun numéro valide trouvé.')
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

function buildCampaignLabel(poste: string, reference: string) {
  const parts = [poste, reference].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  return `Campagne ${new Date().toLocaleDateString('fr-FR')}`
}

export default function SmsModule() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<'send' | 'history'>('send')
  const [fileName, setFileName] = useState<string | null>(null)
  const [excelRecipients, setExcelRecipients] = useState<SmsRecipient[] | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [libelleCampagne, setLibelleCampagne] = useState('')
  const [poste, setPoste] = useState('Technicien de Laboratoire')
  const [typeContrat, setTypeContrat] = useState('CDI')
  const [dateDebut, setDateDebut] = useState('01/07/2026')
  const [lien, setLien] = useState('copsm.space/candidature')
  const [reference, setReference] = useState('COP-0116')
  const [messageBody, setMessageBody] = useState(() =>
    composeSmsBody('Technicien de Laboratoire', 'CDI', '01/07/2026', 'copsm.space/candidature', 'COP-0116')
  )
  const [signatureEnabled, setSignatureEnabled] = useState(true)
  const [signatureText, setSignatureText] = useState(DEFAULT_SMS_SIGNATURE)
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
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedEnvois, setExpandedEnvois] = useState<SmsEnvois[]>([])
  const [expandedLoading, setExpandedLoading] = useState(false)

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Session expirée — reconnectez-vous')
    return { Authorization: `Bearer ${session.access_token}` }
  }, [])

  const buildMessage = useCallback(() => {
    return buildFinalSmsMessage(messageBody, signatureEnabled, signatureText)
  }, [messageBody, signatureEnabled, signatureText])

  const signatureSuffix = useMemo(() => {
    if (!signatureEnabled) return ''
    const sig = signatureText.trim()
    return sig ? ` ${sig}` : ''
  }, [signatureEnabled, signatureText])

  const maxBodyLength = SMS_MAX_LENGTH - signatureSuffix.length

  const handleSignatureToggle = (enabled: boolean) => {
    setSignatureEnabled(enabled)
    if (enabled) {
      const suffix = signatureText.trim() ? ` ${signatureText.trim()}` : ''
      setMessageBody((prev) => prev.slice(0, SMS_MAX_LENGTH - suffix.length))
    }
  }

  const handleSignatureTextChange = (value: string) => {
    const cleaned = value.slice(0, SMS_SIGNATURE_MAX)
    setSignatureText(cleaned)
    const suffix = signatureEnabled && cleaned.trim() ? ` ${cleaned.trim()}` : ''
    setMessageBody((prev) => prev.slice(0, SMS_MAX_LENGTH - suffix.length))
  }

  const previewMessage = buildMessage()
  const charCount = previewMessage.length
  const segmentCount = smsSegments(previewMessage)
  const isOverLimit = charCount > SMS_MAX_LENGTH

  const syncMessageFromFields = useCallback(() => {
    const body = composeSmsBody(poste, typeContrat, dateDebut, lien, reference)
    setMessageBody(body.slice(0, maxBodyLength))
  }, [poste, typeContrat, dateDebut, lien, reference, maxBodyLength])

  const pastedRecipients = useMemo(() => parsePastedNumbers(pastedText), [pastedText])
  const recipients = useMemo(
    () => (excelRecipients && excelRecipients.length > 0 ? excelRecipients : pastedRecipients),
    [excelRecipients, pastedRecipients]
  )

  const campaignLabel = libelleCampagne.trim() || buildCampaignLabel(poste, reference)

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const headers = await getAuthHeaders()
      const q = historyFilter.trim()
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      const res = await fetch(`/api/sms/campaigns?${params}`, { headers })
      const data = await res.json()
      if (res.ok) setCampaigns(data.campaigns ?? [])
    } catch {
      setCampaigns([])
    } finally {
      setHistoryLoading(false)
    }
  }, [getAuthHeaders, historyFilter])

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

  useEffect(() => {
    if (view === 'history') loadHistory()
  }, [view, loadHistory])

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const list = await parseExcelFile(file)
      setExcelRecipients(list)
      setFileName(file.name)
      setPastedText('')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lecture fichier.')
    }
    e.target.value = ''
  }

  const exportExcel = () => {
    const msg = buildMessage()
    const data = recipients.map((r) => ({
      Numéro: formatNumero(r.numero),
      Message: msg,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'SMS')
    const slug = (reference || 'cop').replace(/\s+/g, '_').slice(0, 20)
    XLSX.writeFile(wb, `sms_${slug}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const sendTestSms = async () => {
    const to = testNumber.trim() || recipients[0]?.numero
    if (!to) {
      setTestResult({ ok: false, message: 'Indiquez un numéro de test.' })
      return
    }
    if (isOverLimit) {
      setTestResult({ ok: false, message: `Message trop long (${charCount}/${SMS_MAX_LENGTH} car.).` })
      return
    }
    setTestSending(true)
    setTestResult(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/sms/texto/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ to, message: buildMessage() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult({ ok: true, message: 'SMS test envoyé.' })
      } else {
        setTestResult({
          ok: false,
          message: typeof data.response === 'object' ? JSON.stringify(data.response) : data.error || 'Échec',
        })
      }
    } catch (err: unknown) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Erreur réseau' })
    } finally {
      setTestSending(false)
    }
  }

  const sendCampaign = async () => {
    if (recipients.length === 0) return
    const msg = buildMessage()
    if (isOverLimit) {
      alert(`Message trop long (${charCount}/${SMS_MAX_LENGTH} caractères). Raccourcissez le texte.`)
      return
    }
    if (!window.confirm(`Envoyer ${recipients.length} SMS — « ${campaignLabel} » ?`)) return

    setCampaignSending(true)
    setCampaignResult(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/sms/texto/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          messages: recipients.map((r) => ({ numero: r.numero, message: msg })),
          delayMs,
          campaign: {
            libelle: campaignLabel,
            entreprise: poste,
            reference_offre: reference,
            pole: typeContrat,
            filiere: dateDebut,
            lieu: lien,
            message: msg,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec envoi')
      setCampaignResult({ sent: data.sent, failed: data.failed, total: data.total })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur envoi')
    } finally {
      setCampaignSending(false)
    }
  }

  const toggleCampaignDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedEnvois([])
      return
    }
    setExpandedId(id)
    setExpandedLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/sms/campaigns/${id}`, { headers })
      const data = await res.json()
      if (res.ok) setExpandedEnvois(data.envois ?? [])
    } catch {
      setExpandedEnvois([])
    } finally {
      setExpandedLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <Smartphone className="h-7 w-7 text-indigo-200" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-semibold">SMS</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                      textoConfigured
                        ? 'bg-emerald-400/20 text-emerald-200 ring-emerald-400/30'
                        : 'bg-amber-400/20 text-amber-200 ring-amber-400/30'
                    }`}
                  >
                    {textoLoading ? '…' : textoConfigured ? 'Texto connecté' : 'Texto non configuré'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  Destinataires, message par offre, envoi et historique des campagnes.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="rounded-xl bg-white/10 px-4 py-3 text-center ring-1 ring-white/10">
                <div className="text-2xl font-bold">{recipients.length}</div>
                <div className="text-xs text-slate-300">Destinataires</div>
              </div>
              <div className={`rounded-xl px-4 py-3 text-center ring-1 ${isOverLimit ? 'bg-red-500/20 ring-red-400/40' : 'bg-white/10 ring-white/10'}`}>
                <div className="text-2xl font-bold">{charCount}/{SMS_MAX_LENGTH}</div>
                <div className="text-xs text-slate-300">Caractères</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets principaux */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView('send')}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium ${
            view === 'send'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-indigo-200'
          }`}
        >
          <Send className="h-4 w-4" />
          Nouveau SMS
        </button>
        <button
          type="button"
          onClick={() => setView('history')}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium ${
            view === 'history'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-indigo-200'
          }`}
        >
          <History className="h-4 w-4" />
          Historique par offre
        </button>
      </div>

      {view === 'send' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-5">
            {/* Offre / campagne */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                Offre
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nom de la campagne (optionnel)</label>
                  <input
                    value={libelleCampagne}
                    onChange={(e) => setLibelleCampagne(e.target.value)}
                    placeholder={buildCampaignLabel(poste, reference)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                {[
                  { label: 'Poste / intitulé', value: poste, set: setPoste },
                  { label: 'Type de contrat', value: typeContrat, set: setTypeContrat },
                  { label: 'Date de début', value: dateDebut, set: setDateDebut },
                  { label: 'Lien candidature', value: lien, set: setLien },
                  { label: 'Référence', value: reference, set: setReference },
                ].map(({ label, value, set }) => (
                  <div key={label} className={label === 'Référence' ? 'md:col-span-2' : ''}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <input
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      onBlur={syncMessageFromFields}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={syncMessageFromFields}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-800"
              >
                Regénérer le message depuis les champs
              </button>
            </section>

            {/* Destinataires */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Destinataires ({recipients.length})
              </h3>
              <div
                className="mb-4 cursor-pointer rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center hover:border-indigo-400"
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
                <Upload className="mx-auto h-8 w-8 text-indigo-400" />
                <p className="mt-2 text-sm font-medium">Importer Excel (colonne Numéro / Téléphone)</p>
                {fileName && (
                  <span className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-700">
                    <FileSpreadsheet className="h-4 w-4" /> {fileName}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setExcelRecipients(null); setFileName(null) }}>
                      <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </span>
                )}
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value)
                  if (e.target.value.trim()) { setExcelRecipients(null); setFileName(null) }
                }}
                rows={3}
                placeholder="Ou coller les numéros ici…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-3"
                disabled={!!fileName}
              />
              {recipients.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-50">
                  {recipients.slice(0, 50).map((r, i) => (
                    <div key={i} className="px-3 py-1.5 text-sm text-gray-700 font-mono">
                      {formatNumero(r.numero)}
                    </div>
                  ))}
                  {recipients.length > 50 && (
                    <p className="px-3 py-2 text-xs text-gray-400">+ {recipients.length - 50} autres numéros</p>
                  )}
                </div>
              )}
            </section>

            {/* Message */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Message SMS</h3>
                <span className={`text-xs font-medium ${isOverLimit ? 'text-red-600' : charCount > SMS_MAX_LENGTH - 20 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {charCount}/{SMS_MAX_LENGTH} car.
                  {signatureEnabled && signatureText.trim()
                    ? ` · signature « ${signatureText.trim()} » incluse`
                    : ' · sans signature'}
                </span>
              </div>
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value.slice(0, maxBodyLength))}
                maxLength={maxBodyLength}
                rows={4}
                className={`w-full rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                  isOverLimit ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={signatureEnabled}
                    onChange={(e) => handleSignatureToggle(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Ajouter une signature
                </label>
                {signatureEnabled && (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs text-gray-500 shrink-0">Texte :</span>
                    <input
                      value={signatureText}
                      onChange={(e) => handleSignatureTextChange(e.target.value)}
                      placeholder={DEFAULT_SMS_SIGNATURE}
                      maxLength={SMS_SIGNATURE_MAX}
                      className="flex-1 min-w-0 rounded-md border border-gray-200 px-2 py-1 text-sm bg-white"
                    />
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">
                      ({signatureSuffix.length} car. réservés)
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Format suggéré : « Votre profil peut correspondre : [poste] ([contrat]). Début [date]. Postulez : [lien] – Réf [réf] »
                {signatureEnabled && signatureText.trim()
                  ? ` — la signature « ${signatureText.trim()} » est ajoutée automatiquement à la fin.`
                  : ' — aucune signature ne sera ajoutée.'}
              </p>
              {isOverLimit && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Dépassement de {SMS_MAX_LENGTH} caractères — raccourcissez le message pour envoyer.
                </p>
              )}
              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-gray-700 border border-gray-100">
                <span className="text-xs text-gray-400 block mb-1">Aperçu final envoyé :</span>
                {previewMessage}
              </div>
            </section>

            {/* Envoi */}
            <section className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Numéro test</label>
                  <input
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    placeholder="0612345678"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={!textoConfigured || testSending}
                    onClick={sendTestSms}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-white border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-40"
                  >
                    {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    SMS test
                  </button>
                </div>
              </div>
              {testResult && (
                <p className={`text-sm rounded-lg px-3 py-2 ${testResult.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {testResult.message}
                </p>
              )}
              <div>
                <label className="text-sm text-gray-700">Délai entre envois : {delayMs / 1000}s</label>
                <input type="range" min={1000} max={30000} step={500} value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} className="w-full accent-indigo-600 mt-1" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={recipients.length === 0}
                  onClick={exportExcel}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  Export Excel
                </button>
                <button
                  type="button"
                  disabled={!textoConfigured || campaignSending || recipients.length === 0 || isOverLimit}
                  onClick={sendCampaign}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  {campaignSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  Envoyer {recipients.length} SMS
                </button>
              </div>
              {campaignResult && (
                <p className="text-sm bg-emerald-100 text-emerald-900 rounded-lg px-4 py-3">
                  Terminé : {campaignResult.sent} envoyé(s), {campaignResult.failed} échec(s).
                  <button type="button" className="ml-2 underline" onClick={() => setView('history')}>Voir l&apos;historique</button>
                </p>
              )}
              {!textoConfigured && !textoLoading && (
                <p className="text-xs text-amber-800 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Configurez TEXTO_API_TOKEN pour l&apos;envoi direct.
                </p>
              )}
            </section>
          </div>

          {/* Aperçu */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 mx-auto max-w-[280px]">
              <div className="rounded-[2rem] bg-slate-900 p-3 shadow-2xl">
                <div className="rounded-[1.5rem] bg-slate-100 overflow-hidden">
                  <div className="bg-slate-800 px-4 py-3 text-center">
                    <p className="text-xs text-slate-400">Aperçu</p>
                    <p className="text-sm font-medium text-white truncate">{campaignLabel}</p>
                  </div>
                  <div className="min-h-[280px] p-4 bg-gradient-to-b from-slate-100 to-slate-200">
                    {previewMessage ? (
                      <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-indigo-600 px-3 py-2.5 text-xs text-white whitespace-pre-wrap leading-relaxed">
                        {previewMessage}
                      </div>
                    ) : (
                      <p className="text-center text-xs text-gray-400 mt-16">Rédigez le message…</p>
                    )}
                  </div>
                  <div className="border-t bg-white px-4 py-2 flex justify-between text-[10px] text-gray-400">
                    <span>{charCount}/{SMS_MAX_LENGTH}</span>
                    <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{segmentCount} seg.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Campagnes envoyées</h3>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadHistory()}
                placeholder="Filtrer par entreprise ou réf."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200"
              />
            </div>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              <History className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              Aucune campagne enregistrée.
              <p className="text-xs mt-1 text-gray-400">Exécutez la migration SQL si l&apos;historique reste vide après envoi.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCampaignDetail(c.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{c.libelle}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(c.created_at).toLocaleString('fr-FR')}
                        {c.entreprise && ` · ${c.entreprise}`}
                        {c.reference_offre && ` · ${c.reference_offre}`}
                        {c.pole && ` · ${c.pole}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">{c.sent_count} OK</span>
                      {c.failed_count > 0 && (
                        <span className="text-xs rounded-full bg-red-100 text-red-800 px-2 py-0.5">{c.failed_count} échec</span>
                      )}
                      {expandedId === c.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>
                  {expandedId === c.id && (
                    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-3 border border-gray-100">{c.message}</p>
                      {expandedLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-500 mx-auto" />
                      ) : (
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100 bg-white divide-y divide-gray-50">
                          {expandedEnvois.map((e) => (
                            <div key={e.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                              <span className="font-mono text-gray-700">{formatNumero(e.numero)}</span>
                              {e.success ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <X className="h-4 w-4 text-red-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 flex items-start gap-1">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            Les campagnes sont classées par offre (entreprise, référence, pôle). Cliquez pour voir le message et la liste des numéros.
          </p>
        </div>
      )}
    </div>
  )
}
