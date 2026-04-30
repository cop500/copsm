import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const db = supabaseAdmin ?? supabase
    const { data: poles, error } = await db
      .from('poles')
      .select('*')
      .order('nom', { ascending: true })

    if (error) {
      console.error('Erreur récupération pôles:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des pôles' }, { status: 500 })
    }

    return NextResponse.json(poles || [])
  } catch (error) {
    console.error('Erreur API pôles:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
