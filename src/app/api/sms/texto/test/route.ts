import { NextResponse } from 'next/server'
import { isTextoConfigured, sendTextoSms } from '@/lib/texto'
import { verifyAdminFromRequest } from '@/lib/verifyAdminRequest'

export async function POST(request: Request) {
  const auth = await verifyAdminFromRequest(request)
  if (auth.error) return auth.error

  if (!isTextoConfigured()) {
    return NextResponse.json(
      { error: 'Texto non configuré — ajoutez TEXTO_API_TOKEN dans .env.local' },
      { status: 503 }
    )
  }

  let body: { to?: string; message?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const to = body.to?.trim()
  const message = body.message?.trim()
  if (!to || !message) {
    return NextResponse.json({ error: 'Numéro et message requis' }, { status: 400 })
  }

  const result = await sendTextoSms({ to, text: message })

  return NextResponse.json(
    {
      success: result.ok,
      status: result.status,
      response: result.data,
    },
    { status: result.ok ? 200 : 502 }
  )
}
