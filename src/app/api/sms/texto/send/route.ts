import { NextResponse } from 'next/server'
import { isTextoConfigured, sendTextoSms, sleep } from '@/lib/texto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { verifyAdminFromRequest } from '@/lib/verifyAdminRequest'

interface SendItem {
  numero: string
  message: string
}

interface CampaignMeta {
  libelle: string
  entreprise?: string
  reference_offre?: string
  pole?: string
  filiere?: string
  lieu?: string
  message: string
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

  let body: {
    messages?: SendItem[]
    delayMs?: number
    dryRun?: boolean
    campaign?: CampaignMeta
  }
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
      success: result.ok,
      status: result.status,
      response: result.data,
    })

    if (i < messages.length - 1) {
      await sleep(delayMs)
    }
  }

  let campaignId: string | null = null

  if (body.campaign && supabaseAdmin && auth.user) {
    const meta = body.campaign
    const { data: campaign, error: insertError } = await supabaseAdmin
      .from('sms_campaigns')
      .insert({
        libelle: meta.libelle,
        entreprise: meta.entreprise || null,
        reference_offre: meta.reference_offre || null,
        pole: meta.pole || null,
        filiere: meta.filiere || null,
        lieu: meta.lieu || null,
        message: meta.message,
        total_count: messages.length,
        sent_count: sent,
        failed_count: failed,
        created_by: auth.user.id,
      })
      .select('id')
      .single()

    if (!insertError && campaign) {
      campaignId = campaign.id
      const envois = results.map((r) => ({
        campaign_id: campaign.id,
        numero: r.numero,
        success: r.success,
        provider_status: r.status,
        provider_response: r.response,
      }))
      await supabaseAdmin.from('sms_campaign_envois').insert(envois)
    }
  }

  return NextResponse.json({
    total: messages.length,
    sent,
    failed,
    delayMs,
    campaignId,
    results,
  })
}
