import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: poles, error } = await supabase
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
