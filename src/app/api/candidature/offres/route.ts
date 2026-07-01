import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  normalizeOffreCv,
  normalizeOffreEntreprise,
  type OffrePublique,
} from '@/lib/candidatureOffres'

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

    const [{ data: dataEntreprises, error: errorEntreprises }, { data: dataCV, error: errorCV }] =
      await Promise.all([
        supabase
          .from('demandes_entreprises')
          .select('*')
          .in('type_demande', ['cv', 'evenement'])
          .in('statut', ['en_cours', 'en_attente'])
          .order('created_at', { ascending: false }),
        supabase
          .from('demandes_cv')
          .select('*')
          .in('statut', ['en_cours', 'en_attente', 'nouvelle'])
          .order('created_at', { ascending: false }),
      ])

    if (errorEntreprises) {
      console.error('Erreur demandes_entreprises (offres publiques):', errorEntreprises)
    }
    if (errorCV) {
      console.error('Erreur demandes_cv (offres publiques):', errorCV)
    }

    const offres: OffrePublique[] = [
      ...(dataEntreprises || []).map((row) => normalizeOffreEntreprise(row as Record<string, unknown>)),
      ...(dataCV || []).map((row) => normalizeOffreCv(row as Record<string, unknown>)),
    ].sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0
      const db = b.created_at ? new Date(b.created_at).getTime() : 0
      return db - da
    })

    return NextResponse.json(
      { offres },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    console.error('Erreur API candidature/offres:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
