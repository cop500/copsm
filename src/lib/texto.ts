export interface TextoSendResult {
  ok: boolean
  status: number
  data: unknown
  raw?: string
}

export function getTextoConfig() {
  return {
    baseUrl: (process.env.TEXTO_BASE_URL || 'https://texto.ma').replace(/\/$/, ''),
    token: process.env.TEXTO_API_TOKEN || '',
  }
}

export function isTextoConfigured(): boolean {
  return Boolean(getTextoConfig().token)
}

/** Format attendu par Texto : 212612345678 (sans +) */
export function formatPhoneForTexto(numero: string): string {
  let digits = numero.replace(/\D/g, '')
  if (digits.startsWith('212')) return digits
  if (digits.startsWith('0')) return `212${digits.slice(1)}`
  if (digits.length >= 9) return `212${digits}`
  return digits
}

/** special_char=1 si accents / caractères étendus (Unicode) */
export function detectSpecialChar(text: string): 0 | 1 {
  return /[^\u0000-\u007F]/.test(text) ? 1 : 0
}

export async function sendTextoSms(options: {
  to: string
  text: string
  specialChar?: 0 | 1
}): Promise<TextoSendResult> {
  const { baseUrl, token } = getTextoConfig()
  if (!token) {
    return {
      ok: false,
      status: 500,
      data: { error: 'TEXTO_API_TOKEN non configuré sur le serveur' },
    }
  }

  const url = `${baseUrl}/manage/data/api/send_sms`
  const body = new URLSearchParams()
  body.set('token', token)
  body.set('to', formatPhoneForTexto(options.to))
  body.set('text', options.text)
  body.set(
    'special_char',
    String(options.specialChar ?? detectSpecialChar(options.text))
  )

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const raw = await response.text()
  let data: unknown = raw
  try {
    data = JSON.parse(raw)
  } catch {
    // réponse texte brute
  }

  const payload = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null
  const hasApiError =
    payload &&
    (payload.error === true ||
      payload.status === 'error' ||
      (typeof payload.message === 'string' && payload.message.toLowerCase().includes('error')))

  return {
    ok: response.ok && !hasApiError,
    status: response.status,
    data,
    raw,
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
