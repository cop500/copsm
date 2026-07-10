'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Upload,
  FileSpreadsheet,
  Download,
  Mail,
  CheckCircle2,
  AlertCircle,
  Info,
  Search,
  Trash2,
} from 'lucide-react'
import {
  type EmailContactRow,
  exportEmailContactsExcel,
  parseEmailContactsFile,
} from '@/lib/emailContactsImport'

export default function EmailContactsModule() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<EmailContactRow[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        r.nom.toLowerCase().includes(q) ||
        r.objet.toLowerCase().includes(q)
    )
  }, [rows, search])

  const stats = useMemo(() => {
    const withEmail = rows.filter((r) => r.email.includes('@')).length
    const uniqueEmails = new Set(rows.map((r) => r.email).filter(Boolean)).size
    return { total: rows.length, withEmail, uniqueEmails }
  }, [rows])

  const handleFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const parsed = await parseEmailContactsFile(file)
      setRows(parsed)
      setFileName(file.name)
    } catch (err: unknown) {
      setRows([])
      setFileName('')
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier.')
    } finally {
      setLoading(false)
    }
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  const clear = () => {
    setRows([])
    setFileName('')
    setError(null)
    setSearch('')
  }

  const downloadExcel = () => {
    if (rows.length === 0) return
    const base = fileName.replace(/\.[^.]+$/, '') || 'contacts_email'
    exportEmailContactsExcel(rows, `${base}_organise.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <Mail className="w-8 h-8 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Contacts e-mail (Outlook)</h2>
            <p className="text-gray-600 mt-1 text-sm">
              Importez le fichier CSV reçu depuis Power Automate. COP réorganise les colonnes
              (Nom, Email, Objet) et génère un Excel propre.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-teal-50 border border-teal-100 p-4 text-sm text-teal-900">
          <div className="flex gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <ol className="list-decimal list-inside space-y-1">
              <li>Exécutez votre flux Power Automate « Extraction emails inbox ».</li>
              <li>Ouvrez le mail reçu et téléchargez la pièce jointe <strong>.csv</strong>.</li>
              <li>Importez ce fichier ici, puis téléchargez l&apos;Excel organisé.</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={onFileChange}
        />

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-colors cursor-pointer"
        >
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="font-medium text-gray-800">
            {loading ? 'Lecture en cours…' : 'Glissez le fichier CSV ici ou cliquez pour parcourir'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Formats acceptés : .csv, .xlsx</p>
          {fileName && (
            <p className="text-sm text-teal-700 mt-3 flex items-center justify-center gap-1">
              <FileSpreadsheet className="w-4 h-4" />
              {fileName}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  {stats.total} message(s)
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800">
                  {stats.withEmail} avec e-mail valide
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-800">
                  {stats.uniqueEmails} adresse(s) unique(s)
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Effacer
                </button>
                <button
                  type="button"
                  onClick={downloadExcel}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  <Download className="w-4 h-4" />
                  Télécharger Excel organisé
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Filtrer par nom, e-mail ou objet…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="border border-gray-200 rounded-lg overflow-auto max-h-[480px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Nom</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Objet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.slice(0, 200).map((row, i) => (
                    <tr key={`${row.email}-${row.objet}-${i}`} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-800 whitespace-nowrap">{row.nom || '—'}</td>
                      <td className="px-4 py-2 text-gray-900">{row.email || '—'}</td>
                      <td className="px-4 py-2 text-gray-700">{row.objet || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRows.length > 200 && (
                <p className="text-xs text-gray-500 p-3 border-t bg-gray-50">
                  Aperçu limité à 200 lignes — l&apos;export Excel contient toutes les lignes (
                  {filteredRows.length}).
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
