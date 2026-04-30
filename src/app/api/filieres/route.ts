import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const db = supabaseAdmin ?? supabase
    const { data: filieres, error } = await db
      .from('filieres')
      .select('*')
      .order('nom', { ascending: true })

    if (error) {
      console.error('Erreur récupération filières:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des filières' }, { status: 500 })
    }

    return NextResponse.json(filieres || [])
  } catch (error) {
    console.error('Erreur API filières:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
