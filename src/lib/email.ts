import { Resend } from 'resend'

// Initialiser Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY)

// Liste des emails destinataires
const RECIPIENT_EMAILS = [
  'omar.oumouzoune@ofppt.ma',
  'ABDELHAMID.INAJJAREN@ofppt.ma',
  'SIHAME.ELOMARI@ofppt.ma',
  'IMANE.IDRISSI@ofppt.ma',
  'BADR.IJJAALI@ofppt.ma'
]

interface DemandeEntreprise {
  id: string
  nom_entreprise: string
  nom_contact?: string
  email?: string
  telephone?: string
  type_demande?: string
  message?: string
}

export async function sendNewDemandeNotification(demande: DemandeEntreprise) {
  try {
    // Construire le lien vers la demande
    const demandeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/entreprises-gestion?demande=${demande.id}`

    // Contenu de l'email
    const emailContent = `
Bonjour,

Une nouvelle demande d'entreprise a été enregistrée dans le système COP.

Entreprise : ${demande.nom_entreprise}
${demande.nom_contact ? `Contact : ${demande.nom_contact}` : ''}
${demande.email ? `Email : ${demande.email}` : ''}
${demande.telephone ? `Téléphone : ${demande.telephone}` : ''}
${demande.type_demande ? `Type de demande : ${demande.type_demande}` : ''}

Lien : ${demandeUrl}

Cordialement,
Notification automatique - Système COP
    `.trim()

    // Envoyer l'email à tous les destinataires
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'COP System <onboarding@resend.dev>',
      to: RECIPIENT_EMAILS,
      subject: 'Nouvelle demande entreprise à traiter',
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

