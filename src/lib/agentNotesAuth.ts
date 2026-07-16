import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

function sessionSecret(): string {
  return (
    process.env.AGENT_NOTES_SESSION_SECRET ||
    process.env.FORMATEUR_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) ||
    'cop-agent-notes-dev-secret'
  )
}

export async function hashAgentPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyAgentPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  const hashBuf = Buffer.from(hash, 'hex')
  if (derived.length !== hashBuf.length) return false
  return timingSafeEqual(derived, hashBuf)
}

export function createAgentSessionToken(agentId: string, hours = 12): string {
  const expires = Date.now() + hours * 60 * 60 * 1000
  const payload = `${agentId}.${expires}`
  const sig = createHmac('sha256', sessionSecret()).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifyAgentSessionToken(
  token: string | null | undefined
): { agentId: string } | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [agentId, expiresStr, sig] = parts
  const expires = Number(expiresStr)
  if (!agentId || !expires || !sig || Number.isNaN(expires)) return null
  if (Date.now() > expires) return null
  const payload = `${agentId}.${expiresStr}`
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('hex')
  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return { agentId }
}

export function agentSessionCookieName(): string {
  return 'cop_agent_notes_session'
}

export function parseAgentCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const name = agentSessionCookieName()
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}
