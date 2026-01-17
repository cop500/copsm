'use client'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { supabase } from '@/lib/supabase'

interface CertificatData {
  nom: string
  atelier: string
  date: string
  animateur?: string
  dateCertificat?: string
}

interface CertificatTemplate {
  id: string
  nom: string
  template_html: string
  styles_css: string
  active: boolean
}

/**
 * Charge le template de certificat actif depuis la base de données
 */
export async function loadActiveTemplate(): Promise<CertificatTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('certificat_templates')
      .select('*')
      .eq('active', true)
      .single()

    if (error) {
      console.error('Erreur chargement template:', error)
      return null
    }

    return (data as unknown) as CertificatTemplate | null
  } catch (error) {
    console.error('Erreur chargement template:', error)
    return null
  }
}

/**
 * Remplaçe les variables dans le template HTML
 */
function replaceTemplateVariables(template: string, data: CertificatData, signataire?: string): string {
  let result = template
  
  result = result.replace(/\{\{nom\}\}/g, data.nom || '')
  result = result.replace(/\{\{atelier\}\}/g, data.atelier || '')
  result = result.replace(/\{\{date\}\}/g, data.date || '')
  result = result.replace(/\{\{animateur\}\}/g, data.animateur || '')
  result = result.replace(/\{\{date_certificat\}\}/g, data.dateCertificat || new Date().toLocaleDateString('fr-FR'))
  
  // Remplacer {{signataire}} si présent dans le template
  if (signataire) {
    result = result.replace(/\{\{signataire\}\}/g, signataire)
  }
  
  return result
}

/**
 * Génère un certificat PDF professionnel
 */
export async function generateCertificatPDF(
  inscription: {
    stagiaire_nom: string
    certificat_token?: string
  },
  atelier: {
    titre: string
    date_debut?: string
    animateur_nom?: string
  }
): Promise<jsPDF | null> {
  try {
    // Charger le template actif
    const template = await loadActiveTemplate()
    
    if (!template) {
      console.error('Aucun template actif trouvé')
      // Utiliser un template par défaut
      return generateDefaultCertificatPDF(inscription, atelier)
    }

    // Préparer les données pour le template
    const data: CertificatData = {
      nom: inscription.stagiaire_nom,
      atelier: atelier.titre,
      date: atelier.date_debut 
        ? new Date(atelier.date_debut).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })
        : '',
      animateur: atelier.animateur_nom || '',
      dateCertificat: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }

    // Extraire le signataire, logo, cachet et numéro du template HTML si présents
    const signataireMatch = template.template_html.match(/signature[^>]*>([^<]+)<\/p>/)
    const signataire = signataireMatch && !signataireMatch[1].includes('{{') 
      ? signataireMatch[1].trim() 
      : 'Le Directeur'
    
    // Remplacer les variables dans le template HTML
    let htmlContent = template.template_html
    htmlContent = replaceTemplateVariables(htmlContent, data, signataire)
    
    // Créer un élément HTML temporaire avec le template et les styles
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'fixed'
    tempDiv.style.left = '0'
    tempDiv.style.top = '0'
    tempDiv.style.width = '1122px' // 297mm en pixels à 96 DPI (297 * 3.78)
    tempDiv.style.height = '794px' // 210mm en pixels à 96 DPI (210 * 3.78)
    tempDiv.style.padding = '0'
    tempDiv.style.margin = '0'
    tempDiv.style.overflow = 'hidden'
    tempDiv.style.backgroundColor = '#ffffff'
    tempDiv.style.zIndex = '99999'
    
    // Créer un élément style pour injecter le CSS
    const styleElement = document.createElement('style')
    styleElement.textContent = template.styles_css
    
    // Créer un wrapper pour le contenu HTML avec les dimensions correctes
    const wrapperDiv = document.createElement('div')
    wrapperDiv.innerHTML = htmlContent
    wrapperDiv.style.width = '100%'
    wrapperDiv.style.height = '100%'
    wrapperDiv.style.position = 'relative'
    
    // Ajouter le style et le contenu au div temporaire
    tempDiv.appendChild(styleElement)
    tempDiv.appendChild(wrapperDiv)
    
    // Ajouter au DOM pour que les styles soient appliqués
    document.body.appendChild(tempDiv)
    
    // Attendre que les images soient chargées
    const images = tempDiv.querySelectorAll('img')
    const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(true)
        } else {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(false)
          // Timeout après 2 secondes
          setTimeout(() => resolve(false), 2000)
        }
      })
    })
    
    // Attendre que toutes les images soient chargées
    await Promise.all(imagePromises)
    
    // Attendre un court instant supplémentaire pour que les styles soient appliqués
    await new Promise(resolve => setTimeout(resolve, 300))
    
    try {
      // Capturer le contenu avec html2canvas
      const canvas = await html2canvas(tempDiv, {
        width: 1122,
        height: 794,
        scale: 2, // Augmenter la qualité
        useCORS: true,
        allowTaint: true, // Permettre les images base64
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1122,
        windowHeight: 794
      })
      
      // Retirer l'élément temporaire du DOM
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv)
      }
      
      // Créer le PDF en format A4 paysage
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth() // 297mm
      const pageHeight = pdf.internal.pageSize.getHeight() // 210mm
      
      // Convertir le canvas en image
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calculer les dimensions de l'image pour remplir la page
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * pageWidth) / canvas.width
      
      // Si l'image est plus haute que la page, ajuster
      let finalWidth = imgWidth
      let finalHeight = imgHeight
      let offsetX = 0
      let offsetY = 0
      
      if (imgHeight > pageHeight) {
        finalHeight = pageHeight
        finalWidth = (canvas.width * pageHeight) / canvas.height
        offsetX = (pageWidth - finalWidth) / 2
      } else {
        offsetY = (pageHeight - finalHeight) / 2
      }
      
      // Ajouter l'image au PDF
      pdf.addImage(imgData, 'PNG', offsetX, offsetY, finalWidth, finalHeight, undefined, 'FAST')
      
      return pdf
    } catch (error) {
      console.error('Erreur lors de la conversion HTML en PDF:', error)
      // Retirer l'élément temporaire même en cas d'erreur
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv)
      }
      // Fallback vers le template par défaut
      return generateDefaultCertificatPDF(inscription, atelier)
    }
  } catch (error) {
    console.error('Erreur génération certificat PDF:', error)
    return null
  }
}

