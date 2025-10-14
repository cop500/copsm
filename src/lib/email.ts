import { Resend } from 'resend'
import { getEmailConfig } from './email-config'

// Initialiser Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY)

interface DemandeEntreprise {
  id: string
  nom_entreprise: string
  nom_contact?: string
  email?: string
  telephone?: string
  type_demande?: string
  message?: string
}

interface EmailConfig {
  enabled: boolean
  subject: string
  message: string
  recipient_emails: string[]
}

export async function sendNewDemandeNotification(demande: DemandeEntreprise) {
  try {
    // Récupérer la configuration
    const config = await getEmailConfig()
    
    if (!config || !config.enabled) {
      console.log('⚠️ Notifications email désactivées')
      return { success: false, reason: 'notifications_disabled' }
    }

    // Construire le lien vers la demande
    const demandeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/entreprises-gestion?demande=${demande.id}`

    // Remplacer les variables dans le message
    let emailContent = config.message
      .replace('{nom_entreprise}', demande.nom_entreprise)
      .replace('{nom_contact}', demande.nom_contact || 'Non renseigné')
      .replace('{email}', demande.email || 'Non renseigné')
      .replace('{telephone}', demande.telephone || 'Non renseigné')
      .replace('{type_demande}', demande.type_demande || 'Non renseigné')
      .replace('{lien}', demandeUrl)

    // Envoyer l'email à tous les destinataires
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'COP System <onboarding@resend.dev>',
      to: config.recipient_emails,
      subject: config.subject,
      text: emailContent,
    })

    if (error) {
      console.error('❌ Erreur envoi email:', error)
      throw error
    }

    console.log('✅ Email envoyé avec succès:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erreur notification email:', error)
    throw error
  }
}

export async function sendTestEmail(demande: DemandeEntreprise & { config: EmailConfig }) {
  try {
    const { config } = demande
    
    // Construire le lien vers la demande
    const demandeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/entreprises-gestion`

    // Remplacer les variables dans le message
    let emailContent = config.message
      .replace('{nom_entreprise}', demande.nom_entreprise)
      .replace('{nom_contact}', demande.nom_contact || 'Non renseigné')
      .replace('{email}', demande.email || 'Non renseigné')
      .replace('{telephone}', demande.telephone || 'Non renseigné')
      .replace('{type_demande}', demande.type_demande || 'Non renseigné')
      .replace('{lien}', demandeUrl)

    // Envoyer l'email de test
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'COP System <onboarding@resend.dev>',
      to: config.recipient_emails,
      subject: `[TEST] ${config.subject}`,
      text: emailContent,
    })

    if (error) {
      console.error('❌ Erreur envoi email test:', error)
      throw error
    }

    console.log('✅ Email de test envoyé avec succès:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erreur email test:', error)
    throw error
  }
}

