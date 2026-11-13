import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase
      .from('stagiaires')
      .select('id, prenom, nom, poles(nom), filieres(nom)')
      .order('nom', { ascending: true })
    if (error) throw error

    const nomRel = (rel: unknown): string => {
      if (!rel) return ''
      if (Array.isArray(rel)) return String(rel[0]?.nom || '').trim()
      return String((rel as { nom?: string }).nom || '').trim()
    }

    const ambassadeurs = (data || [])
      .map((row: any) => ({
        id: row.id,
        nom: String(row.nom || '').trim(),
        prenom: String(row.prenom || '').trim(),
        pole: nomRel(row.poles),
        filiere: nomRel(row.filieres),
      }))
      .filter((row) => row.nom || row.prenom)

    return NextResponse.json({ ambassadeurs })
  } catch (e) {
    console.error('liste ambassadeurs publique', e)
    return NextResponse.json({ error: 'Impossible de charger la liste.' }, { status: 500 })
  }
}
