import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { verifyAdminFromRequest } from '@/lib/verifyAdminRequest'

export async function GET(request: Request) {
  const auth = await verifyAdminFromRequest(request)
  if (auth.error) return auth.error

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquant' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const entreprise = searchParams.get('entreprise')?.trim()
  const reference = searchParams.get('reference')?.trim()

  let query = supabaseAdmin
    .from('sms_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (entreprise) query = query.ilike('entreprise', `%${entreprise}%`)
  else if (reference) query = query.ilike('reference_offre', `%${reference}%`)
  else if (searchParams.get('q')?.trim()) {
    const q = searchParams.get('q')!.trim()
    query = query.or(`entreprise.ilike.%${q}%,reference_offre.ilike.%${q}%,libelle.ilike.%${q}%,pole.ilike.%${q}%`)
  }

  const { data, error } = await query

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({
        campaigns: [],
        warning: 'Table sms_campaigns absente — exécutez la migration Supabase.',
      })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ campaigns: data ?? [] })
}
