import { getEmailConfig } from './email-config'
import emailjs from '@emailjs/browser'
import emailjsNode from '@emailjs/nodejs'

// Initialiser EmailJS (côté client)
if (typeof window !== 'undefined') {
  emailjs.init('bnj9zb9qdXb4RjnvB')
}

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

// Configuration EmailJS
const EMAILJS_SERVICE_ID = 'service_exp84pb'
const EMAILJS_TEMPLATE_ID = 'template_rjxiwdp' // Template pour demandes entreprises
const EMAILJS_TEMPLATE_ASSISTANCE_ID = 'template_9fbr18k' // Template pour demandes assistance
const EMAILJS_TEMPLATE_CERTIFICAT_ID = 'template_certificat_atelier' // Template pour certificats ateliers (à créer dans EmailJS)
const EMAILJS_PUBLIC_KEY = 'bnj9zb9qdXb4RjnvB'

function formatDemandeEmailText(
  template: string,
  demande: DemandeEntreprise,
  demandeUrl: string
): string {
  const nomEntreprise = (demande.nom_entreprise || '').trim() || 'Non renseigné'
  return template
    .replace(/\{nom_entreprise\}/g, nomEntreprise)
    .replace(/\{nom_contact\}/g, demande.nom_contact || 'Non renseigné')
    .replace(/\{email\}/g, demande.email || 'Non renseigné')
    .replace(/\{telephone\}/g, demande.telephone || 'Non renseigné')
    .replace(/\{type_demande\}/g, demande.type_demande || 'Non renseigné')
    .replace(/\{lien\}/g, demandeUrl)
}

/** Objet avec nom d’entreprise (placeholder ou suffixe pour configs existantes). */
function buildDemandeEmailSubject(
  configSubject: string,
  demande: DemandeEntreprise,
  demandeUrl: string
): string {
  const nomEntreprise = (demande.nom_entreprise || '').trim()
  let subject = formatDemandeEmailText(configSubject, demande, demandeUrl)
  if (nomEntreprise && !subject.includes(nomEntreprise)) {
    subject = `${subject} — ${nomEntreprise}`
  }
  return subject
}

