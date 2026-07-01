import { NextResponse } from 'next/server'
import { isTextoConfigured, sendTextoSms, sleep } from '@/lib/texto'
import { verifyAdminFromRequest } from '@/lib/verifyAdminRequest'

interface SendItem {
  numero: string
  message: string
  lot?: number
}

export async function POST(request: Request) {
  const auth = await verifyAdminFromRequest(request)
  if (auth.error) return auth.error

  if (!isTextoConfigured()) {
    return NextResponse.json(
      { error: 'Texto non configuré — ajoutez TEXTO_API_TOKEN dans .env.local' },
      { status: 503 }
    )
  }

  let body: { messages?: SendItem[]; delayMs?: number; dryRun?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const messages = body.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Aucun message à envoyer' }, { status: 400 })
  }

  if (messages.length > 500) {
    return NextResponse.json(
      { error: 'Maximum 500 SMS par campagne (réessayez en plusieurs fois)' },
      { status: 400 }
    )
  }

  const delayMs = Math.max(1000, Math.min(body.delayMs ?? 3000, 120000))

  if (body.dryRun) {
    return NextResponse.json({
      dryRun: true,
      count: messages.length,
      delayMs,
      preview: messages.slice(0, 3),
    })
  }

  const results: Array<{
    index: number
    numero: string
    lot?: number
    success: boolean
    status: number
    response: unknown
  }> = []

  let sent = 0
  let failed = 0

  for (let i = 0; i < messages.length; i++) {
    const item = messages[i]
    if (!item.numero?.trim() || !item.message?.trim()) {
      failed++
      results.push({
        index: i,
        numero: item.numero || '',
        lot: item.lot,
        success: false,
        status: 400,
        response: { error: 'Numéro ou message vide' },
      })
      continue
    }

    const result = await sendTextoSms({ to: item.numero, text: item.message })
    if (result.ok) sent++
    else failed++

    results.push({
      index: i,
      numero: item.numero,
      lot: item.lot,
      success: result.ok,
      status: result.status,
      response: result.data,
    })

    if (i < messages.length - 1) {
      await sleep(delayMs)
    }
  }

  return NextResponse.json({
    total: messages.length,
    sent,
    failed,
    delayMs,
    results,
  })
}
