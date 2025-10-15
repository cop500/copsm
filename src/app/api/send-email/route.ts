import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    // Vérifier que la clé API est configurée
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY non configuré')
      return NextResponse.json(
        { error: 'RESEND_API_KEY non configuré' },
        { status: 500 }
      )
    }

    // Initialiser Resend
    const resend = new Resend(apiKey)
    console.log('✅ Resend initialisé avec la clé API')

    const body = await request.json()
    const { to, subject, text, from } = body

    console.log('📧 Tentative d\'envoi d\'email:', { to, subject, from })

    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, text' },
        { status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL || 'COP System <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
    })

    if (error) {
      console.error('❌ Erreur Resend:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('✅ Email envoyé avec succès:', data)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Erreur API send-email:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
