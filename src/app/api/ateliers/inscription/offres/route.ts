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

    const [{ data, error }, polesRes, filieresRes] = await Promise.all([
      supabase
        .from('evenements')
        .select(
          'id, titre, description, date_debut, date_fin, capacite_maximale, capacite_actuelle, pole_id, filiere_id, lieu, statut, animateur_nom, animateur_role, created_at'
        )
        .eq('type_evenement', 'atelier')
        .eq('visible_inscription', true)
        .in('statut', ['planifie', 'en_cours'])
        .order('created_at', { ascending: false }),
      supabase.from('poles').select('id, nom'),
      supabase.from('filieres').select('id, nom'),
    ])

    if (error) throw error
    if (polesRes.error) throw polesRes.error
    if (filieresRes.error) throw filieresRes.error

    const poleById = new Map((polesRes.data ?? []).map((p) => [p.id, p.nom]))
    const filiereById = new Map((filieresRes.data ?? []).map((f) => [f.id, f.nom]))

    const ateliers = (data ?? []).map((row) => ({
      ...row,
      pole: row.pole_id ? poleById.get(row.pole_id) ?? null : null,
      filliere: row.filiere_id ? filiereById.get(row.filiere_id) ?? null : null,
    })).sort(function (a, b) {
      const createdDiff =
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (Math.abs(createdDiff) > 24 * 60 * 60 * 1000) return createdDiff
      return new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()
    })

    return NextResponse.json(
      { ateliers },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    )
  } catch (error) {
    console.error('Erreur API ateliers publics:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
