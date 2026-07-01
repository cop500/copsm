import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function findDuplicateSameOffer(
  supabase: ReturnType<typeof createClient>,
  body: {
    email: string
    telephone?: string | null
    entreprise_nom?: string
    poste?: string
    demande_entreprise_id?: string | null
    poste_index?: number | null
  }
) {
  const email = normalizeEmail(body.email)
  if (!email) return null

  let query = supabase
    .from('candidatures_stagiaires')
    .select('id, created_at, email')
    .ilike('email', email)
    .order('created_at', { ascending: false })
    .limit(1)

  if (body.demande_entreprise_id) {
    query = query.eq('demande_entreprise_id', body.demande_entreprise_id)
    if (body.poste_index !== undefined && body.poste_index !== null) {
      query = query.eq('poste_index', body.poste_index)
    }
  } else if (body.entreprise_nom && body.poste) {
    query = query.eq('entreprise_nom', body.entreprise_nom).eq('poste', body.poste)
  } else {
    return null
  }

  const { data, error } = await query.maybeSingle()
  if (error || !data) return null
  return data
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const requiredFields = ['nom', 'prenom', 'email', 'cv_url']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        )
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const existing = await findDuplicateSameOffer(supabase, body)
    if (existing) {
      const dateStr = new Date(existing.created_at).toLocaleDateString('fr-FR')
      return NextResponse.json(
        {
          error: 'duplicate',
          message: `Vous avez déjà postulé à cette offre le ${dateStr}. Votre candidature est bien enregistrée.`,
          existing_id: existing.id,
        },
        { status: 409 }
      )
    }

    const candidatureData: Record<string, unknown> = {
      demande_cv_id: body.demande_cv_id || null,
      date_candidature: new Date().toISOString().split('T')[0],
      source_offre: 'Site web',
      statut_candidature: 'envoye',
      cv_url: body.cv_url,
      nom: body.nom,
      prenom: body.prenom,
      email: body.email,
      telephone: body.telephone || null,
      entreprise_nom: body.entreprise_nom || 'À définir',
      poste: body.poste || 'À définir',
      type_contrat: body.type_contrat || 'cv',
      demande_entreprise_id: body.demande_entreprise_id || null,
      poste_index:
        body.poste_index !== undefined && body.poste_index !== null ? body.poste_index : null,
      est_cmc: body.est_cmc !== undefined ? body.est_cmc : null,
      pole_id: body.pole_id || null,
      filiere_id: body.filiere_id || null,
    }

    const { data, error } = await supabase
      .from('candidatures_stagiaires')
      .insert([candidatureData])
      .select()

    if (error) {
      console.error('Erreur insertion candidature:', error)
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement de la candidature: " + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        candidature: data[0],
        message: 'Candidature enregistrée avec succès',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur API candidatures:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
