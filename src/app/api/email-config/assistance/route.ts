import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('email_notifications_assistance_config')
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucune ligne trouvée, retourner les valeurs par défaut
        return NextResponse.json({
          enabled: true,
          subject: 'Nouvelle demande d\'assistance vous a été assignée',
          message: 'Bonjour {conseiller_nom},\n\nUne nouvelle demande d\'assistance vous a été assignée dans le système COP.\n\nDétails de la demande :\n- Stagiaire : {nom_stagiaire}\n- Téléphone : {telephone_stagiaire}\n- Type d\'assistance : {type_assistance}\n- Statut : {statut}\n\nLien pour accéder à la demande : {lien}\n\nCordialement,\nNotification automatique - Système COP',
          recipient_emails: {}
        })
      }
      throw error
    }

    // S'assurer que recipient_emails est un objet
    if (data && data.recipient_emails) {
      if (typeof data.recipient_emails === 'string') {
        try {
          data.recipient_emails = JSON.parse(data.recipient_emails)
        } catch (e) {
          data.recipient_emails = {}
        }
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Erreur récupération config email assistance:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la configuration' },
      { status: 500 }
    )
  }
}

