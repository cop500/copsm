import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CONSEILLERS_AUTORISES = [
  'ABDELHAMID INAJJAREN',
  'SIHAM EL OMARI',
  'IMANE IDRISSI',
  'SARA HANZAZE',
]

function matchConseillerAutorise(prenom: string, nom: string): boolean {
  const nomComplet = `${prenom} ${nom}`.toUpperCase()
  return CONSEILLERS_AUTORISES.some(
    (autorise) =>
      nomComplet.includes(autorise) || autorise.includes(nomComplet)
  )
}

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

    const [polesRes, filieresRes, conseillersRes] = await Promise.all([
      supabase.from('poles').select('id, nom, code').eq('actif', true).order('nom'),
      supabase.from('filieres').select('id, nom, code, pole_id').eq('actif', true).order('nom'),
      supabase
        .from('profiles')
        .select('id, nom, prenom, email, role, telephone, poste')
        .in('role', ['conseiller_cop', 'conseillere_carriere'])
        .eq('actif', true)
        .order('nom'),
    ])

    if (polesRes.error) throw polesRes.error
    if (filieresRes.error) throw filieresRes.error
    if (conseillersRes.error) throw conseillersRes.error

    const conseillers = (conseillersRes.data ?? []).filter((c) =>
      matchConseillerAutorise(c.prenom ?? '', c.nom ?? '')
    )

    return NextResponse.json(
      {
        poles: polesRes.data ?? [],
        filieres: filieresRes.data ?? [],
        conseillers,
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      }
    )
  } catch (error) {
    console.error('Erreur API assistance-stagiaires/referentiels:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
