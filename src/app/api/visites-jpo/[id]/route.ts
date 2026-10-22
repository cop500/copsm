import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { verifyAdminFromRequest, verifyPlanningStaffFromRequest } from '@/lib/verifyAdminRequest'
import { creneauLabel, creneauToRange, peutValiderVisiteJpo } from '@/lib/visitesJpo'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await verifyPlanningStaffFromRequest(request)
  if (auth.error) return auth.error
  const admin = auth.supabaseAdmin
  if (!admin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const { id } = await Promise.resolve(params)
  const profile = auth.profile as { role?: string; email?: string; nom?: string; prenom?: string }
  const email = profile.email || auth.user.email || ''
  if (!peutValiderVisiteJpo({ ...profile, email })) {
    return NextResponse.json(
      { error: 'Seuls l’administrateur et les conseillers Abdelhamid et Sara peuvent valider les RDV.' },
      { status: 403 }
    )
  }
  const body = await request.json()
  const action = body.action as string

  if (action !== 'confirmer' && action !== 'refuser') {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  }

  const { data: reservation, error: loadError } = await admin
    .from('reservations_visites_jpo')
    .select('*')
    .eq('id', id)
    .single()

  if (loadError || !reservation) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  if (reservation.statut !== 'en_attente') {
    return NextResponse.json({ error: 'Cette demande a déjà été traitée.' }, { status: 400 })
  }

  if (action === 'refuser') {
    const { error } = await admin
      .from('reservations_visites_jpo')
      .update({ statut: 'refusee' })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, statut: 'refusee' })
  }

  const range = creneauToRange(reservation.date_visite, reservation.creneau)
  if (!range) {
    return NextResponse.json({ error: 'Créneau invalide' }, { status: 400 })
  }

  const description = [
    `Établissement : ${reservation.etablissement}`,
    `Contact : ${reservation.nom_prenom} (${reservation.fonction})`,
    `Tél. ${reservation.telephone} — ${reservation.email}`,
    `Participants : ${reservation.nombre_participants} — Accompagnateurs : ${reservation.nombre_accompagnateurs}`,
    `Créneau : ${creneauLabel(reservation.creneau)}`,
  ].join('\n')

  const { data: event, error: eventError } = await admin
    .from('calendrier_collaboratif')
    .insert([
      {
        user_id: auth.user.id,
        titre: `Visite JPO — ${reservation.etablissement}`,
        description,
        date_debut: range.debut,
        date_fin: range.fin,
        couleur: '#0f766e',
        salle: 'Accueil COP — JPO',
      },
    ])
    .select('id')
    .single()

  if (eventError) {
    return NextResponse.json(
      { error: `Confirmation impossible : ${eventError.message}` },
      { status: 500 }
    )
  }

  const { error: updateError } = await admin
    .from('reservations_visites_jpo')
    .update({
      statut: 'confirmee',
      calendrier_event_id: event?.id || null,
      confirme_par: auth.user.id,
      confirme_le: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, statut: 'confirmee' })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await verifyAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const { id } = await Promise.resolve(params)
  const { data: reservation, error: loadError } = await supabaseAdmin
    .from('reservations_visites_jpo')
    .select('id, calendrier_event_id')
    .eq('id', id)
    .single()

  if (loadError || !reservation) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  if (reservation.calendrier_event_id) {
    const { error: eventError } = await supabaseAdmin
      .from('calendrier_collaboratif')
      .delete()
      .eq('id', reservation.calendrier_event_id)
    if (eventError) {
      return NextResponse.json(
        { error: `Suppression du créneau calendrier impossible : ${eventError.message}` },
        { status: 500 }
      )
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from('reservations_visites_jpo')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
