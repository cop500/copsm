import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

function sessionSecret(): string {
  return (
    process.env.FORMATEUR_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) ||
    'cop-formateur-dev-secret-change-me'
  )
}

export async function hashFormateurPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyFormateurPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  const hashBuf = Buffer.from(hash, 'hex')
  if (derived.length !== hashBuf.length) return false
  return timingSafeEqual(derived, hashBuf)
}

export function createFormateurSessionToken(formateurId: string, hours = 12): string {
  const expires = Date.now() + hours * 60 * 60 * 1000
  const payload = `${formateurId}.${expires}`
  const sig = createHmac('sha256', sessionSecret()).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifyFormateurSessionToken(
  token: string | null | undefined
): { formateurId: string } | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [formateurId, expiresStr, sig] = parts
  const expires = Number(expiresStr)
  if (!formateurId || !expires || !sig || Number.isNaN(expires)) return null
  if (Date.now() > expires) return null
  const payload = `${formateurId}.${expiresStr}`
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('hex')
  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return { formateurId }
}

export function formateurSessionCookieName(): string {
  return 'cop_formateur_session'
}

export function parseFormateurCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const name = formateurSessionCookieName()
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}
