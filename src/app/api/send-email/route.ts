import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, text, from } = body

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
      console.error('Erreur Resend:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Erreur API send-email:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
