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
    // Utiliser le client Supabase approprié (client ou serveur)
    let client = supabase
    
    // Si on est côté serveur (API route), créer un client serveur
    if (typeof window === 'undefined') {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      client = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }
    
    const { data, error } = await client
      .from('email_notifications_assistance_config')
      .select('*')
      .single()

    if (error) {
      console.error('❌ Erreur récupération config email assistance:', error)
      throw error
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

export const JPO_EMAIL_CONFIG_ID = '00000000-0000-0000-0000-000000000003'

export const DEFAULT_JPO_EMAIL_SUBJECT = 'Nouvelle demande de visite JPO — {etablissement}'

export const DEFAULT_JPO_EMAIL_MESSAGE = `Bonjour,

Une nouvelle demande de visite pour les journées portes ouvertes a été enregistrée.

Établissement : {etablissement}
Contact : {nom_prenom} ({fonction})
Email : {email}
Téléphone : {telephone}
Date : {date_visite}
Créneau : {creneau}
Participants : {nombre_participants}
Accompagnateurs : {nombre_accompagnateurs}

Lien pour confirmer : {lien}

Cordialement,
Notification automatique - Système COP`

export interface JpoEmailConfig {
  id: string
  enabled: boolean
  subject: string
  message: string
  recipient_emails: string[]
  created_at?: string
  updated_at?: string
}

function parseRecipientEmails(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((email) => String(email || '').trim()).filter((email) => email.includes('@'))
  }
  if (typeof value === 'string') {
    try {
      return parseRecipientEmails(JSON.parse(value))
    } catch {
      return []
    }
  }
  return []
}

async function jpoEmailClient() {
  if (typeof window === 'undefined') {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return supabase
}

export async function getJpoEmailConfig(): Promise<JpoEmailConfig | null> {
  try {
    const client = await jpoEmailClient()
    const { data, error } = await client
      .from('email_notifications_jpo_config')
      .select('*')
      .eq('id', JPO_EMAIL_CONFIG_ID)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      id: data.id,
      enabled: Boolean(data.enabled),
      subject: String(data.subject || DEFAULT_JPO_EMAIL_SUBJECT),
      message: String(data.message || DEFAULT_JPO_EMAIL_MESSAGE),
      recipient_emails: parseRecipientEmails(data.recipient_emails),
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Erreur récupération config email JPO:', error)
    return null
  }
}

