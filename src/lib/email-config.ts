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
  created_at: string
  updated_at: string
}

export async function getAssistanceEmailConfig(): Promise<AssistanceEmailConfig | null> {
  try {
    const { data, error } = await supabase
      .from('email_notifications_assistance_config')
      .select('*')
      .single()

    if (error) throw error
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

