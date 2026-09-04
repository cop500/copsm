import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const VALID_TYPES = ['orientation', 'entreprise', 'autre'] as const
const VALID_GENRES = ['homme', 'femme'] as const
const VALID_NIVEAUX_SCOLAIRES = ['primaire', 'college', 'lycee', 'bachelier', 'universitaire'] as const
const VALID_NIVEAUX_SOUHAITES = [
  'technicien_specialise',
  'technicien',
  'qualification',
  'formation_qualifiante',
] as const

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

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
    const telephone = normalizePhone((body.telephone as string | undefined) ?? '')
    const typeVisite = body.type_visite as string | undefined
    const poleId = (body.pole_id as string | undefined)?.trim() || null
    const niveauScolaire = (body.niveau_scolaire as string | undefined)?.trim() || null
    const niveauSouhaite = (body.niveau_souhaite as string | undefined)?.trim() || null
    const motifAutre = (body.motif_autre as string | undefined)?.trim() || null
    const confirmDuplicate = body.confirm_duplicate === true

    if (!nom || !prenom || !genre || !telephone || !typeVisite) {
      return NextResponse.json(
        { error: 'Veuillez remplir les champs obligatoires.' },
        { status: 400 }
      )
    }

    if (!VALID_GENRES.includes(genre as (typeof VALID_GENRES)[number])) {
      return NextResponse.json({ error: 'Genre invalide.' }, { status: 400 })
    }

    if (!VALID_TYPES.includes(typeVisite as (typeof VALID_TYPES)[number])) {
      return NextResponse.json({ error: 'Type de visite invalide.' }, { status: 400 })
    }

    if (typeVisite === 'orientation' && !poleId) {
      return NextResponse.json(
        { error: "Veuillez choisir un pôle d'intérêt." },
        { status: 400 }
      )
    }

    if (typeVisite === 'orientation' && (!niveauScolaire || !niveauSouhaite)) {
      return NextResponse.json(
        {
          error:
            'Pour une visite orientation, veuillez renseigner le niveau scolaire et le niveau souhaité.',
        },
        { status: 400 }
      )
    }

    if (
      typeVisite === 'orientation' &&
      niveauScolaire &&
      !VALID_NIVEAUX_SCOLAIRES.includes(niveauScolaire as (typeof VALID_NIVEAUX_SCOLAIRES)[number])
    ) {
      return NextResponse.json({ error: 'Niveau scolaire invalide.' }, { status: 400 })
    }

    if (
      typeVisite === 'orientation' &&
      niveauSouhaite &&
      !VALID_NIVEAUX_SOUHAITES.includes(niveauSouhaite as (typeof VALID_NIVEAUX_SOUHAITES)[number])
    ) {
      return NextResponse.json({ error: 'Niveau souhaité invalide.' }, { status: 400 })
    }

    if (typeVisite === 'autre' && !motifAutre) {
      return NextResponse.json(
        { error: "Veuillez préciser l'objet de visite." },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date()
    dayEnd.setHours(23, 59, 59, 999)

    const { data: duplicates, error: duplicateError } = await supabase
      .from('registre_visiteurs')
      .select('id, created_at, nom, prenom')
      .eq('telephone', telephone)
      .gte('created_at', dayStart.toISOString())
      .lte('created_at', dayEnd.toISOString())
      .limit(1)

    if (duplicateError) throw duplicateError

    if (duplicates && duplicates.length > 0 && !confirmDuplicate) {
      return NextResponse.json(
        {
          duplicate: true,
          error:
            "Attention : ce numéro a déjà été enregistré aujourd'hui. Cliquez à nouveau sur Valider pour confirmer.",
        },
        { status: 409 }
      )
    }

    let poleNom: string | null = null
    if (typeVisite === 'orientation' && poleId) {
      const { data: pole } = await supabase.from('poles').select('nom').eq('id', poleId).maybeSingle()
      poleNom = pole?.nom ?? null
    }

    const { error: insertError } = await supabase.from('registre_visiteurs').insert({
      nom,
      prenom,
      genre,
      telephone,
      niveau_scolaire: typeVisite === 'orientation' ? niveauScolaire : null,
      niveau_souhaite: typeVisite === 'orientation' ? niveauSouhaite : null,
      type_visite: typeVisite,
      pole_id: typeVisite === 'orientation' ? poleId : null,
      pole_nom: typeVisite === 'orientation' ? poleNom : null,
      motif_autre: typeVisite === 'autre' ? motifAutre : null,
    })

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      message: 'Votre passage a bien été enregistré. Merci pour votre visite !',
    })
  } catch (error) {
    console.error('Erreur API registre-visiteurs POST:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement. Merci de réessayer." },
      { status: 500 }
    )
  }
}
