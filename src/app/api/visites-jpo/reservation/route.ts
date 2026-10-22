import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendVisiteJpoStaffNotification } from '@/lib/email'
import {
  CRENEAU_RESERVE_MESSAGE,
  VISITES_JPO_CRENEAUX,
  inscriptionsOuvertes,
  isWeekendDate,
} from '@/lib/visitesJpo'

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  if (!inscriptionsOuvertes()) {
    return NextResponse.json(
      { error: 'Les inscriptions sont closes (date limite : 1er mai 2027 à 23h45).' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const nomPrenom = String(body.nom_prenom || '').trim()
    const telephone = String(body.telephone || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const fonction = String(body.fonction || '').trim()
    const etablissement = String(body.etablissement || '').trim()
    const dateVisite = String(body.date_visite || '').trim()
    const creneau = String(body.creneau || '').trim()
    const nombreParticipants = Number(body.nombre_participants)
    const nombreAccompagnateurs = Number(body.nombre_accompagnateurs)

    if (!nomPrenom || !telephone || !email || !fonction || !etablissement || !dateVisite || !creneau) {
      return NextResponse.json({ error: 'Veuillez remplir tous les champs obligatoires.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }
    if (!VISITES_JPO_CRENEAUX.some((c) => c.id === creneau)) {
      return NextResponse.json({ error: 'Créneau horaire invalide.' }, { status: 400 })
    }
    if (isWeekendDate(dateVisite)) {
      return NextResponse.json({ error: 'Les visites sont possibles du lundi au vendredi.' }, { status: 400 })
    }
    if (!Number.isFinite(nombreParticipants) || nombreParticipants < 1) {
      return NextResponse.json({ error: 'Le nombre de participants doit être au moins 1.' }, { status: 400 })
    }
    if (!Number.isFinite(nombreAccompagnateurs) || nombreAccompagnateurs < 0) {
      return NextResponse.json({ error: 'Le nombre d’accompagnateurs est invalide.' }, { status: 400 })
    }

    const visiteDay = new Date(`${dateVisite}T00:00:00+01:00`)
    const deadlineDay = new Date('2027-05-01T00:00:00+01:00')
    if (visiteDay.getTime() > deadlineDay.getTime()) {
      return NextResponse.json(
        { error: 'La date de visite doit être au plus tard le 1er mai 2027.' },
        { status: 400 }
      )
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (visiteDay.getTime() < today.getTime()) {
      return NextResponse.json({ error: 'Impossible de réserver une date déjà passée.' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('reservations_visites_jpo')
      .select('id')
      .eq('date_visite', dateVisite)
      .eq('creneau', creneau)
      .in('statut', ['en_attente', 'confirmee'])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: CRENEAU_RESERVE_MESSAGE }, { status: 409 })
    }

    const { data, error } = await supabaseAdmin
      .from('reservations_visites_jpo')
      .insert([
        {
          nom_prenom: nomPrenom,
          telephone,
          email,
          fonction,
          etablissement,
          date_visite: dateVisite,
          creneau,
          nombre_participants: Math.round(nombreParticipants),
          nombre_accompagnateurs: Math.round(nombreAccompagnateurs),
          statut: 'en_attente',
        },
      ])
      .select(
        'id, nom_prenom, telephone, email, fonction, etablissement, date_visite, creneau, nombre_participants, nombre_accompagnateurs'
      )
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: CRENEAU_RESERVE_MESSAGE }, { status: 409 })
      }
      throw error
    }

    void sendVisiteJpoStaffNotification(data).catch((emailError) => {
      console.error('⚠️ Erreur email JPO (non bloquant):', emailError)
    })

    return NextResponse.json({
      success: true,
      message:
        'Votre demande a bien été enregistrée. Un conseiller COP confirmera votre rendez-vous.',
      reservation: data,
    })
  } catch (err) {
    console.error('Erreur reservation visite JPO:', err)
    return NextResponse.json({ error: 'Erreur lors de l’enregistrement de la demande.' }, { status: 500 })
  }
}
