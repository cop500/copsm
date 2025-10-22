import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données requises
    const requiredFields = ['nom', 'prenom', 'email', 'pole_id', 'filiere_id', 'demande_cv_id', 'cv_url']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        )
      }
    }

    // Préparer les données pour l'insertion
    const candidatureData = {
      demande_cv_id: body.demande_cv_id,
      date_candidature: new Date().toISOString().split('T')[0],
      source_offre: 'Site web',
      statut_candidature: 'envoye',
      cv_url: body.cv_url,
      nom: body.nom,
      prenom: body.prenom,
      email: body.email,
      telephone: body.telephone || null,
      pole_id: body.pole_id,
      filiere_id: body.filiere_id,
      entreprise_nom: body.entreprise_nom || 'À définir',
      poste: body.poste || 'À définir',
      type_contrat: body.type_contrat || 'À définir',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insérer la candidature en utilisant le service role (contourne RLS)
    const { data, error } = await supabase
      .from('candidatures_stagiaires')
      .insert([candidatureData])
      .select()

    if (error) {
      console.error('Erreur insertion candidature:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement de la candidature' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        candidature: data[0],
        message: 'Candidature enregistrée avec succès'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erreur API candidatures:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
