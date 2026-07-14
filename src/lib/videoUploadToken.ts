import { createHmac, timingSafeEqual } from 'crypto'

function secret(): string {
  return (
    process.env.VIDEO_UPLOAD_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) ||
    'cop-video-upload-secret'
  )
}

export function createUploadToken(storagePath: string, cine: string, minutes = 30): string {
  const exp = Date.now() + minutes * 60 * 1000
  const payload = `${storagePath}|${cine}|${exp}`
  const sig = createHmac('sha256', secret()).update(payload).digest('hex')
  return `${exp}.${sig}`
}

export function verifyUploadToken(
  storagePath: string,
  cine: string,
  token: string
): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [expStr, sig] = parts
  const exp = Number(expStr)
  if (!exp || Number.isNaN(exp) || Date.now() > exp) return false
  const payload = `${storagePath}|${cine}|${exp}`
  const expected = createHmac('sha256', secret()).update(payload).digest('hex')
  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}
