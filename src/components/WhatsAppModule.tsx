'use client'

import { useState, useMemo, useRef } from 'react'
import { useRole } from '@/hooks/useRole'
import {
  MessageSquare,
  FileSpreadsheet,
  AlertCircle,
  Info,
  Shuffle,
  Download,
  CheckCircle2,
  Upload,
} from 'lucide-react'
import * as XLSX from 'xlsx'

export interface WhatsAppRecipient {
  numero: string
  prenom?: string
  nom?: string
  pole?: string
  filiere?: string
}

const DEFAULT_COUNTRY_CODE = '+212'
const VARIABLES_PERSONNE = ['{{prenom}}', '{{nom}}', '{{pole}}', '{{filiere}}'] as const
const VARIABLES_OFFRE = ['{{lien_postuler}}', '{{entreprise}}', '{{reference_offre}}', '{{lieu}}', '{{heure}}', '{{pole}}', '{{filiere}}'] as const

// Noms de colonnes acceptés pour l'import Excel
const COL_NUMERO = ['numero', 'numéro', 'telephone', 'téléphone', 'phone', 'tel', 'gsm']
const COL_PRENOM = ['prenom', 'prénom', 'prenoms']
const COL_NOM = ['nom', 'nom_famille']
const COL_POLE = ['pole', 'pôle', 'poles']
const COL_FILIERE = ['filiere', 'filière', 'filières']

function normalizeHeader(h: string) {
  return String(h || '').toLowerCase().trim().replace(/\s+/g, '_')
}

function parseExcelFile(file: File, countryCode: string): Promise<WhatsAppRecipient[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) return resolve([])
        const wb = XLSX.read(data, { type: 'binary' })
        const firstSheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { header: 1 }) as unknown[][]
        if (rows.length < 2) return resolve([])
        const headers = (rows[0] as string[]).map(normalizeHeader)
        const getCol = (candidates: string[]) => {
          const i = headers.findIndex((h) => candidates.some((c) => h.includes(c) || c.includes(h)))
          return i >= 0 ? i : -1
        }
        const iNum = getCol(COL_NUMERO)
        if (iNum < 0) {
          reject(new Error('Colonne "Numéro" ou "Téléphone" introuvable dans l\'Excel.'))
          return
        }
        const iPrenom = getCol(COL_PRENOM)
        const iNom = getCol(COL_NOM)
        const iPole = getCol(COL_POLE)
        const iFiliere = getCol(COL_FILIERE)
        const list: WhatsAppRecipient[] = []
        const prefix = countryCode.replace(/\D/g, '')
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r] as unknown[]
          const rawNum = String(row[iNum] ?? '').trim().replace(/\D/g, '')
          if (rawNum.length < 8) continue
          const numero = rawNum.startsWith('0') ? prefix + rawNum.slice(1) : rawNum.startsWith(prefix) ? rawNum : prefix + rawNum
          list.push({
            numero,
            prenom: iPrenom >= 0 ? String(row[iPrenom] ?? '').trim() || undefined : undefined,
            nom: iNom >= 0 ? String(row[iNom] ?? '').trim() || undefined : undefined,
            pole: iPole >= 0 ? String(row[iPole] ?? '').trim() || undefined : undefined,
            filiere: iFiliere >= 0 ? String(row[iFiliere] ?? '').trim() || undefined : undefined,
          })
        }
        resolve(list)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsBinaryString(file)
  })
}

