import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { verifyAdminFromRequest } from '@/lib/verifyAdminRequest'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminFromRequest(request)
  if (auth.error) return auth.error

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquant' }, { status: 500 })
  }

  const { id } = await params

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('sms_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
  }

  const { data: envois, error: envoisError } = await supabaseAdmin
    .from('sms_campaign_envois')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: true })

  if (envoisError) {
    return NextResponse.json({ error: envoisError.message }, { status: 500 })
  }

  return NextResponse.json({ campaign, envois: envois ?? [] })
}