/**
 * Génère un certificat PDF par défaut si aucun template n'est trouvé
 */
function generateDefaultCertificatPDF(
  inscription: {
    stagiaire_nom: string
  },
  atelier: {
    titre: string
    date_debut?: string
    animateur_nom?: string
  }
): jsPDF {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Utiliser le même design que generateCertificatPDF mais avec des données simplifiées
  const data: CertificatData = {
    nom: inscription.stagiaire_nom,
    atelier: atelier.titre,
    date: atelier.date_debut 
      ? new Date(atelier.date_debut).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })
      : '',
    animateur: atelier.animateur_nom || '',
    dateCertificat: new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  // Appliquer le même design (code répété mais simplifié pour le fallback)
  const primaryBlue = { r: 30, g: 64, b: 175 }
  const primaryOrange = { r: 255, g: 109, b: 31 }
  const darkText = { r: 31, g: 41, b: 55 }
  const lightGray = { r: 243, g: 244, b: 246 }

  pdf.setFillColor(primaryOrange.r, primaryOrange.g, primaryOrange.b)
  pdf.rect(0, 0, pageWidth, 8, 'F')
  pdf.rect(0, pageHeight - 8, pageWidth, 8, 'F')
  
  pdf.setFillColor(primaryBlue.r, primaryBlue.g, primaryBlue.b)
  pdf.rect(0, 0, 8, pageHeight, 'F')
  pdf.rect(pageWidth - 8, 0, 8, pageHeight, 'F')

  const margin = 20
  const contentX = margin + 8
  const contentY = margin + 8
  const contentWidth = pageWidth - (margin * 2) - 16

  pdf.setFillColor(lightGray.r, lightGray.g, lightGray.b)
  pdf.rect(contentX, contentY, contentWidth, pageHeight - (margin * 2) - 16, 'F')

  pdf.setFontSize(36)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(primaryBlue.r, primaryBlue.g, primaryBlue.b)
  const titleText = 'CERTIFICAT DE PARTICIPATION'
  pdf.text(titleText, pageWidth / 2, contentY + 25, { align: 'center' })

  let currentY = contentY + 50
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(darkText.r, darkText.g, darkText.b)
  pdf.text('Le Centre d\'Orientation Professionnelle certifie que', pageWidth / 2, currentY, { align: 'center' })

  currentY += 20
  pdf.setFontSize(32)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(primaryOrange.r, primaryOrange.g, primaryOrange.b)
  pdf.text(data.nom.toUpperCase(), pageWidth / 2, currentY, { align: 'center' })

  currentY += 20
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(darkText.r, darkText.g, darkText.b)
  pdf.text('a participé avec succès à l\'atelier', pageWidth / 2, currentY, { align: 'center' })

  currentY += 20
  pdf.setFontSize(22)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(primaryBlue.r, primaryBlue.g, primaryBlue.b)
  const atelierLines = pdf.splitTextToSize(data.atelier, contentWidth - 40)
  atelierLines.forEach((line: string) => {
    pdf.text(line, pageWidth / 2, currentY, { align: 'center' })
    currentY += 12
  })

  return pdf
}

