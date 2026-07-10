import * as XLSX from 'xlsx'

export interface EmailContactRow {
  nom: string
  email: string
  objet: string
  dateRecu: string
}

/** Formate une date ISO ou texte Power Automate en affichage français. */
export function formatDateReceived(raw: unknown): string {
  const s = String(raw ?? '').trim()
  if (!s) return ''

  const iso = new Date(s)
  if (!Number.isNaN(iso.getTime()) && s.includes('-')) {
    return iso.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return s
}

function normalizeHeader(h: string): string {
  return String(h || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader)
  for (const c of candidates) {
    const idx = normalized.findIndex((h) => h === c || h.includes(c))
    if (idx >= 0) return idx
  }
  return -1
}

/** Extrait nom + adresse depuis le champ « De » Outlook / Power Automate. */
export function parseFromValue(raw: unknown): { nom: string; email: string } {
  const s = String(raw ?? '').trim()
  if (!s) return { nom: '', email: '' }

  if (s.startsWith('{')) {
    try {
      const obj = JSON.parse(s) as Record<string, unknown>
      const emailAddress = obj.emailAddress as Record<string, string> | undefined
      const addr =
        emailAddress?.address ||
        (obj.address as string) ||
        (obj.Address as string) ||
        ''
      const name =
        emailAddress?.name ||
        (obj.name as string) ||
        (obj.Name as string) ||
        ''
      if (addr) return { nom: String(name).trim(), email: String(addr).trim() }
    } catch {
      /* format texte ci-dessous */
    }
  }

  const angleMatch = s.match(/^(.+?)\s*<([^>]+@[^>]+)>$/)
  if (angleMatch) {
    const nom = angleMatch[1].trim().replace(/^["']|["']$/g, '')
    return { nom, email: angleMatch[2].trim().toLowerCase() }
  }

  const emailInText = s.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)
  if (emailInText) {
    const email = emailInText[0].toLowerCase()
    const nom = s
      .replace(emailInText[0], '')
      .replace(/[<>"]/g, '')
      .trim()
    return { nom, email }
  }

  if (s.includes('@')) return { nom: '', email: s.toLowerCase() }
  return { nom: s, email: '' }
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

function detectDelimiter(headerLine: string): string {
  const commas = (headerLine.match(/,/g) || []).length
  const semicolons = (headerLine.match(/;/g) || []).length
  return semicolons > commas ? ';' : ','
}

function rowsFromRawCsv(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, '')
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const delimiter = detectDelimiter(lines[0])
  const headers = parseCsvLine(lines[0], delimiter)
  const rows: string[][] = [headers]

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i], delimiter)
    if (cells.every((c) => !c)) continue
    rows.push(cells)
  }
  return rows
}

async function readSheetRows(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer()
  const isCsv = file.name.toLowerCase().endsWith('.csv')
  const workbook = XLSX.read(buffer, {
    type: 'array',
    raw: false,
    ...(isCsv ? { FS: ',', RS: '\n' } : {}),
  })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })
  return rows.map((r) => r.map(String))
}

function mapRowsToContacts(rows: string[][]): EmailContactRow[] {
  if (rows.length < 2) {
    throw new Error('Le fichier doit contenir au moins une ligne de données.')
  }

  const headers = rows[0].map(String)
  let emailCol = findColumn(headers, ['email', 'adresse', 'from', 'de', 'expediteur'])
  let objetCol = findColumn(headers, ['objet', 'subject', 'sujet'])
  let dateCol = findColumn(headers, ['date', 'daterecu', 'received', 'reception', 'receiveddatetime'])
  let nomCol = findColumn(headers, ['nom', 'name', 'expediteur'])

  // Fichier sans en-têtes reconnaissables : colonnes brutes
  if (emailCol < 0 && objetCol < 0 && rows[0].length >= 2) {
    emailCol = 0
    objetCol = 1
    if (rows[0].length >= 3) dateCol = 2
    const dataRows = rows
    return dataRows
      .map((row) => {
        const from = parseFromValue(row[emailCol])
        return {
          nom: from.nom,
          email: from.email,
          objet: String(row[objetCol] ?? '').trim(),
          dateRecu: dateCol >= 0 ? formatDateReceived(row[dateCol]) : '',
        }
      })
      .filter((r) => r.email || r.objet)
  }

  if (emailCol < 0) {
    throw new Error(
      'Colonne « Email » introuvable. Vérifiez que le fichier provient bien de Power Automate (colonnes Email + Objet).'
    )
  }

  const dataRows = rows.slice(1)
  const result: EmailContactRow[] = []

  for (const row of dataRows) {
    const emailCell = row[emailCol]
    const from = parseFromValue(emailCell)
    const nom =
      nomCol >= 0 && nomCol !== emailCol
        ? String(row[nomCol] ?? '').trim()
        : from.nom
    const email = from.email || String(emailCell ?? '').trim().toLowerCase()
    const objet =
      objetCol >= 0 ? String(row[objetCol] ?? '').trim() : ''

    if (!email && !objet && !nom) continue

    result.push({
      nom,
      email,
      objet,
      dateRecu: dateCol >= 0 ? formatDateReceived(row[dateCol]) : '',
    })
  }

  if (result.length === 0) {
    throw new Error('Aucune ligne valide trouvée dans le fichier.')
  }

  return result
}

export async function parseEmailContactsFile(file: File): Promise<EmailContactRow[]> {
  const isCsv = file.name.toLowerCase().endsWith('.csv')

  if (isCsv) {
    const text = await file.text()
    const csvRows = rowsFromRawCsv(text)
    if (csvRows.length >= 2) {
      try {
        return mapRowsToContacts(csvRows)
      } catch {
        /* repli XLSX ci-dessous */
      }
    }
  }

  const xlsxRows = await readSheetRows(file)
  return mapRowsToContacts(xlsxRows)
}

export function exportEmailContactsExcel(rows: EmailContactRow[], fileName?: string): void {
  const data = rows.map((r) => ({
    Nom: r.nom,
    Email: r.email,
    Objet: r.objet,
    'Date reçue': r.dateRecu,
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 28 }, { wch: 36 }, { wch: 55 }, { wch: 18 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Contacts email')

  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, fileName || `contacts_email_${date}.xlsx`)
}