export default function WhatsAppModule() {
  const { isAdmin, isConseiller } = useRole()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [recipientsFromExcel, setRecipientsFromExcel] = useState<WhatsAppRecipient[] | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [messageTemplate, setMessageTemplate] = useState(
    `Bonjour {{prenom}},\n\nLe COP vous invite à postuler à une offre d'emploi.\n\n*Entreprise :* {{entreprise}}\n*Référence offre :* {{reference_offre}}\n*Lieu :* {{lieu}}\n*Date / heure :* {{heure}}\n\n🔗 Lien pour postuler : {{lien_postuler}}\n\nCordialement,\nL'équipe COP`
  )
  const [lienPostuler, setLienPostuler] = useState('')
  const [entreprise, setEntreprise] = useState('')
  const [referenceOffre, setReferenceOffre] = useState('')
  const [lieu, setLieu] = useState('')
  const [heure, setHeure] = useState('')
  const [pole, setPole] = useState('')
  const [filiere, setFiliere] = useState('')
  const [variations, setVariations] = useState<string[]>(['Merci de nous envoyer votre CV à l\'adresse indiquée.'])
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [pastedNumbersText, setPastedNumbersText] = useState('')
  const [numberOfLots, setNumberOfLots] = useState(3)

  const parsedPastedNumbers = useMemo((): WhatsAppRecipient[] => {
    const lines = pastedNumbersText
      .trim()
      .split(/[\n,;\s]+/)
      .map((s) => s.replace(/\D/g, '').trim())
      .filter((s) => s.length >= 8)
    const prefix = DEFAULT_COUNTRY_CODE.replace(/\D/g, '')
    return lines.map((num) => ({
      numero: num.startsWith('0') ? prefix + num.slice(1) : num.startsWith(prefix) ? num : prefix + num,
    }))
  }, [pastedNumbersText])

  const recipients = useMemo(
    () => (recipientsFromExcel?.length ? recipientsFromExcel : parsedPastedNumbers),
    [recipientsFromExcel, parsedPastedNumbers]
  )

  const getLotIndex = (recipientIndex: number) => recipientIndex % Math.max(1, numberOfLots)

  const buildMessageForLot = (lotIndex: number) => {
    let msg = messageTemplate
      .replace(/\{\{prenom\}\}/g, '')
      .replace(/\{\{nom\}\}/g, '')
      .replace(/\{\{pole\}\}/g, pole || '')
      .replace(/\{\{filiere\}\}/g, filiere || '')
      .replace(/\{\{lien_postuler\}\}/g, lienPostuler || '(à compléter)')
      .replace(/\{\{entreprise\}\}/g, entreprise || '(à compléter)')
      .replace(/\{\{reference_offre\}\}/g, referenceOffre || '(à compléter)')
      .replace(/\{\{lieu\}\}/g, lieu || '(à compléter)')
      .replace(/\{\{heure\}\}/g, heure || '(à compléter)')
    const variation = getVariation(lotIndex)
    const toReplace = variations.find((v) => v && msg.includes(v))
    if (toReplace) {
      msg = msg.replace(toReplace, variation)
    }
    return msg.replace(/\s+/g, ' ').trim()
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const list = await parseExcelFile(file, DEFAULT_COUNTRY_CODE.replace(/\D/g, ''))
      setRecipientsFromExcel(list)
      setFileName(file.name)
      setPastedNumbersText('')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier.')
    }
    e.target.value = ''
  }

  const clearExcel = () => {
    setRecipientsFromExcel(null)
    setFileName(null)
  }

  const clearPaste = () => {
    setPastedNumbersText('')
  }

  const getVariation = (index: number) =>
    variations[index % Math.max(1, variations.length)]

  const buildMessage = (r: WhatsAppRecipient, variationIndex: number) => {
    let msg = messageTemplate
      .replace(/\{\{prenom\}\}/g, r.prenom || '')
      .replace(/\{\{nom\}\}/g, r.nom || '')
      .replace(/\{\{pole\}\}/g, r.pole || '')
      .replace(/\{\{filiere\}\}/g, r.filiere || '')
      .replace(/\{\{lien_postuler\}\}/g, lienPostuler || '(à compléter)')
      .replace(/\{\{entreprise\}\}/g, entreprise || '(à compléter)')
      .replace(/\{\{reference_offre\}\}/g, referenceOffre || '(à compléter)')
      .replace(/\{\{lieu\}\}/g, lieu || '(à compléter)')
      .replace(/\{\{heure\}\}/g, heure || '(à compléter)')
    const variation = getVariation(variationIndex)
    const toReplace = variations.find((v) => v && msg.includes(v))
    if (toReplace) msg = msg.replace(toReplace, variation)
    return msg
  }

  const previewRecipients = useMemo(() => {
    return recipients.slice(0, 5).map((r, i) => {
      const lotIndex = getLotIndex(i)
      const message = buildMessageForLot(lotIndex)
      return { ...r, lot: lotIndex + 1, message }
    })
  }, [recipients, numberOfLots, messageTemplate, variations, lienPostuler, entreprise, referenceOffre, lieu, heure, pole, filiere])

  const exportExcel = () => {
    const data = recipients.map((r, i) => {
      const lotIndex = getLotIndex(i)
      const message = buildMessageForLot(lotIndex)
      return {
        Lot: lotIndex + 1,
        Numéro: DEFAULT_COUNTRY_CODE + r.numero,
        Message: message,
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Destinataires')
    XLSX.writeFile(wb, `COP_WhatsApp_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (!isAdmin && !isConseiller) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
        <p className="text-gray-600">Cette fonctionnalité est réservée aux administrateurs et conseillers COP.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Module WhatsApp Intelligent</h2>
            <p className="text-gray-600 text-sm">
              Message personnalisé et répartition par numéro (pas le même message pour tous) → Excel prêt pour Premium Sender
            </p>
          </div>
        </div>
      </div>

      {/* Étapes */}
          <div className="flex gap-2 mb-6">
        {([1, 2, 3] as const).map((step) => (
          <button
            key={step}
            onClick={() => setActiveStep(step)}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              activeStep === step
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {step === 1 && '1. Importer l\'Excel (numéros)'}
            {step === 2 && '2. Message et répartition'}
            {step === 3 && '3. Générer l\'Excel (Lot, Numéro, Message)'}
          </button>
        ))}
      </div>

      {/* Étape 1: Numéros (Excel ou collage) */}
      {activeStep === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Numéros : importer un Excel ou coller la liste
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Un message par <strong>lot</strong> de numéros (pas de personnalisation par numéro, contrainte WhatsApp). Chaque lot reçoit une variation du message.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Coller les numéros (un par ligne ou séparés par virgule)</label>
            <textarea
              value={pastedNumbersText}
              onChange={(e) => {
                setPastedNumbersText(e.target.value)
                if (e.target.value.trim()) {
                  setRecipientsFromExcel(null)
                  setFileName(null)
                }
              }}
              placeholder="0612345678&#10;0698765432&#10;0611223344"
              rows={6}
              className="w-full border border-gray-300 rounded-lg p-4 font-mono text-sm"
              disabled={!!fileName}
            />
            {parsedPastedNumbers.length > 0 && !fileName && (
              <p className="text-sm text-green-600 mt-1">{parsedPastedNumbers.length} numéro(s) détecté(s) · répartis en lots à l&apos;étape 2</p>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-2">Ou importer un fichier Excel (colonne Numéro / Téléphone)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
          />
          {fileName ? (
            <div className="p-4 border border-green-200 rounded-xl bg-green-50 flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">{fileName} — {recipients.length} numéro(s)</span>
              <button type="button" onClick={clearExcel} className="text-sm text-red-600 hover:underline">
                Changer de fichier
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium border border-gray-300"
            >
              <Upload className="w-5 h-5" />
              Choisir un fichier Excel
            </button>
          )}
        </div>
      )}

      {/* Étape 2: Message et répartition */}
      {activeStep === 2 && (
        <div className="space-y-6">
          {/* Détails de l'offre (remplacent les variables dans le message) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Détails de l&apos;offre (insérés dans le message)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien pour postuler</label>
                <input
                  type="url"
                  value={lienPostuler}
                  onChange={(e) => setLienPostuler(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;entreprise</label>
                <input
                  type="text"
                  value={entreprise}
                  onChange={(e) => setEntreprise(e.target.value)}
                  placeholder="Ex: Société XYZ"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence de l&apos;offre</label>
                <input
                  type="text"
                  value={referenceOffre}
                  onChange={(e) => setReferenceOffre(e.target.value)}
                  placeholder="Ex: OFFRE-2025-01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                <input
                  type="text"
                  value={lieu}
                  onChange={(e) => setLieu(e.target.value)}
                  placeholder="Ex: Casablanca, Tanger"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pôle</label>
                <input
                  type="text"
                  value={pole}
                  onChange={(e) => setPole(e.target.value)}
                  placeholder="Ex: Commerce, Industrie"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
                <input
                  type="text"
                  value={filiere}
                  onChange={(e) => setFiliere(e.target.value)}
                  placeholder="Ex: Vente, Logistique"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date / heure</label>
                <p className="text-xs text-gray-500 mb-1">Précisez : date limite d&apos;envoi des CV ou date/heure de la journée de recrutement (se présenter à cette date).</p>
                <input
                  type="text"
                  value={heure}
                  onChange={(e) => setHeure(e.target.value)}
                  placeholder="Ex: Envoyer les CV avant le 15 janvier 2025 — ou — Journée recrutement le 20 janvier 2025 à 14h"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Message
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Saisissez le message. Utilisez les variables : <code className="bg-gray-100 px-1 rounded">{VARIABLES_OFFRE.join(' ')}</code> (et optionnellement {VARIABLES_PERSONNE.join(' ')}). Une phrase du message sera remplacée par la variante selon le lot.
            </p>
            <textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={8}
              className="w-full border border-gray-300 rounded-lg p-4 text-sm font-mono"
              placeholder="Bonjour, Le COP vous invite à postuler..."
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-green-600" />
              Variantes (une par lot)
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Chaque lot reçoit une variante différente. Ajoutez des variantes puis cliquez sur <strong>Variante</strong> pour en ajouter une autre. La première phrase du message qui correspond à la variante 1 sera remplacée par la variante du lot.
            </p>
            <div className="space-y-2 mb-3">
              {variations.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={v}
                    onChange={(e) => {
                      const next = [...variations]
                      next[i] = e.target.value
                      setVariations(next)
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder={`Variante ${i + 1}`}
                  />
                  {variations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setVariations(variations.filter((_, j) => j !== i))}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setVariations([...variations, ''])}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              <Shuffle className="w-4 h-4" />
              Ajouter une variante
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Répartition en lots</h3>
            <p className="text-sm text-gray-600 mb-4">
              Les numéros sont répartis en lots (rotation 1, 2, …, {numberOfLots}). Chaque lot reçoit une variante du message.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de lots</label>
            <input
              type="number"
              min={1}
              max={20}
              value={numberOfLots}
              onChange={(e) => setNumberOfLots(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Aperçu des variations (message par lot)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Voici le message tel qu&apos;il sera envoyé pour chaque lot (variation différente par lot).
            </p>
            <div className="space-y-3">
              {Array.from({ length: Math.min(numberOfLots, 10) }, (_, lotIndex) => (
                <div key={lotIndex} className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm">
                  <p className="text-gray-600 font-medium mb-2">Lot {lotIndex + 1}</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{buildMessageForLot(lotIndex)}</p>
                </div>
              ))}
            </div>
          </div>

          {previewRecipients.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu (5 premiers numéros, message par lot)</h3>
              <div className="space-y-3">
                {previewRecipients.map((r, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm">
                    <p className="text-gray-500 mb-1">{DEFAULT_COUNTRY_CODE}{r.numero} — Lot {r.lot}</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{r.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Étape 3: Génération Excel (Lot, Numéro, Message) */}
      {activeStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Génération du fichier Excel
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              L&apos;Excel contient <strong>3 colonnes</strong> : <strong>Lot</strong>, <strong>Numéro</strong>, <strong>Message</strong>. Vous pouvez copier-coller le message par lot dans WhatsApp Sender.
            </p>
            <button
              onClick={exportExcel}
              disabled={recipients.length === 0}
              className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Télécharger l&apos;Excel (Lot, Numéro, Message)
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Importez cet Excel dans <strong>WhatsApp Sender</strong> : colonne Lot, Numéro et le texte du message à copier-coller.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
