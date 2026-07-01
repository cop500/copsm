import { NextResponse } from 'next/server'
import { getTextoConfig, isTextoConfigured } from '@/lib/texto'
import { verifyAdminFromRequest } from '@/lib/verifyAdminRequest'

export async function GET(request: Request) {
  const auth = await verifyAdminFromRequest(request)
  if (auth.error) return auth.error

  const { baseUrl } = getTextoConfig()

  return NextResponse.json({
    provider: 'texto',
    configured: isTextoConfigured(),
    baseUrl,
    endpoint: `${baseUrl}/manage/data/api/send_sms`,
  })
}
