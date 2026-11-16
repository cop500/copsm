import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  creneauxChevauchent,
  missionEstPassee,
  normaliserNom,
  normaliserTelephone,
  telephoneMarocValide,
} from '@/lib/missionsAmbassadeurs'

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = client()
    if (!supabase) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }
    const body = await request.json().catch(() => ({}))
    const missionId = typeof body?.mission_id === 'string' ? body.mission_id.trim() : ''
    const nom = typeof body?.nom === 'string' ? body.nom.trim() : ''
    const prenom = typeof body?.prenom === 'string' ? body.prenom.trim() : ''
    const telephone = normaliserTelephone(typeof body?.telephone === 'string' ? body.telephone : '')

    if (!missionId) return NextResponse.json({ error: 'Choisissez une mission.' }, { status: 400 })
    if (!nom || !prenom) {
      return NextResponse.json({ error: 'Saisissez votre nom et votre prénom.' }, { status: 400 })
    }
    if (!telephoneMarocValide(telephone)) {
      return NextResponse.json(
        { error: 'Numéro marocain invalide (ex. 06 12 34 56 78).' },
        { status: 400 }
      )
    }

    const { data: mission, error: mErr } = await supabase
      .from('missions_ambassadeurs')
      .select('id, intitule, date_mission, heure_debut, heure_fin, actif')
      .eq('id', missionId)
      .maybeSingle()
    if (mErr) throw mErr
    if (!mission || !mission.actif) {
      return NextResponse.json({ error: 'Cette mission n’est plus disponible.' }, { status: 404 })
    }
    if (missionEstPassee(mission.date_mission, mission.heure_debut)) {
      return NextResponse.json(
        { error: 'La date et l’heure de cette mission sont passées. La disponibilité n’est plus ouverte.' },
        { status: 400 }
      )
    }

    const { data: stagiaires, error: sErr } = await supabase
      .from('stagiaires')
      .select('id, nom, prenom')
    if (sErr) throw sErr

    const nNom = normaliserNom(nom)
    const nPrenom = normaliserNom(prenom)
    const matches = (stagiaires || []).filter((s) => {
      const sn = normaliserNom(s.nom || '')
      const sp = normaliserNom(s.prenom || '')
      return (sn === nNom && sp === nPrenom) || (sn === nPrenom && sp === nNom)
    })

    if (matches.length === 0) {
      return NextResponse.json(
        { error: 'Nom et prénom introuvables dans la liste des stagiaires ambassadeurs. Merci de contacter le conseiller.' },
        { status: 404 }
      )
    }
    if (matches.length > 1) {
      return NextResponse.json(
        { error: 'Plusieurs profils correspondent. Vérifiez l’orthographe exacte du nom.' },
        { status: 409 }
      )
    }

    const stagiaire = matches[0]

    const { data: deja, error: dejaErr } = await supabase
      .from('missions_ambassadeurs_disponibilites')
      .select('mission_id')
      .eq('stagiaire_id', stagiaire.id)
    if (dejaErr) throw dejaErr
    const autresIds = (deja || []).map((d) => d.mission_id).filter((id) => id !== missionId)
    if (autresIds.length > 0) {
      const { data: autres, error: autresErr } = await supabase
        .from('missions_ambassadeurs')
        .select('id, intitule, date_mission, heure_debut, heure_fin')
        .in('id', autresIds)
      if (autresErr) throw autresErr
      const conflit = (autres || []).find((autre) => creneauxChevauchent(mission, autre))
      if (conflit) {
        return NextResponse.json(
          {
            error: `Vous êtes déjà disponible sur « ${conflit.intitule} » au même créneau. Un stagiaire ne peut candidater qu’à une seule mission au même moment.`,
          },
          { status: 409 }
        )
      }
    }

    const { error: insErr } = await supabase.from('missions_ambassadeurs_disponibilites').insert({
      mission_id: missionId,
      stagiaire_id: stagiaire.id,
      nom: String(stagiaire.nom || nom).trim(),
      prenom: String(stagiaire.prenom || prenom).trim(),
      telephone,
    })
    if (insErr) {
      if (insErr.code === '23505') {
        return NextResponse.json(
          { error: 'Vous avez déjà confirmé votre disponibilité pour cette mission.' },
          { status: 409 }
        )
      }
      throw insErr
    }

    return NextResponse.json({
      ok: true,
      message: `Disponibilité enregistrée pour « ${mission.intitule} ».`,
    })
  } catch (e) {
    console.error('disponibilite mission', e)
    return NextResponse.json({ error: 'Enregistrement impossible. Réessayez.' }, { status: 500 })
  }
}
