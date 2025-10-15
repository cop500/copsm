import emailjs from '@emailjs/browser'
import { getEmailConfig } from './email-config'

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

// Initialiser EmailJS
const EMAILJS_SERVICE_ID = 'service_cop' // À configurer dans EmailJS
const EMAILJS_TEMPLATE_ID = 'template_demande' // À configurer dans EmailJS
const EMAILJS_PUBLIC_KEY = 'bnj9zb9qdXb4RjnvB'

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
    const emailPromises = config.recipient_emails.map(async (recipientEmail) => {
      const templateParams = {
        to_email: recipientEmail,
        subject: config.subject,
        message: emailContent,
        nom_entreprise: demande.nom_entreprise,
        nom_contact: demande.nom_contact || 'Non renseigné',
        email: demande.email || 'Non renseigné',
        telephone: demande.telephone || 'Non renseigné',
        type_demande: demande.type_demande || 'Non renseigné',
        lien: demandeUrl,
      }

      return emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      )
    })

    const results = await Promise.all(emailPromises)
    console.log('✅ Emails envoyés avec succès:', results)
    return { success: true, data: results }
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

    // Envoyer l'email de test à tous les destinataires
    const emailPromises = config.recipient_emails.map(async (recipientEmail) => {
      const templateParams = {
        to_email: recipientEmail,
        subject: `[TEST] ${config.subject}`,
        message: emailContent,
        nom_entreprise: demande.nom_entreprise,
        nom_contact: demande.nom_contact || 'Non renseigné',
        email: demande.email || 'Non renseigné',
        telephone: demande.telephone || 'Non renseigné',
        type_demande: demande.type_demande || 'Non renseigné',
        lien: demandeUrl,
      }

      return emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      )
    })

    const results = await Promise.all(emailPromises)
    console.log('✅ Emails de test envoyés avec succès:', results)
    return { success: true, data: results }
  } catch (error) {
    console.error('❌ Erreur email test:', error)
    throw error
  }
}
