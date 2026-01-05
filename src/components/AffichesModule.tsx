'use client'

import React, { useState, useEffect } from 'react'
import { Download, FileText, QrCode, Calendar, MapPin, User, Clock } from 'lucide-react'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

const PALETTE_COLORS = {
  primary: '#1E40AF', // Bleu institutionnel
  secondary: '#FF6D1F', // Orange accent
  accent: '#FCD34D', // Jaune pour badges
  text: '#FFFFFF',
  textDark: '#1F2937'
}

interface AfficheFormData {
  titre: string
  sousTitre: string
  date: string
  heureDebut: string
  heureFin: string
  lieu: string
  animateur: string
  workshopNumber: string
  includeQRCode: boolean
  qrCodeUrl: string
  logoUrl: string // URL ou base64 de l'image du logo
}

export const AffichesModule: React.FC = () => {
  const [formData, setFormData] = useState<AfficheFormData>({
    titre: '',
    sousTitre: '',
    date: '',
    heureDebut: '',
    heureFin: '',
    lieu: '',
    animateur: '',
    workshopNumber: '',
    includeQRCode: true,
    qrCodeUrl: 'https://copsm.space/inscription-ateliers/',
    logoUrl: ''
  })
  const [generating, setGenerating] = useState(false)
  const [qrCodePreview, setQrCodePreview] = useState<string>('')

  // Gérer l'upload du logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image')
        return
      }
      
      // Lire le fichier en base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result
        if (typeof result === 'string') {
          setFormData(prev => ({ ...prev, logoUrl: result }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChange = (field: keyof AfficheFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Générer le QR code pour la prévisualisation si nécessaire
    if (field === 'qrCodeUrl' && typeof value === 'string' && formData.includeQRCode) {
      QRCode.toDataURL(value, { width: 200, margin: 2 })
        .then(url => setQrCodePreview(url))
        .catch(() => setQrCodePreview(''))
    }
    if (field === 'includeQRCode' && value === true && formData.qrCodeUrl) {
      QRCode.toDataURL(formData.qrCodeUrl, { width: 200, margin: 2 })
        .then(url => setQrCodePreview(url))
        .catch(() => setQrCodePreview(''))
    }
    if (field === 'includeQRCode' && value === false) {
      setQrCodePreview('')
    }
  }

  // Générer le QR code au chargement si nécessaire
  useEffect(() => {
    if (formData.includeQRCode && formData.qrCodeUrl) {
      QRCode.toDataURL(formData.qrCodeUrl, { width: 200, margin: 2 })
        .then(url => setQrCodePreview(url))
        .catch(() => setQrCodePreview(''))
    }
  }, [formData.includeQRCode, formData.qrCodeUrl])

  // Formater la date en français (format court pour affiche)
  const formatDateShort = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    
    return `${dayName} ${day} ${month} ${year}`
  }

  // Formater l'heure (HH:mm)
  const formatTime = (timeString: string): string => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    return `${hours}:${minutes}`
  }

  // Générer le PDF de l'affiche avec design premium professionnel
  const generateAffichePDF = async () => {
    if (!formData.titre || !formData.date || !formData.heureDebut) {
      alert('Veuillez remplir au moins le titre, la date et l\'heure de début')
      return
    }

    console.log('🎨 Génération PDF - Design professionnel premium')
    setGenerating(true)
    try {
      // Format personnalisé : 27cm x 15cm (270mm x 150mm)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [270, 150] })
      const pageWidth = 270 // 27cm
      const pageHeight = 150 // 15cm

      // ===== GRILLE PROFESSIONNELLE NETTOYÉE =====
      const margin = 15 // Marges optimisées
      
      // SÉPARATION CLAIRE : Zone gauche (contenu) vs Zone droite (QR Code)
      const qrZoneWidth = 70 // Zone réservée pour QR Code (droite)
      const contentZoneWidth = pageWidth - margin - qrZoneWidth - 8 // Zone contenu (gauche) avec séparation - ÉLARGIE
      const contentZoneStartX = margin
      const qrZoneStartX = pageWidth - margin - qrZoneWidth

      // Zones verticales
      const headerHeight = 20
      const footerHeight = 60 // Augmenté pour éviter le chevauchement avec le sous-titre
      const mainContentStartY = margin + headerHeight
      const mainContentHeight = pageHeight - margin - footerHeight - headerHeight

      // Couleurs professionnelles modernes
      const primaryRgb = { r: 25, g: 118, b: 210 } // Bleu moderne professionnel
      const accentRgb = { r: 255, g: 140, b: 0 } // Orange accent
      const white = { r: 255, g: 255, b: 255 }

      // ===== ARRIÈRE-PLAN NETTOYÉ - GRADIENT SIMPLE =====
      // Gradient horizontal simple : bleu foncé vers bleu-vert
      const gradientSteps = 6
      const stepWidth = pageWidth / gradientSteps
      const darkBlue = { r: 25, g: 118, b: 210 }
      const tealBlue = { r: 20, g: 140, b: 160 }
      
      for (let i = 0; i < gradientSteps; i++) {
        const x = i * stepWidth
        const ratio = i / (gradientSteps - 1)
        const r = Math.round(darkBlue.r + (tealBlue.r - darkBlue.r) * ratio)
        const g = Math.round(darkBlue.g + (tealBlue.g - darkBlue.g) * ratio)
        const b = Math.round(darkBlue.b + (tealBlue.b - darkBlue.b) * ratio)
        pdf.setFillColor(r, g, b)
        pdf.rect(x, 0, stepWidth + 1, pageHeight, 'F')
      }

      // ===== 1. BADGE WORKSHOP (EN HAUT À DROITE) =====
      if (formData.workshopNumber && formData.workshopNumber.trim() !== '') {
        const badgeText = `Workshop ${formData.workshopNumber}`
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        const textWidth = pdf.getTextWidth(badgeText)
        const badgeWidth = textWidth + 12
        const badgeHeight = 12
        const badgeX = pageWidth - margin - badgeWidth // En haut à droite
        const badgeY = margin
        
        pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
        pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2, badgeHeight / 2, 'F')
        
        pdf.setTextColor(0, 0, 0)
        pdf.text(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 1.5, { align: 'center' })
      }

      // ===== 2. LOGO (CENTRÉ EN HAUT) =====
      const logoBoxWidth = 100
      const logoBoxHeight = 12
      const logoX = (pageWidth - logoBoxWidth) / 2 // CENTRÉ
      const logoY = margin
      
      if (formData.logoUrl && formData.logoUrl.trim() !== '') {
        // Si un logo est uploadé, l'utiliser
        try {
          pdf.addImage(formData.logoUrl, 'PNG', logoX, logoY, logoBoxWidth, logoBoxHeight)
        } catch (error) {
          console.error('Erreur lors de l\'ajout du logo:', error)
          // Fallback sur le texte si l'image échoue
          pdf.setFillColor(white.r, white.g, white.b)
          pdf.roundedRect(logoX, logoY, logoBoxWidth, logoBoxHeight, 2, 2, 'F')
          pdf.setFontSize(6.5)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
          pdf.text('Centre d\'Orientation Professionnelle', logoX + 3, logoY + 6, { align: 'center' })
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(7.5)
          pdf.text('COP', logoX + logoBoxWidth / 2, logoY + 10.5, { align: 'center' })
        }
      } else {
        // Logo par défaut (texte centré)
        pdf.setFillColor(white.r, white.g, white.b)
        pdf.roundedRect(logoX, logoY, logoBoxWidth, logoBoxHeight, 2, 2, 'F')
        
        pdf.setFontSize(6.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        const orgText = 'Centre d\'Orientation Professionnelle'
        const orgTextWidth = pdf.getTextWidth(orgText)
        pdf.text(orgText, logoX + (logoBoxWidth - orgTextWidth) / 2, logoY + 6)
        
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(7.5)
        const copText = 'COP'
        const copTextWidth = pdf.getTextWidth(copText)
        pdf.text(copText, logoX + (logoBoxWidth - copTextWidth) / 2, logoY + 10.5)
      }

      // ===== 3. TITRE PRINCIPAL (Taille et espacement encore réduits pour tout afficher) =====
      const titreStartY = mainContentStartY + 12 // Réduit de 15 à 12
      const titreMaxWidth = contentZoneWidth - 5 // ZONE ÉLARGIE (réduit marge de 10 à 5)
      
      pdf.setFontSize(34) // Taille réduite de 40 à 34 pour plus de place
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(white.r, white.g, white.b)
      
      const titre = formData.titre.trim()
      let titreLines: string[] = []
      if (titre) {
        titreLines = pdf.splitTextToSize(titre, titreMaxWidth)
        let titreY = titreStartY
        titreLines.forEach((line: string, index: number) => {
          if (index < 3) { // Permet jusqu'à 3 lignes maintenant
            pdf.text(line, contentZoneStartX + 2, titreY)
            titreY += 18 // Interligne réduit de 22 à 18
          }
        })
      }

      // ===== 4. SOUS-TITRE (Juste après le titre, avec espacement) =====
      const titreHeight = Math.min(titreLines.length, 3) * 18 // Ajusté pour le nouvel interligne
      let sousTitreY = titreStartY + titreHeight + 3 // Espacement réduit de 4 à 3
      let sousTitreEndY = sousTitreY // Pour calculer où se termine le sous-titre
      
      if (formData.sousTitre && formData.sousTitre.trim() !== '') {
        pdf.setFontSize(18) // Réduit de 20 à 18
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(white.r, white.g, white.b)
        
        const sousTitre = formData.sousTitre.trim()
        const sousTitreLines = pdf.splitTextToSize(sousTitre, titreMaxWidth)
        if (sousTitreLines.length > 0) {
          pdf.text(sousTitreLines[0], contentZoneStartX + 2, sousTitreY)
          sousTitreEndY = sousTitreY + 15 // Hauteur du sous-titre réduite (taille police + espacement)
        }
      }

      // ===== 5. INFORMATIONS PRATIQUES (Bas gauche, disposition horizontale) =====
      // Calculer la position en s'assurant qu'il y a au moins 12mm d'espace après le sous-titre
      const minInfoY = sousTitreEndY + 12 // Minimum 12mm après la fin du sous-titre (réduit de 15)
      const fixedInfoY = pageHeight - 48 // Position fixe depuis le bas (48mm depuis le bas, réduit de 50)
      const infoY = Math.max(minInfoY, fixedInfoY) // Prendre la position la plus basse pour éviter le chevauchement
      const infoBlockX = contentZoneStartX + 2
      let currentX = infoBlockX

      // Date (format compact)
      if (formData.date) {
        const date = new Date(formData.date)
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        const months = ['Janv.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']
        
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(white.r, white.g, white.b)
        
        const dayName = days[date.getDay()]
        const day = date.getDate()
        const month = months[date.getMonth()]
        const year = date.getFullYear()
        
        pdf.text(dayName, currentX, infoY)
        pdf.text(`${day} ${month}`, currentX, infoY + 6)
        pdf.text(`${year}`, currentX, infoY + 12)
        currentX += 32
      }

      // Heure (avec icône horloge et flèche)
      if (formData.heureDebut) {
        // Icône horloge (cercle avec aiguilles)
        pdf.setDrawColor(white.r, white.g, white.b)
        pdf.setLineWidth(0.8)
        pdf.circle(currentX + 2, infoY + 3, 2, 'S')
        // Petite aiguille (horizontale)
        pdf.setLineWidth(0.5)
        pdf.line(currentX + 2, infoY + 3, currentX + 3.2, infoY + 3)
        // Grande aiguille (verticale vers le haut)
        pdf.line(currentX + 2, infoY + 3, currentX + 2, infoY + 1.5)
        // Point central
        pdf.setFillColor(white.r, white.g, white.b)
        pdf.circle(currentX + 2, infoY + 3, 0.3, 'F')
        
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(white.r, white.g, white.b)
        
        const heureDebutFormatted = formatTime(formData.heureDebut)
        pdf.text(heureDebutFormatted, currentX + 6, infoY + 2)
        
        if (formData.heureFin && formData.heureFin.trim() !== '') {
          // Pas de séparateur entre les heures
          const heureFinFormatted = formatTime(formData.heureFin)
          pdf.setFontSize(14)
          pdf.text(heureFinFormatted, currentX + 6, infoY + 10)
        }
        currentX += 32
      }

      // Lieu (avec icône pin améliorée)
      if (formData.lieu && formData.lieu.trim() !== '') {
        // Icône pin (cercle avec point en bas)
        const pinX = currentX + 2
        const pinY = infoY + 3
        pdf.setFillColor(white.r, white.g, white.b)
        // Cercle principal
        pdf.circle(pinX, pinY - 1, 1.5, 'F')
        // Petit point central
        pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        pdf.circle(pinX, pinY - 1, 0.5, 'F')
        
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(white.r, white.g, white.b)
        pdf.text(formData.lieu.trim(), currentX + 6, infoY + 5)
      }

      // ===== 6. INTERVENANT (Après les informations pratiques) =====
      // Positionner l'animateur après les infos pratiques (date/heure/lieu occupent environ 15mm de hauteur)
      const intervenantY = infoY + 18
      
      if (formData.animateur && formData.animateur.trim() !== '') {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(white.r, white.g, white.b)
        pdf.text('Animé par', contentZoneStartX + 2, intervenantY)
        
        const animateurName = formData.animateur.trim().toUpperCase()
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(white.r, white.g, white.b)
        
        const maxNameWidth = contentZoneWidth - 5
        const nameLines = pdf.splitTextToSize(animateurName, maxNameWidth)
        pdf.text(nameLines[0], contentZoneStartX + 2, intervenantY + 9)
      }

      // ===== 7. QR CODE + CTA (Zone droite) =====
      if (formData.includeQRCode) {
        const qrSize = 40
        const qrCenterX = qrZoneStartX + qrZoneWidth / 2
        const qrX = qrCenterX - qrSize / 2
        const qrY = pageHeight - 50 // Position fixe : 50mm depuis le bas pour le QR code

        // Badge CTA
        const ctaText = 'Scannez pour vous inscrire'
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        const ctaTextWidth = pdf.getTextWidth(ctaText)
        const ctaWidth = ctaTextWidth + 10
        const ctaHeight = 12
        const ctaX = qrCenterX - ctaWidth / 2
        const ctaY = qrY - 18
        
        pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
        pdf.roundedRect(ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2, ctaHeight / 2, 'F')
        
        pdf.setTextColor(0, 0, 0)
        pdf.text(ctaText, ctaX + ctaWidth / 2, ctaY + ctaHeight / 2 + 1.5, { align: 'center' })

        // QR Code avec fond orange et bordure blanche
        const quietZone = 4
        pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
        pdf.roundedRect(qrX - quietZone - 2, qrY - quietZone - 2, qrSize + (quietZone * 2) + 4, qrSize + (quietZone * 2) + 4, 2.5, 2.5, 'F')
        pdf.setFillColor(white.r, white.g, white.b)
        pdf.roundedRect(qrX - quietZone, qrY - quietZone, qrSize + (quietZone * 2), qrSize + (quietZone * 2), 2, 2, 'F')

        // Générer QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(formData.qrCodeUrl, {
          width: 400,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        })

        pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
      }

      // Télécharger le PDF
      const sanitizedTitre = (formData.titre || 'evenement').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
      const fileName = `affiche_${sanitizedTitre}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      alert('Erreur lors de la génération de l\'affiche. Veuillez réessayer.')
    } finally {
      setGenerating(false)
    }
  }

  // Composant de prévisualisation (27cm x 15cm = 270mm x 150mm)
  const PreviewAffiche = () => {
    const primaryColor = 'rgb(25, 118, 210)'
    const accentColor = 'rgb(255, 140, 0)'
    const tealColor = 'rgb(20, 140, 160)'
    
    return (
      <div className="relative" style={{ aspectRatio: '270/150', maxWidth: '100%' }}>
        {/* Container avec fond gradient nettoyé */}
        <div 
          className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl"
          style={{
            background: `linear-gradient(90deg, ${primaryColor} 0%, ${tealColor} 100%)`,
            minHeight: '400px'
          }}
        >
          {/* Contenu */}
          <div className="relative z-10 h-full p-4 flex flex-col">
            {/* Badge Workshop en haut à droite (si fourni) */}
            {formData.workshopNumber && formData.workshopNumber.trim() && (
              <div className="absolute top-4 right-4">
                <div 
                  className="px-3 py-1.5 rounded-full text-[9px] font-bold text-black"
                  style={{ backgroundColor: accentColor }}
                >
                  Workshop {formData.workshopNumber}
                </div>
              </div>
            )}

            {/* Logo centré en haut */}
            <div className="flex justify-center mb-4">
              {formData.logoUrl && formData.logoUrl.trim() ? (
                <img 
                  src={formData.logoUrl} 
                  alt="Logo" 
                  className="h-12 object-contain"
                />
              ) : (
                <div className="bg-white rounded-md px-3 py-1.5">
                  <div className="text-[6.5px] text-blue-700 font-normal text-center">
                    Centre d'Orientation Professionnelle
                  </div>
                  <div className="text-[7.5px] text-blue-700 font-bold text-center">
                    COP
                  </div>
                </div>
              )}
            </div>

            {/* Contenu principal */}
            <div className="flex-1 grid grid-cols-12 gap-4">
              {/* Zone gauche (contenu élargi) */}
              <div className="col-span-12 md:col-span-7 flex flex-col text-white justify-between">
                <div>
                  {/* Titre (zone élargie, jusqu'à 3 lignes) */}
                  {formData.titre && (
                    <h1 className="text-2xl md:text-3xl font-bold mb-1 leading-tight max-w-full">
                      {formData.titre.split('\n').slice(0, 3).map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </h1>
                  )}

                  {/* Sous-titre */}
                  {formData.sousTitre && formData.sousTitre.trim() && (
                    <p className="text-lg md:text-xl mb-2 font-normal">
                      {formData.sousTitre}
                    </p>
                  )}
                </div>

                {/* Informations pratiques en bas (disposition horizontale) */}
                <div className="flex flex-wrap items-start gap-4 mt-auto">
                  {formData.date && (
                    <div className="flex flex-col">
                      <div className="text-sm font-bold">
                        {(() => {
                          const date = new Date(formData.date)
                          const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
                          const months = ['Janv.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']
                          return (
                            <>
                              <div>{days[date.getDay()]}</div>
                              <div>{date.getDate()} {months[date.getMonth()]}</div>
                              <div>{date.getFullYear()}</div>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  )}
                  {formData.heureDebut && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1.5">
                        {/* Icône horloge */}
                        <div className="w-4 h-4 border-2 border-white rounded-full relative flex items-center justify-center">
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                          <div className="absolute w-0.5 h-1 bg-white" style={{ top: '2px', left: '50%', transform: 'translateX(-50%)' }}></div>
                          <div className="absolute w-1 h-0.5 bg-white" style={{ top: '50%', right: '2px', transform: 'translateY(-50%)' }}></div>
                        </div>
                        <div className="text-base font-bold">
                          {formatTime(formData.heureDebut)}
                        </div>
                      </div>
                      {formData.heureFin && formData.heureFin.trim() && (
                        <>
                          <div className="text-xs ml-5">→</div>
                          <div className="text-base font-bold ml-5">{formatTime(formData.heureFin)}</div>
                        </>
                      )}
                    </div>
                  )}
                  {formData.lieu && formData.lieu.trim() && (
                    <div className="flex items-center gap-1.5">
                      {/* Icône pin */}
                      <div className="w-4 h-4 relative">
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-white"></div>
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      <span className="text-sm">{formData.lieu}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Zone droite (QR Code) */}
              {formData.includeQRCode && (
                <div className="col-span-12 md:col-span-5 flex flex-col items-center justify-end pb-4">
                  {/* Badge CTA */}
                  <div 
                    className="px-3 py-1.5 rounded-full mb-3 text-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    <div className="text-[8px] font-bold text-black">
                      Scannez pour vous inscrire
                    </div>
                  </div>

                  {/* QR Code avec fond orange et bordure blanche */}
                  {qrCodePreview && (
                    <div className="relative">
                      <div 
                        className="absolute -inset-1 rounded-lg"
                        style={{ backgroundColor: accentColor }}
                      />
                      <div className="relative bg-white p-2 rounded-lg">
                        <img src={qrCodePreview} alt="QR Code" className="w-24 h-24" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Générateur d'affiches événementielles
        </h2>
        <p className="text-gray-600 mt-1">
          Créez une affiche professionnelle en saisissant les détails de l'événement
        </p>
      </div>

      {/* Prévisualisation */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Prévisualisation</h3>
        <PreviewAffiche />
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Titre principal */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Titre principal *
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => handleChange('titre', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Employabilité 4.0"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Texte principal de l'événement, très visible sur l'affiche</p>
          </div>

          {/* Logo Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Logo de l'organisation (optionnel)
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500">Si aucun logo n'est fourni, le texte par défaut sera affiché</p>
              {formData.logoUrl && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Aperçu du logo :</p>
                  <img src={formData.logoUrl} alt="Logo preview" className="h-16 object-contain" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Supprimer le logo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sous-titre */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sous-titre / Promesse de valeur
            </label>
            <input
              type="text"
              value={formData.sousTitre}
              onChange={(e) => handleChange('sousTitre', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Piloter sa carrière avec l'IA"
            />
            <p className="text-xs text-gray-500 mt-1">Une phrase qui explique la valeur de l'événement</p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Workshop Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numéro de Workshop (optionnel)
            </label>
            <input
              type="text"
              value={formData.workshopNumber}
              onChange={(e) => handleChange('workshopNumber', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 3"
            />
            <p className="text-xs text-gray-500 mt-1">Sera affiché comme badge "Workshop X" en haut à droite</p>
          </div>

          {/* Heure début */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Heure début *
            </label>
            <input
              type="time"
              value={formData.heureDebut}
              onChange={(e) => handleChange('heureDebut', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Heure fin */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Heure fin
            </label>
            <input
              type="time"
              value={formData.heureFin}
              onChange={(e) => handleChange('heureFin', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Lieu */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lieu
            </label>
            <input
              type="text"
              value={formData.lieu}
              onChange={(e) => handleChange('lieu', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Salle de conférence, En ligne"
            />
          </div>

          {/* Animateur */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Animé par
            </label>
            <input
              type="text"
              value={formData.animateur}
              onChange={(e) => handleChange('animateur', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Omar Oumouzoune"
            />
          </div>

          {/* QR Code */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Options QR Code
            </label>
            <div className="flex items-center space-x-3 mb-2">
              <input
                type="checkbox"
                id="includeQRCode"
                checked={formData.includeQRCode}
                onChange={(e) => handleChange('includeQRCode', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="includeQRCode" className="text-sm text-gray-600">
                Inclure un QR Code sur l'affiche
              </label>
            </div>
            {formData.includeQRCode && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL du QR Code
                </label>
                <input
                  type="url"
                  value={formData.qrCodeUrl}
                  onChange={(e) => handleChange('qrCodeUrl', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: https://copsm.space/inscription-ateliers/"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bouton de génération */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={generateAffichePDF}
            disabled={generating || !formData.titre || !formData.date || !formData.heureDebut}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 font-medium transition-colors shadow-lg"
          >
            {generating ? (
              <>
                <span className="animate-spin">⏳</span>
                Génération...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Générer l'affiche PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