export async function sendNewDemandeNotification(demande: DemandeEntreprise) {
  try {
    console.log('📧 Début envoi notification email...')
    
    // Récupérer la configuration
    const config = await getEmailConfig()
    console.log('📋 Configuration récupérée:', config)
    
    if (!config) {
      console.error('❌ Configuration email non trouvée')
      return { success: false, reason: 'config_not_found' }
    }
    
    if (!config.enabled) {
      console.log('⚠️ Notifications email désactivées')
      return { success: false, reason: 'notifications_disabled' }
    }
    
    if (!config.recipient_emails || config.recipient_emails.length === 0) {
      console.error('❌ Aucun destinataire configuré')
      return { success: false, reason: 'no_recipients' }
    }

    // Construire le lien vers la demande
    const demandeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/entreprises-gestion?demande=${demande.id}`

    const emailContent = formatDemandeEmailText(config.message, demande, demandeUrl)
    const emailSubject = buildDemandeEmailSubject(config.subject, demande, demandeUrl)

    // Envoyer l'email via EmailJS
    console.log('📧 Destinataires configurés:', config.recipient_emails)
    
    const emailPromises = config.recipient_emails.map(async (recipientEmail) => {
      console.log('📧 Envoi vers:', recipientEmail)
      
      const templateParams = {
        email: recipientEmail, // Utiliser 'email' au lieu de 'to_email'
        subject: emailSubject,
        message: emailContent,
        nom_entreprise: demande.nom_entreprise,
        nom_contact: demande.nom_contact || 'Non renseigné',
        email_contact: demande.email || 'Non renseigné', // Renommer pour éviter le conflit
        telephone: demande.telephone || 'Non renseigné',
        type_demande: demande.type_demande || 'Non renseigné',
        lien: demandeUrl,
      }

      console.log('📧 Paramètres EmailJS:', templateParams)

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      )
      
      console.log('📧 Résultat EmailJS pour', recipientEmail, ':', result)
      return result
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

    const emailContent = formatDemandeEmailText(config.message, demande, demandeUrl)
    const emailSubject = buildDemandeEmailSubject(config.subject, demande, demandeUrl)

    // Envoyer l'email de test via EmailJS
    const emailPromises = config.recipient_emails.map(async (recipientEmail) => {
      const templateParams = {
        email: recipientEmail, // Utiliser 'email' au lieu de 'to_email'
        subject: `[TEST] ${emailSubject}`,
        message: emailContent,
        nom_entreprise: demande.nom_entreprise,
        nom_contact: demande.nom_contact || 'Non renseigné',
        email_contact: demande.email || 'Non renseigné', // Renommer pour éviter le conflit
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

interface DemandeAssistance {
  id: string
  nom: string
  prenom: string
  telephone: string
  type_assistance: string
  statut: string
  conseiller_id: string
  profiles?: {
    nom: string
    prenom: string
    email: string
    role: string
  }
  poles?: {
    nom: string
    code: string
  }
  filieres?: {
    nom: string
    code: string
  }
}

export async function sendAssistanceAssignmentNotification(demande: DemandeAssistance) {
  try {
    console.log('📧 ==========================================')
    console.log('📧 DÉBUT ENVOI NOTIFICATION ASSISTANCE')
    console.log('📧 ==========================================')
    console.log('📧 Demande ID:', demande.id)
    console.log('📧 Conseiller ID:', demande.conseiller_id)
    console.log('📧 Stagiaire:', `${demande.prenom} ${demande.nom}`)
    console.log('📧 Profil conseiller:', JSON.stringify(demande.profiles, null, 2))

    // Récupérer la configuration AVANT de vérifier l'email du profil
    // Car l'email peut être configuré manuellement même si le profil n'a pas d'email
    const { getAssistanceEmailConfig } = await import('./email-config')
    const config = await getAssistanceEmailConfig()
    console.log('📋 Configuration récupérée:', config)
    
    if (!config) {
      console.error('❌ Configuration email assistance non trouvée')
      return { success: false, reason: 'config_not_found' }
    }
    
    if (!config.enabled) {
      console.log('⚠️ Notifications email assistance désactivées')
      return { success: false, reason: 'notifications_disabled' }
    }

    // Logs de débogage pour diagnostiquer le problème d'email
    console.log('🔍 DEBUG - Conseiller ID:', demande.conseiller_id)
    console.log('🔍 DEBUG - Email du profil:', demande.profiles?.email || 'Non disponible')
    console.log('🔍 DEBUG - recipient_emails configurés:', JSON.stringify(config.recipient_emails, null, 2))
    console.log('🔍 DEBUG - Type de recipient_emails:', typeof config.recipient_emails)
    
    // Vérifier si recipient_emails est un objet
    let recipientEmailsObj: Record<string, string> = {}
    if (config.recipient_emails) {
      if (typeof config.recipient_emails === 'string') {
        // Si c'est une chaîne JSON, la parser
        try {
          recipientEmailsObj = JSON.parse(config.recipient_emails)
        } catch (e) {
          console.error('❌ Erreur parsing recipient_emails:', e)
          recipientEmailsObj = {}
        }
      } else if (typeof config.recipient_emails === 'object') {
        recipientEmailsObj = config.recipient_emails as Record<string, string>
      }
    }
    
    console.log('🔍 DEBUG - recipient_emails parsé:', JSON.stringify(recipientEmailsObj, null, 2))
    console.log('🔍 DEBUG - Email configuré pour ce conseiller:', recipientEmailsObj[demande.conseiller_id])

    // Utiliser l'email configuré manuellement s'il existe, sinon utiliser l'email du profil
    const emailConfigure = recipientEmailsObj[demande.conseiller_id]
    const emailProfil = demande.profiles?.email
    const conseillerEmail = emailConfigure || emailProfil
    const conseillerNom = demande.profiles ? `${demande.profiles.prenom || ''} ${demande.profiles.nom || ''}`.trim() : 'Conseiller'
    
    console.log('🔍 DEBUG - Email configuré manuellement:', emailConfigure || 'Aucun')
    console.log('🔍 DEBUG - Email du profil:', emailProfil || 'Aucun')
    console.log('🔍 DEBUG - Email final utilisé:', conseillerEmail || 'AUCUN')
    console.log('🔍 DEBUG - Source de l\'email:', emailConfigure ? 'CONFIGURÉ MANUELLEMENT' : (emailProfil ? 'PROFIL' : 'AUCUN'))
    
    // Vérifier que l'email est valide
    if (!conseillerEmail || !conseillerEmail.includes('@')) {
      console.error('❌ Email du conseiller invalide ou non configuré')
      console.error('❌ Email configuré manuellement:', emailConfigure || 'Non configuré')
      console.error('❌ Email du profil:', emailProfil || 'Non disponible')
      console.error('❌ Conseiller ID:', demande.conseiller_id)
      return { success: false, reason: 'invalid_email' }
    }
    
    // Construire le lien vers la demande d'assistance
    const demandeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/assistance-stagiaires/conseiller`

    // Types d'assistance en français
    const typesAssistance: Record<string, string> = {
      orientation: 'Orientation',
      strategie: 'Stratégie de recherche',
      entretiens: 'Préparation entretiens',
      developpement: 'Développement personnel'
    }

    const typeAssistanceLabel = typesAssistance[demande.type_assistance] || demande.type_assistance
    const statutLabel = demande.statut === 'en_attente' ? 'En attente' : demande.statut === 'en_cours' ? 'En cours' : 'Terminée'

    // Remplacer les variables dans le message
    let emailContent = config.message
      .replace('{conseiller_nom}', conseillerNom)
      .replace('{nom_stagiaire}', `${demande.prenom} ${demande.nom}`)
      .replace('{telephone_stagiaire}', demande.telephone)
      .replace('{type_assistance}', typeAssistanceLabel)
      .replace('{statut}', statutLabel)
      .replace('{lien}', demandeUrl)

    console.log('📧 Envoi vers:', conseillerEmail)
    
    const templateParams = {
      to_email: conseillerEmail, // Variable principale pour EmailJS
      email: conseillerEmail, // Variable alternative
      subject: config.subject,
      message: emailContent,
      conseiller_nom: conseillerNom,
      nom_stagiaire: `${demande.prenom} ${demande.nom}`,
      telephone_stagiaire: demande.telephone,
      type_assistance: typeAssistanceLabel,
      statut: statutLabel,
      lien: demandeUrl,
    }

    console.log('📧 Paramètres EmailJS:', templateParams)
    console.log('📧 Service ID:', EMAILJS_SERVICE_ID)
    console.log('📧 Template ID:', EMAILJS_TEMPLATE_ASSISTANCE_ID)
    console.log('📧 Public Key:', EMAILJS_PUBLIC_KEY ? 'Configuré' : 'MANQUANT')

    try {
      let result: unknown
      if (typeof window !== 'undefined') {
        result = await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ASSISTANCE_ID,
          templateParams,
          EMAILJS_PUBLIC_KEY
        )
      } else {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ASSISTANCE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            template_params: templateParams,
          }),
        })
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`EmailJS HTTP ${response.status}: ${text}`)
        }
        result = await response.json()
      }

      console.log('📧 Résultat EmailJS pour', conseillerEmail, ':', JSON.stringify(result, null, 2))
      console.log('✅ Email de notification d\'assignation envoyé avec succès')
      return { success: true, data: result }
    } catch (emailjsError: unknown) {
      const err = emailjsError as { message?: string; status?: number; text?: string; response?: unknown; stack?: string }
      console.error('❌ Erreur EmailJS détaillée:', {
        message: err.message,
        status: err.status,
        text: err.text,
        response: err.response,
        stack: err.stack,
      })
      throw emailjsError
    }
  } catch (error) {
    console.error('❌ Erreur notification email assignation assistance:', error)
    throw error
  }
}

