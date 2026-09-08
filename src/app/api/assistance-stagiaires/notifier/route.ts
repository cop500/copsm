import { NextRequest, NextResponse } from 'next/server'
import { sendAssistanceAssignmentNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const required = ['id', 'nom', 'prenom', 'telephone', 'type_assistance', 'conseiller_id', 'profiles']
    const missing = required.filter((field) => !body[field])
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Champs manquants: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    const result = await sendAssistanceAssignmentNotification({
      id: String(body.id),
      nom: String(body.nom).trim(),
      prenom: String(body.prenom).trim(),
      telephone: String(body.telephone).trim(),
      type_assistance: String(body.type_assistance),
      statut: String(body.statut || 'en_attente'),
      conseiller_id: String(body.conseiller_id),
      profiles: body.profiles,
      poles: body.poles,
      filieres: body.filieres,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 422 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur API assistance-stagiaires/notifier:', error)
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'envoi de la notification email." },
      { status: 500 }
    )
  }
}
