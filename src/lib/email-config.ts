import { supabase } from '@/lib/supabase'

export interface EmailConfig {
  id: string
  enabled: boolean
  subject: string
  message: string
  recipient_emails: string[]
  created_at: string
  updated_at: string
}

export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const { data, error } = await supabase
      .from('email_notifications_config')
      .select('*')
      .single()

    if (error) throw error
    return data as EmailConfig
  } catch (error) {
    console.error('Erreur récupération config email:', error)
    return null
  }
}

export async function updateEmailConfig(config: Partial<EmailConfig>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('email_notifications_config')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erreur mise à jour config email:', error)
    return false
  }
}

export async function testEmailNotification(): Promise<boolean> {
  try {
    const config = await getEmailConfig()
    if (!config) throw new Error('Configuration non trouvée')

    const { sendTestEmail } = await import('./email')
    
    await sendTestEmail({
      nom_entreprise: 'TEST - Entreprise de test',
      nom_contact: 'TEST - Contact test',
      email: 'test@example.com',
      telephone: '0612345678',
      type_demande: 'CV',
      config
    })

    return true
  } catch (error) {
    console.error('Erreur test email:', error)
    return false
  }
}

// Configuration pour les notifications d'assistance
export interface AssistanceEmailConfig {
  id: string
  enabled: boolean
  subject: string
  message: string
  recipient_emails: Record<string, string> // { "conseiller_id": "email@example.com" }
  created_at: string
  updated_at: string
}

export async function getAssistanceEmailConfig(): Promise<AssistanceEmailConfig | null> {
  try {
    // Si on est côté serveur (API route), utiliser directement Supabase avec service key
    if (typeof window === 'undefined') {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const client = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      const { data, error } = await client
        .from('email_notifications_assistance_config')
        .select('*')
        .single()

      if (error) {
        console.error('❌ Erreur récupération config email assistance:', error)
        return null
      }
      
      // S'assurer que recipient_emails est un objet
      if (data && data.recipient_emails) {
        if (typeof data.recipient_emails === 'string') {
          try {
            data.recipient_emails = JSON.parse(data.recipient_emails)
          } catch (e) {
            console.error('❌ Erreur parsing recipient_emails:', e)
            data.recipient_emails = {}
          }
        }
      }
      
      return data as AssistanceEmailConfig
    } else {
      // Côté client, utiliser l'API route pour contourner RLS
      const response = await fetch('/api/email-config/assistance')
      if (!response.ok) {
        console.error('❌ Erreur récupération config via API:', response.status)
        return null
      }
      const data = await response.json()
      return data as AssistanceEmailConfig
    }
  } catch (error) {
    console.error('Erreur récupération config email assistance:', error)
    return null
  }
}

export async function updateAssistanceEmailConfig(config: Partial<AssistanceEmailConfig>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('email_notifications_assistance_config')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000002')

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erreur mise à jour config email assistance:', error)
    return false
  }
}