interface CertificatEmailData {
  stagiaire_nom: string
  stagiaire_email: string
  atelier_nom: string
  date_atelier: string
  animateur?: string
  lien_certificat: string
}

/**
 * Envoie un email avec le lien de téléchargement du certificat à un stagiaire
 */
export async function sendCertificatEmail(data: CertificatEmailData) {
  try {
    console.log('📧 ==========================================')
    console.log('📧 DÉBUT ENVOI EMAIL CERTIFICAT')
    console.log('📧 ==========================================')
    console.log('📧 Stagiaire:', data.stagiaire_nom)
    console.log('📧 Email:', data.stagiaire_email)
    console.log('📧 Atelier:', data.atelier_nom)
    console.log('📧 Lien certificat:', data.lien_certificat)

    // Vérifier que l'email est valide
    if (!data.stagiaire_email || !data.stagiaire_email.includes('@')) {
      console.error('❌ Email du stagiaire invalide:', data.stagiaire_email)
      return { success: false, reason: 'invalid_email' }
    }

    // Construire le contenu de l'email
    const emailSubject = `Votre certificat de participation - ${data.atelier_nom}`
    
    // Message HTML pour l'email
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E40AF;">Félicitations ${data.stagiaire_nom} !</h2>
        
        <p>Vous avez participé avec succès à l'atelier :</p>
        <p style="font-weight: bold; color: #FF6D1F; font-size: 18px;">${data.atelier_nom}</p>
        
        ${data.date_atelier ? `<p><strong>Date :</strong> ${data.date_atelier}</p>` : ''}
        ${data.animateur ? `<p><strong>Animateur :</strong> ${data.animateur}</p>` : ''}
        
        <p>Votre certificat de participation est maintenant disponible. Vous pouvez le télécharger en cliquant sur le lien ci-dessous :</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.lien_certificat}" 
             style="background: linear-gradient(to right, #1E40AF, #FF6D1F); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    display: inline-block;">
            Télécharger mon certificat
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px;">
          Vous pourrez télécharger votre certificat autant de fois que nécessaire en utilisant ce lien.
        </p>
        
        <p style="margin-top: 30px;">
          Cordialement,<br>
          L'équipe du Centre d'Orientation Professionnelle CMC SM
        </p>
      </div>
    `

    // Message texte simple (fallback)
    const emailMessageText = `
Félicitations ${data.stagiaire_nom} !

Vous avez participé avec succès à l'atelier : ${data.atelier_nom}

${data.date_atelier ? `Date : ${data.date_atelier}` : ''}
${data.animateur ? `Animateur : ${data.animateur}` : ''}

Votre certificat de participation est maintenant disponible. Vous pouvez le télécharger en cliquant sur le lien suivant :

${data.lien_certificat}

Vous pourrez télécharger votre certificat autant de fois que nécessaire en utilisant ce lien.

Cordialement,
L'équipe du Centre d'Orientation Professionnelle CMC SM
    `

    console.log('📧 Envoi vers:', data.stagiaire_email)
    
    const templateParams = {
      to_email: data.stagiaire_email,
      email: data.stagiaire_email,
      subject: emailSubject,
      message: emailMessage,
      message_text: emailMessageText,
      nom_stagiaire: data.stagiaire_nom,
      atelier_nom: data.atelier_nom,
      date_atelier: data.date_atelier || '',
      animateur: data.animateur || '',
      lien_certificat: data.lien_certificat
    }

    console.log('📧 Paramètres EmailJS:', templateParams)
    console.log('📧 Service ID:', EMAILJS_SERVICE_ID)
    console.log('📧 Template ID:', EMAILJS_TEMPLATE_CERTIFICAT_ID)
    console.log('📧 Public Key:', EMAILJS_PUBLIC_KEY ? 'Configuré' : 'MANQUANT')

    // Utiliser @emailjs/nodejs pour les API routes (côté serveur)
    try {
      const result = await emailjsNode.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_CERTIFICAT_ID,
        templateParams,
        {
          publicKey: EMAILJS_PUBLIC_KEY
        }
      )
      
      console.log('📧 Résultat EmailJS pour', data.stagiaire_email, ':', JSON.stringify(result, null, 2))
      console.log('✅ Email de certificat envoyé avec succès')
      return { success: true, data: result }
    } catch (emailjsError: any) {
      console.error('❌ Erreur EmailJS détaillée:', {
        message: emailjsError.message,
        status: emailjsError.status,
        text: emailjsError.text,
        response: emailjsError.response,
        stack: emailjsError.stack
      })
      throw emailjsError
    }
  } catch (error) {
    console.error('❌ Erreur envoi email certificat:', error)
    throw error
  }
}