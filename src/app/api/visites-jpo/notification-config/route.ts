import { NextResponse } from 'next/server'
import { getJpoEmailConfig } from '@/lib/email-config'

export async function GET() {
  const config = await getJpoEmailConfig()
  if (!config) {
    return NextResponse.json(
      { error: 'Configuration email JPO introuvable' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  return NextResponse.json(
    {
      id: config.id,
      enabled: config.enabled,
      subject: config.subject,
      message: config.message,
      recipient_emails: config.recipient_emails,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
