import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_ASSISTANCE_EMAIL_MESSAGE } from '@/lib/email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const DEFAULT_CONFIG = {
  enabled: true,
  subject: "Nouvelle demande d'assistance vous a été assignée",
  message: DEFAULT_ASSISTANCE_EMAIL_MESSAGE,
  recipient_emails: {} as Record<string, string>,
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('email_notifications_assistance_config')
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(DEFAULT_CONFIG)
      }
      throw error
    }

    if (data?.recipient_emails) {
      if (typeof data.recipient_emails === 'string') {
        try {
          data.recipient_emails = JSON.parse(data.recipient_emails)
        } catch {
          data.recipient_emails = {}
        }
      }
    }

    if (!data.message?.trim()) {
      data.message = DEFAULT_ASSISTANCE_EMAIL_MESSAGE
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur récupération config email assistance:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la configuration' },
      { status: 500 }
    )
  }
}
