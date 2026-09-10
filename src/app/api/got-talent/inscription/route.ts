import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  GOT_TALENT_CATEGORIES,
  GotTalentActivite,
  GotTalentCategorie,
  normalizePhone,
} from '@/lib/gotTalentConfig'

function isValidCategorie(v: string): v is GotTalentCategorie {
  return GOT_TALENT_CATEGORIES.some((c) => c.id === v)
}

function validateActivites(raw: unknown): GotTalentActivite[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 2) return null

  const parsed: GotTalentActivite[] = []
  const keys = new Set<string>()

  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const categorie = (item as GotTalentActivite).categorie
    const activite = String((item as GotTalentActivite).activite ?? '').trim()
    const autre = String((item as GotTalentActivite).autre ?? '').trim()

    if (!isValidCategorie(categorie) || !activite) return null

    const catConfig = GOT_TALENT_CATEGORIES.find((c) => c.id === categorie)
    if (!catConfig?.activities.includes(activite)) return null

    if (activite === 'Autre' && autre.length < 2) return null

    const key = `${categorie}::${activite === 'Autre' ? autre : activite}`
    if (keys.has(key)) return null
    keys.add(key)

    parsed.push({
      categorie,
      activite,
      ...(activite === 'Autre' ? { autre } : {}),
    })
  }

  return parsed
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
    const nom = String(body.nom ?? '').trim()
    const prenom = String(body.prenom ?? '').trim()
    const pole = String(body.pole ?? '').trim()
    const filliere = String(body.filliere ?? '').trim()
    const groupe = String(body.groupe ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const telephoneRaw = String(body.telephone ?? '').trim()
    const telephone = normalizePhone(telephoneRaw)
    const lieuFait = String(body.lieu_fait ?? '').trim() || null
    const consentement = body.consentement === true
    const activites = validateActivites(body.activites)

    if (!nom || !prenom || !pole || !filliere || !groupe || !email || !telephone) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs obligatoires.' },
        { status: 400 }
      )
    }

    if (!consentement) {
      return NextResponse.json(
        { error: 'Vous devez accepter le consentement éclairé pour vous inscrire.' },
        { status: 400 }
      )
    }

    if (!activites) {
      return NextResponse.json(
        { error: 'Choisissez entre 1 et 2 activités parascolaires.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }

    if (telephone.length < 9) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: byEmail } = await supabase
      .from('inscriptions_got_talent')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    if (byEmail) {
      return NextResponse.json(
        {
          error: 'duplicate_email',
          message: 'Une inscription existe déjà avec cette adresse email.',
        },
        { status: 409 }
      )
    }

    const { data: byPhone } = await supabase
      .from('inscriptions_got_talent')
      .select('id')
      .eq('telephone_normalized', telephone)
      .maybeSingle()

    if (byPhone) {
      return NextResponse.json(
        {
          error: 'duplicate_phone',
          message: 'Une inscription existe déjà avec ce numéro de téléphone.',
        },
        { status: 409 }
      )
    }

    const { data: inserted, error: insertError } = await supabase
      .from('inscriptions_got_talent')
      .insert([
        {
          nom,
          prenom,
          pole,
          filliere,
          groupe,
          telephone: telephoneRaw,
          telephone_normalized: telephone,
          email,
          activites,
          consentement: true,
          lieu_fait: lieuFait,
          date_inscription: new Date().toISOString(),
        },
      ])
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            error: 'duplicate',
            message: 'Vous êtes déjà inscrit (email ou téléphone déjà utilisé).',
          },
          { status: 409 }
        )
      }
      throw insertError
    }

    const reference = inserted?.id
      ? String(inserted.id).replace(/-/g, '').slice(0, 8).toUpperCase()
      : undefined

    return NextResponse.json({
      success: true,
      message: 'Inscription enregistrée avec succès. Merci et bonne participation !',
      reference,
    })
  } catch (error) {
    console.error('Erreur API Got Talent inscription:', error)
    return NextResponse.json({ error: "Erreur lors de l'inscription." }, { status: 500 })
  }
}
