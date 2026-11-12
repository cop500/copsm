export type CompteMailAtelier = 'gmail' | 'professionnel'

export interface BrouillonMailAtelier {
  to?: string
  bcc?: string[]
  subject: string
  body: string
}

function joindreDestinataires(liste: string[]): string {
  return liste.map((e) => e.trim()).filter(Boolean).join(',')
}

/** Gmail web ou Outlook 365 (compte professionnel). Le message part du compte ouvert dans le navigateur. */
export function ouvrirBrouillonMail(compte: CompteMailAtelier, brouillon: BrouillonMailAtelier) {
  const to = (brouillon.to || '').trim()
  const bcc = joindreDestinataires(brouillon.bcc || [])
  const subject = encodeURIComponent(brouillon.subject)
  const body = encodeURIComponent(brouillon.body)

  let url = ''
  if (compte === 'gmail') {
    url = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${subject}&body=${body}`
    if (to) url += `&to=${encodeURIComponent(to)}`
    if (bcc) url += `&bcc=${encodeURIComponent(bcc)}`
  } else {
    url = `https://outlook.office.com/mail/deeplink/compose?subject=${subject}&body=${body}`
    if (to) url += `&to=${encodeURIComponent(to)}`
    if (bcc) url += `&bcc=${encodeURIComponent(bcc)}`
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

export function corpsMailTropLong(body: string): boolean {
  return encodeURIComponent(body).length > 1800
}
