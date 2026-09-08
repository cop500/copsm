import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const VALID_PROMOTIONS = ['2022-2024', '2023-2025', '2024-2026'] as const
const VALID_GENRES = ['homme', 'femme'] as const
const VALID_TYPES_FORMATION = [
  'passerelle',
  'licence_pro',
  'licence_excellence',
  'cycle_ingenieur',
  'formation_qualifiante',
] as const
const VALID_TYPES_ACTIVITE = ['emploi_salarie', 'travail_independant', 'stage'] as const
const VALID_TYPES_STAGE = ['insertion', 'perfectionnement', 'professionnel', 'autre'] as const

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const body = await request.json()
    const nom = (body.nom as string | undefined)?.trim()
    const prenom = (body.prenom as string | undefined)?.trim()
    const genre = body.genre as string | undefined
    const promotion = body.promotion as string | undefined
    const poleId = (body.pole_id as string | undefined)?.trim()
    const filiereId = (body.filiere_id as string | undefined)?.trim()
    const poursuiteEtudes = body.poursuite_etudes === true
    const enActivite = body.en_activite === true
    const typeFormation = (body.type_formation as string | undefined)?.trim() || null
    const optionSpecialite = (body.option_specialite as string | undefined)?.trim() || null
    const villeFormation = (body.ville_formation as string | undefined)?.trim() || null
    const etablissement = (body.etablissement as string | undefined)?.trim() || null
    const typeActivite = (body.type_activite as string | undefined)?.trim() || null
    const entrepriseNom = (body.entreprise_nom as string | undefined)?.trim() || null
    const posteOccupe = (body.poste_occupe as string | undefined)?.trim() || null
    const brandActivite = (body.brand_activite as string | undefined)?.trim() || null
    const typeStage = (body.type_stage as string | undefined)?.trim() || null
    const organismeNom = (body.organisme_nom as string | undefined)?.trim() || null
    const dureeRemplissage =
      typeof body.duree_remplissage === 'number' && body.duree_remplissage >= 0
        ? Math.floor(body.duree_remplissage)
        : 0

    if (!nom || !prenom || !genre || !promotion) {
      return NextResponse.json(
        {
          error:
            'Veuillez remplir tous les champs obligatoires (nom, prénom, genre, promotion).',
        },
        { status: 400 }
      )
    }

    if (!poleId || !filiereId) {
      return NextResponse.json(
        { error: 'Veuillez sélectionner un pôle et une filière.' },
        { status: 400 }
      )
    }

    if (!VALID_GENRES.includes(genre as (typeof VALID_GENRES)[number])) {
      return NextResponse.json({ error: 'Genre invalide.' }, { status: 400 })
    }

    if (!VALID_PROMOTIONS.includes(promotion as (typeof VALID_PROMOTIONS)[number])) {
      return NextResponse.json({ error: 'Promotion invalide.' }, { status: 400 })
    }

    if (poursuiteEtudes) {
      if (!typeFormation || !optionSpecialite || !villeFormation || !etablissement) {
        return NextResponse.json(
          { error: "Veuillez remplir tous les champs de poursuite d'études." },
          { status: 400 }
        )
      }
      if (!VALID_TYPES_FORMATION.includes(typeFormation as (typeof VALID_TYPES_FORMATION)[number])) {
        return NextResponse.json({ error: 'Type de formation invalide.' }, { status: 400 })
      }
    }

    if (enActivite) {
      if (!typeActivite) {
        return NextResponse.json(
          { error: "Veuillez sélectionner un type d'activité." },
          { status: 400 }
        )
      }
      if (!VALID_TYPES_ACTIVITE.includes(typeActivite as (typeof VALID_TYPES_ACTIVITE)[number])) {
        return NextResponse.json({ error: "Type d'activité invalide." }, { status: 400 })
      }
      if (typeActivite === 'emploi_salarie' && (!entrepriseNom || !posteOccupe)) {
        return NextResponse.json(
          { error: "Veuillez remplir les informations de l'emploi." },
          { status: 400 }
        )
      }
      if (typeActivite === 'travail_independant' && !brandActivite) {
        return NextResponse.json(
          { error: 'Veuillez remplir le nom de votre activité.' },
          { status: 400 }
        )
      }
      if (typeActivite === 'stage') {
        if (!typeStage || !organismeNom) {
          return NextResponse.json(
            { error: 'Veuillez remplir les informations du stage.' },
            { status: 400 }
          )
        }
        if (!VALID_TYPES_STAGE.includes(typeStage as (typeof VALID_TYPES_STAGE)[number])) {
          return NextResponse.json({ error: 'Type de stage invalide.' }, { status: 400 })
        }
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const [{ data: pole }, { data: filiere }] = await Promise.all([
      supabase.from('poles').select('nom').eq('id', poleId).maybeSingle(),
      supabase.from('filieres').select('nom').eq('id', filiereId).maybeSingle(),
    ])

    const { error: insertError } = await supabase.from('enquete_reponses').insert({
      nom,
      prenom,
      genre,
      promotion,
      pole_id: poleId,
      pole_nom: pole?.nom ?? null,
      filiere_id: filiereId,
      filiere_nom: filiere?.nom ?? null,
      poursuite_etudes: poursuiteEtudes,
      type_formation: poursuiteEtudes ? typeFormation : null,
      option_specialite: poursuiteEtudes ? optionSpecialite : null,
      ville_formation: poursuiteEtudes ? villeFormation : null,
      etablissement: poursuiteEtudes ? etablissement : null,
      en_activite: enActivite,
      type_activite: enActivite ? typeActivite : null,
      entreprise_nom: typeActivite === 'emploi_salarie' ? entrepriseNom : null,
      poste_occupe: typeActivite === 'emploi_salarie' ? posteOccupe : null,
      brand_activite: typeActivite === 'travail_independant' ? brandActivite : null,
      type_stage: typeActivite === 'stage' ? typeStage : null,
      organisme_nom: typeActivite === 'stage' ? organismeNom : null,
      duree_remplissage: dureeRemplissage,
    })

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      message: 'Votre réponse a été enregistrée avec succès. Merci pour votre participation !',
    })
  } catch (error) {
    console.error('Erreur API enquete-insertion POST:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la soumission. Merci de réessayer.' },
      { status: 500 }
    )
  }
}
