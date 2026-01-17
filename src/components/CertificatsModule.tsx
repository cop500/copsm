'use client'

import { useState, useEffect } from 'react'
import { useRole } from '@/hooks/useRole'
import { 
  FileText, Plus, Edit2, Trash2, Check, X, 
  RefreshCw, Save, AlertCircle, CheckCircle2, Upload, Image as ImageIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CertificatTemplate {
  id: string
  nom: string
  template_html: string
  styles_css: string
  active: boolean
  created_at: string
  updated_at: string
}

interface StyleConfig {
  couleurBleue: string
  couleurOrange: string
  couleurGrisFonce: string
  couleurGris: string
  tailleTitre: number
  tailleNom: number
  tailleAtelier: number
  tailleTexte: number
  tailleFooter: number
  espacementVertical: number
  espacementNom: number
  espacementAtelier: number
  margeInterne: number
  epaisseurBordure: number
  epaisseurLigne: number
  // Nouveaux contrôles
  couleurBackground: string
  backgroundImage: string | null
  espacementHeader: number
  espacementContent: number
  espacementFooter: number
  centrageHorizontal: string // 'left', 'center', 'right'
  centrageVertical: string // 'top', 'center', 'bottom'
  // Contrôles avancés pour design pro
  largeurBordureGauche: number // Bordure gauche fine au lieu de grosse bande
  largeurBordureDroite: number
  hauteurBordureHaut: number
  hauteurBordureBas: number
  espacementLettre: number // Letter spacing pour le titre
  policeTitre: string // 'serif' ou 'sans-serif'
  policeTexte: string
  numeroCertificat: string | null
  logoImage: string | null
  cachetImage: string | null
  alignementSignature: string // 'left', 'center', 'right'
  backgroundPattern: string | null // 'none', 'dots', 'lines', 'grid', 'waves', 'diagonal'
}

export const CertificatsModule: React.FC = () => {
  const { isAdmin } = useRole()
  
  const [templates, setTemplates] = useState<CertificatTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<CertificatTemplate | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Données pour l'édition simplifiée
  const [formData, setFormData] = useState<{
    nom: string
    signataire: string
    signatureImage: string | null // URL ou base64 de l'image de signature
    style: StyleConfig
  }>({
    nom: '',
    signataire: 'Le Directeur',
    signatureImage: null,
    style: {
      couleurBleue: '#1E40AF',
      couleurOrange: '#FF6D1F',
      couleurGrisFonce: '#333333',
      couleurGris: '#666666',
      tailleTitre: 36,
      tailleNom: 32,
      tailleAtelier: 24,
      tailleTexte: 16,
      tailleFooter: 14,
      espacementVertical: 50,
      espacementNom: 25,
      espacementAtelier: 25,
      margeInterne: 40,
      epaisseurBordure: 20,
      epaisseurLigne: 3,
      couleurBackground: '#fafafa',
      backgroundImage: null,
      espacementHeader: 50,
      espacementContent: 60,
      espacementFooter: 70,
      centrageHorizontal: 'center',
      centrageVertical: 'center',
      largeurBordureGauche: 6,
      largeurBordureDroite: 6,
      hauteurBordureHaut: 6,
      hauteurBordureBas: 6,
      espacementLettre: 4,
      policeTitre: 'serif',
      policeTexte: 'sans-serif',
      numeroCertificat: null,
      logoImage: null,
      cachetImage: null,
      alignementSignature: 'center',
      backgroundPattern: null,
    }
  })

  const [uploadingSignature, setUploadingSignature] = useState(false)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [uploadingBackground, setUploadingBackground] = useState(false)
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingCachet, setUploadingCachet] = useState(false)
  const [cachetPreview, setCachetPreview] = useState<string | null>(null)

  // Données de prévisualisation
  const previewData = {
    nom: 'Jean Dupont',
    atelier: 'Employabilité 4.0 : Piloter sa Carrière avec l\'IA',
    date: '30 décembre 2025',
    animateur: 'OMAR OUMOUZOUNE',
    date_certificat: new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  // Gérer l'upload de l'image de background
  const handleBackgroundUpload = async (file: File) => {
    try {
      setUploadingBackground(true)
      
      // Convertir en base64 pour stockage dans le template
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        updateStyle('backgroundImage', base64String)
        setBackgroundPreview(base64String)
        setUploadingBackground(false)
      }
      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier background')
        setUploadingBackground(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      console.error('Erreur upload background:', err)
      setError(err.message || 'Erreur lors de l\'upload du background')
      setUploadingBackground(false)
    }
  }

  const removeBackground = () => {
    setFormData({
      ...formData,
      style: {
        ...formData.style,
        backgroundImage: null
      }
    })
    setBackgroundPreview(null)
  }

  // Générer le HTML du template
  const generateHTML = (signataire: string, signatureImage: string | null, style: StyleConfig) => {
    // Utiliser les URLs directement - html2canvas peut les gérer
    const signatureHtml = signatureImage 
      ? `<div class="signature-container">
          <img src="${signatureImage}" alt="Signature" class="signature-image" />
          <p class="signature-text">{{signataire}}</p>
        </div>`
      : `<p class="signature">{{signataire}}</p>`

    const logoHtml = style.logoImage
      ? `<div class="logo-container">
          <img src="${style.logoImage}" alt="Logo COP" class="logo-image" />
        </div>`
      : ''

    const numeroHtml = style.numeroCertificat
      ? `<p class="numero-certificat">N° ${style.numeroCertificat}</p>`
      : ''

    const cachetHtml = style.cachetImage
      ? `<div class="cachet-container">
          <img src="${style.cachetImage}" alt="Cachet" class="cachet-image" />
        </div>`
      : ''

    return `<div class="certificat">
  <!-- Bordures fines décoratives -->
  <div class="border-top"></div>
  <div class="border-bottom"></div>
  <div class="border-left"></div>
  <div class="border-right"></div>
  
  <div class="certificat-content">
    <div class="inner-content">
      <!-- Logo (optionnel) -->
      ${logoHtml}
      
      <!-- Numéro de certificat (optionnel) -->
      ${numeroHtml}
      
      <!-- En-tête avec titre -->
      <div class="header">
        <h1>CERTIFICAT DE PARTICIPATION</h1>
      </div>
      
      <!-- Contenu principal -->
      <div class="content">
        <p class="intro">Le Centre d'Orientation Professionnelle</p>
        <p class="certifie">certifie que</p>
        <p class="nom">{{nom}}</p>
        <p class="description">a participé avec succès à l'atelier</p>
        <p class="atelier">{{atelier}}</p>
        <p class="animateur-info">
          <span class="animateur-label">Animé par</span> 
          <span class="animateur-nom">{{animateur}}</span>
        </p>
        <p class="date-info">le {{date}}</p>
      </div>
      
      <!-- Pied de page avec cachet et signature -->
      <div class="footer">
        ${cachetHtml}
        <p class="date-emission">Date d'émission : {{date_certificat}}</p>
        ${signatureHtml}
      </div>
    </div>
  </div>
</div>`
  }

  // Générer le CSS à partir des paramètres de style
  const generateCSS = (style: StyleConfig) => {
    // Fonction pour générer les motifs de background
    const getBackgroundPattern = (pattern: string | null) => {
      if (!pattern || pattern === 'none') return ''
      
      const patterns: { [key: string]: string } = {
        dots: `background-image: radial-gradient(circle, ${style.couleurGris}33 1px, transparent 1px);
  background-size: 20px 20px;`,
        lines: `background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, ${style.couleurGris}22 2px, ${style.couleurGris}22 4px);`,
        grid: `background-image: 
    linear-gradient(${style.couleurGris}22 1px, transparent 1px),
    linear-gradient(90deg, ${style.couleurGris}22 1px, transparent 1px);
  background-size: 30px 30px;`,
        waves: `background-image: repeating-linear-gradient(
    45deg,
    ${style.couleurBackground},
    ${style.couleurBackground} 10px,
    ${style.couleurGris}15 10px,
    ${style.couleurGris}15 20px
  );`,
        diagonal: `background-image: repeating-linear-gradient(
    135deg,
    ${style.couleurBackground},
    ${style.couleurBackground} 10px,
    ${style.couleurGris}10 10px,
    ${style.couleurGris}10 20px
  );`
      }
      return patterns[pattern] || ''
    }
    
    // Échapper les caractères spéciaux dans l'URL de l'image base64
    const backgroundImageUrl = style.backgroundImage 
      ? style.backgroundImage.replace(/'/g, "\\'").replace(/"/g, '\\"')
      : null
    
    const backgroundPatternCSS = getBackgroundPattern(style.backgroundPattern)
    
    const backgroundCSS = backgroundImageUrl
      ? `background-image: url('${backgroundImageUrl}');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: ${style.couleurBackground};`
      : backgroundPatternCSS
      ? `${backgroundPatternCSS}
  background-color: ${style.couleurBackground};`
      : `background-color: ${style.couleurBackground};`

    const textAlign = style.centrageHorizontal === 'left' ? 'left' 
      : style.centrageHorizontal === 'right' ? 'right' 
      : 'center'

    const justifyContent = style.centrageVertical === 'top' ? 'flex-start'
      : style.centrageVertical === 'bottom' ? 'flex-end'
      : 'center'

    return `.certificat {
  width: 1122px;
  height: 794px;
  margin: 0 auto;
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  ${backgroundCSS}
}

/* Bordures fines décoratives (design pro) */
.border-top, .border-bottom {
  height: ${style.hauteurBordureHaut || style.epaisseurBordure}px;
  background-color: ${style.couleurOrange};
  width: 100%;
  position: absolute;
  left: 0;
}

.border-top {
  top: 0;
}

.border-bottom {
  bottom: 0;
}

.border-left, .border-right {
  width: ${style.largeurBordureGauche || style.epaisseurBordure}px;
  background-color: ${style.couleurBleue};
  position: absolute;
  top: ${style.hauteurBordureHaut || style.epaisseurBordure}px;
  bottom: ${style.hauteurBordureBas || style.epaisseurBordure}px;
}

.border-left {
  left: 0;
}

.border-right {
  right: 0;
}

.certificat-content {
  position: relative;
  background-color: #ffffff;
  flex: 1;
  padding: 0 ${(style.largeurBordureGauche || style.epaisseurBordure) + 15}px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: ${style.hauteurBordureHaut || style.epaisseurBordure}px;
  margin-bottom: ${style.hauteurBordureBas || style.epaisseurBordure}px;
}

.inner-content {
  padding: ${style.margeInterne}px ${style.margeInterne * 0.8}px;
  text-align: ${textAlign};
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: ${justifyContent};
}

/* Logo */
.logo-container {
  text-align: center;
  margin-bottom: ${style.espacementHeader * 0.5}px;
}

.logo-image {
  max-width: 120px;
  max-height: 80px;
  display: inline-block;
}

/* Numéro de certificat */
.numero-certificat {
  text-align: ${textAlign};
  font-size: ${style.tailleFooter}px;
  color: ${style.couleurGris};
  font-family: 'Courier New', monospace;
  margin-bottom: ${style.espacementHeader * 0.3}px;
  letter-spacing: 1px;
}

.header {
  margin-bottom: ${style.espacementHeader}px;
  text-align: ${textAlign};
}

.header h1 {
  font-family: ${style.policeTitre === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Arial', 'Helvetica', sans-serif"};
  font-size: ${style.tailleTitre}px;
  font-weight: bold;
  color: ${style.couleurBleue};
  text-transform: uppercase;
  margin: 0;
  letter-spacing: ${style.espacementLettre}px;
  line-height: 1.2;
}

.content {
  margin: ${style.espacementContent}px 0;
  line-height: 1.9;
  text-align: ${textAlign};
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.intro {
  font-family: ${style.policeTexte === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Arial', 'Helvetica', sans-serif"};
  font-size: ${style.tailleTexte}px;
  color: ${style.couleurGrisFonce};
  margin: 20px 0 10px 0;
  text-align: ${textAlign};
  font-weight: 500;
}

.certifie {
  font-family: ${style.policeTexte === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Arial', 'Helvetica', sans-serif"};
  font-size: ${style.tailleTexte}px;
  color: ${style.couleurGrisFonce};
  margin: 10px 0 ${style.espacementNom}px 0;
  text-align: ${textAlign};
  font-style: italic;
}

.description, .date-info {
  font-family: ${style.policeTexte === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Arial', 'Helvetica', sans-serif"};
  font-size: ${style.tailleTexte}px;
  color: ${style.couleurGrisFonce};
  margin: 15px 0;
  text-align: ${textAlign};
  line-height: 1.8;
}

.nom {
  font-family: ${style.policeTitre === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Arial', 'Helvetica', sans-serif"};
  font-size: ${style.tailleNom}px;
  font-weight: bold;
  color: ${style.couleurOrange};
  text-transform: uppercase;
  margin: ${style.espacementNom}px 0;
  letter-spacing: 2px;
  text-align: ${textAlign};
  line-height: 1.3;
  border-bottom: 2px solid ${style.couleurOrange};
  display: inline-block;
  padding-bottom: 8px;
}

.atelier {
  font-family: ${style.policeTexte === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Arial', 'Helvetica', sans-serif"};
  font-size: ${style.tailleAtelier}px;
  font-weight: 600;
  color: ${style.couleurBleue};
  margin: ${style.espacementAtelier}px 0;
  text-align: ${textAlign};
  line-height: 1.4;
}

.animateur-info {
  font-family: ${style.policeTexte === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Arial', 'Helvetica', sans-serif"};
  font-size: ${style.tailleTexte}px;
  color: ${style.couleurGrisFonce};
  margin: 25px 0 15px 0;
  text-align: ${textAlign};
  line-height: 1.8;
}

.animateur-label {
  color: ${style.couleurGrisFonce};
  font-weight: normal;
}

.animateur-nom {
  font-weight: 600;
  text-transform: uppercase;
  color: ${style.couleurGrisFonce};
  display: inline-block;
}

.footer {
  margin-top: ${style.espacementFooter}px;
  font-family: ${style.policeTexte === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Arial', 'Helvetica', sans-serif"};
  text-align: ${textAlign};
  border-top: 1px solid ${style.couleurGris}20;
  padding-top: 20px;
}

/* Cachet */
.cachet-container {
  text-align: ${textAlign};
  margin-bottom: 15px;
}

.cachet-image {
  max-width: 100px;
  max-height: 100px;
  opacity: 0.7;
  display: inline-block;
}

.date-emission {
  font-size: ${style.tailleFooter}px;
  color: ${style.couleurGris};
  margin-bottom: 20px;
  font-family: ${style.policeTexte === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Arial', 'Helvetica', sans-serif"};
}

.signature {
  font-size: ${style.tailleFooter}px;
  color: ${style.couleurGris};
  font-style: italic;
  margin-top: 15px;
  font-family: ${style.policeTexte === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Arial', 'Helvetica', sans-serif"};
  text-align: ${style.alignementSignature || 'center'};
}

.signature-container {
  margin-top: 20px;
  text-align: ${style.alignementSignature || 'center'};
}

.signature-image {
  max-width: 120px;
  max-height: 60px;
  margin-bottom: 8px;
  display: block;
  ${style.alignementSignature === 'left' ? 'margin-left: 0; margin-right: auto;' : style.alignementSignature === 'right' ? 'margin-left: auto; margin-right: 0;' : 'margin-left: auto; margin-right: auto;'}
  opacity: 0.9;
}

.signature-text {
  font-size: ${style.tailleFooter}px;
  color: ${style.couleurGris};
  font-style: italic;
  margin-top: 5px;
  font-family: ${style.policeTexte === 'serif' ? "'Georgia', 'Times New Roman', serif" : "'Arial', 'Helvetica', sans-serif"};
  text-align: ${style.alignementSignature || 'center'};
}`
  }

  useEffect(() => {
    if (isAdmin) {
      loadTemplates()
    }
  }, [isAdmin])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/certificat-templates')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des templates')
      }

      setTemplates(data.templates || [])
    } catch (err: any) {
      console.error('Erreur chargement templates:', err)
      setError(err.message || 'Erreur lors du chargement des templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setFormData({
      nom: '',
      signataire: 'Le Directeur',
      signatureImage: null,
      style: {
        couleurBleue: '#1E40AF',
        couleurOrange: '#FF6D1F',
        couleurGrisFonce: '#333333',
        couleurGris: '#666666',
        tailleTitre: 36,
        tailleNom: 32,
        tailleAtelier: 24,
        tailleTexte: 16,
        tailleFooter: 14,
        espacementVertical: 50,
        espacementNom: 25,
        espacementAtelier: 25,
        margeInterne: 40,
        epaisseurBordure: 8,
        epaisseurLigne: 2,
        couleurBackground: '#fafafa',
        backgroundImage: null,
        espacementHeader: 50,
        espacementContent: 60,
        espacementFooter: 70,
        centrageHorizontal: 'center',
        centrageVertical: 'center',
        largeurBordureGauche: 6,
        largeurBordureDroite: 6,
        hauteurBordureHaut: 6,
        hauteurBordureBas: 6,
        espacementLettre: 4,
        policeTitre: 'serif',
        policeTexte: 'sans-serif',
        numeroCertificat: null,
        logoImage: null,
        cachetImage: null,
        alignementSignature: 'center',
        backgroundPattern: null,
      }
    })
    setSignaturePreview(null)
    setBackgroundPreview(null)
    setLogoPreview(null)
    setCachetPreview(null)
    setEditingTemplate(null)
    setShowCreateForm(true)
  }

  // Gérer l'upload de l'image de signature
  const handleSignatureUpload = async (file: File) => {
    try {
      setUploadingSignature(true)
      
      // Convertir en base64 pour stockage dans le template
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setFormData({ ...formData, signatureImage: base64String })
        setSignaturePreview(base64String)
        setUploadingSignature(false)
      }
      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier')
        setUploadingSignature(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      console.error('Erreur upload signature:', err)
      setError(err.message || 'Erreur lors de l\'upload de la signature')
      setUploadingSignature(false)
    }
  }

  const removeSignature = () => {
    setFormData({ ...formData, signatureImage: null })
    setSignaturePreview(null)
  }

  // Gérer l'upload du logo
  const handleLogoUpload = async (file: File) => {
    try {
      setUploadingLogo(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        updateStyle('logoImage', base64String)
        setLogoPreview(base64String)
        setUploadingLogo(false)
      }
      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier logo')
        setUploadingLogo(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      console.error('Erreur upload logo:', err)
      setError(err.message || 'Erreur lors de l\'upload du logo')
      setUploadingLogo(false)
    }
  }

  const removeLogo = () => {
    updateStyle('logoImage', null)
    setLogoPreview(null)
  }

  // Gérer l'upload du cachet
  const handleCachetUpload = async (file: File) => {
    try {
      setUploadingCachet(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        updateStyle('cachetImage', base64String)
        setCachetPreview(base64String)
        setUploadingCachet(false)
      }
      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier cachet')
        setUploadingCachet(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      console.error('Erreur upload cachet:', err)
      setError(err.message || 'Erreur lors de l\'upload du cachet')
      setUploadingCachet(false)
    }
  }

  const removeCachet = () => {
    updateStyle('cachetImage', null)
    setCachetPreview(null)
  }

  const handleEditTemplate = (template: CertificatTemplate) => {
    // Extraire le signataire et la signature du HTML
    let signataire = 'Le Directeur'
    let signatureImage: string | null = null
    
    // Parser le CSS existant pour extraire les valeurs
    const style: StyleConfig = {
      couleurBleue: '#1E40AF',
      couleurOrange: '#FF6D1F',
      couleurGrisFonce: '#333333',
      couleurGris: '#666666',
      tailleTitre: 36,
      tailleNom: 32,
      tailleAtelier: 24,
      tailleTexte: 16,
      tailleFooter: 14,
      espacementVertical: 50,
      espacementNom: 25,
      espacementAtelier: 25,
      margeInterne: 40,
      epaisseurBordure: 20,
      epaisseurLigne: 3,
      couleurBackground: '#fafafa',
      backgroundImage: null,
      espacementHeader: 50,
      espacementContent: 60,
      espacementFooter: 70,
      centrageHorizontal: 'center',
      centrageVertical: 'center',
      largeurBordureGauche: 6,
      largeurBordureDroite: 6,
      hauteurBordureHaut: 6,
      hauteurBordureBas: 6,
      espacementLettre: 4,
      policeTitre: 'serif',
      policeTexte: 'sans-serif',
      numeroCertificat: null,
      logoImage: null,
      cachetImage: null,
      alignementSignature: 'center',
      backgroundPattern: null,
    }

    // Extraire les valeurs du CSS et HTML existant
    const html = template.template_html || ''
    const css = template.styles_css || ''
    
    // Extraire le signataire du HTML
    const signataireMatch = html.match(/\{\{signataire\}\}/)
    if (signataireMatch) {
      // Chercher le texte du signataire dans le template
      const signataireTextMatch = html.match(/signature[^>]*>([^<]+)<\/p>/)
      if (signataireTextMatch && !signataireTextMatch[1].includes('{{')) {
        signataire = signataireTextMatch[1].trim()
      }
    }
    
    // Extraire l'image de signature si présente (gérer les guillemets simples et doubles)
    const imageMatch = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["']signature-image["']/i)
    if (imageMatch && imageMatch[1]) {
      signatureImage = decodeURIComponent(imageMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"'))
      setSignaturePreview(signatureImage)
    }
    
    // Extraire logo, cachet, numéro du HTML (gérer les guillemets simples et doubles)
    const logoMatch = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["']logo-image["']/i)
    if (logoMatch && logoMatch[1]) {
      const logoUrl = decodeURIComponent(logoMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"'))
      style.logoImage = logoUrl
      setLogoPreview(logoUrl)
    }
    
    const cachetMatch = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["']cachet-image["']/i)
    if (cachetMatch && cachetMatch[1]) {
      const cachetUrl = decodeURIComponent(cachetMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"'))
      style.cachetImage = cachetUrl
      setCachetPreview(cachetUrl)
    }
    
    const numeroMatch = html.match(/N°\s*([^<]+)<\/p>/)
    if (numeroMatch) {
      style.numeroCertificat = numeroMatch[1].trim()
    }
    
    // Extraire background
    const bgImageMatch = css.match(/background-image:\s*url\(['"]([^'"]+)['"]\)/)
    if (bgImageMatch) {
      style.backgroundImage = bgImageMatch[1]
      setBackgroundPreview(bgImageMatch[1])
    } else {
      const bgColorMatch = css.match(/background-color:\s*([^;]+)/)
      if (bgColorMatch) style.couleurBackground = bgColorMatch[1].trim()
    }
    
    // Extraire centrage
    const textAlignMatch = css.match(/text-align:\s*([^;]+)/)
    if (textAlignMatch) {
      const align = textAlignMatch[1].trim()
      style.centrageHorizontal = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center'
    }
    
    // Extraire espacements
    const headerMarginMatch = css.match(/\.header[^}]*margin-bottom:\s*(\d+)px/)
    if (headerMarginMatch) style.espacementHeader = parseInt(headerMarginMatch[1])
    
    const contentMarginMatch = css.match(/\.content[^}]*margin:\s*(\d+)px/)
    if (contentMarginMatch) style.espacementContent = parseInt(contentMarginMatch[1])
    
    const footerMarginMatch = css.match(/\.footer[^}]*margin-top:\s*(\d+)px/)
    if (footerMarginMatch) style.espacementFooter = parseInt(footerMarginMatch[1])
    
    // Extraire couleurs
    const blueMatch = css.match(/\.header h1[^}]*color:\s*([^;]+)/)
    if (blueMatch) style.couleurBleue = blueMatch[1].trim()
    
    const orangeMatch = css.match(/background-color:\s*([^;]+)/)
    if (orangeMatch) {
      const orange = orangeMatch[1].trim()
      if (orange.startsWith('#')) style.couleurOrange = orange
    }
    
    const nomColorMatch = css.match(/\.nom[^}]*color:\s*([^;]+)/)
    if (nomColorMatch) style.couleurOrange = nomColorMatch[1].trim()
    
    const greyMatch = css.match(/\.intro[^}]*color:\s*([^;]+)/)
    if (greyMatch) style.couleurGrisFonce = greyMatch[1].trim()
    
    const greyLightMatch = css.match(/\.date-emission[^}]*color:\s*([^;]+)/)
    if (greyLightMatch) style.couleurGris = greyLightMatch[1].trim()
    
    // Extraire tailles
    const titreMatch = css.match(/\.header h1[^}]*font-size:\s*(\d+)px/)
    if (titreMatch) style.tailleTitre = parseInt(titreMatch[1])
    
    const nomMatch = css.match(/\.nom[^}]*font-size:\s*(\d+)px/)
    if (nomMatch) style.tailleNom = parseInt(nomMatch[1])
    
    const atelierMatch = css.match(/\.atelier[^}]*font-size:\s*(\d+)px/)
    if (atelierMatch) style.tailleAtelier = parseInt(atelierMatch[1])
    
    const texteMatch = css.match(/\.intro[^}]*font-size:\s*(\d+)px/)
    if (texteMatch) style.tailleTexte = parseInt(texteMatch[1])
    
    const footerMatch = css.match(/\.date-emission[^}]*font-size:\s*(\d+)px/)
    if (footerMatch) style.tailleFooter = parseInt(footerMatch[1])
    
    // Extraire espacements
    const verticalMatch = css.match(/\.content[^}]*margin:\s*(\d+)px/)
    if (verticalMatch) style.espacementVertical = parseInt(verticalMatch[1])
    
    const nomMarginMatch = css.match(/\.nom[^}]*margin:\s*(\d+)px/)
    if (nomMarginMatch) style.espacementNom = parseInt(nomMarginMatch[1])
    
    const atelierMarginMatch = css.match(/\.atelier[^}]*margin:\s*(\d+)px/)
    if (atelierMarginMatch) style.espacementAtelier = parseInt(atelierMarginMatch[1])
    
    const paddingMatch = css.match(/\.inner-content[^}]*padding:\s*(\d+)px/)
    if (paddingMatch) style.margeInterne = parseInt(paddingMatch[1])
    
    // Extraire bordures
    const borderMatch = css.match(/\.border-top[^}]*height:\s*(\d+)px/)
    if (borderMatch) style.epaisseurBordure = parseInt(borderMatch[1])
    
    const lineMatch = css.match(/\.title-accent::after[^}]*height:\s*(\d+)px/)
    if (lineMatch) style.epaisseurLigne = parseInt(lineMatch[1])

    setFormData({
      nom: template.nom,
      signataire,
      signatureImage,
      style
    })
    setEditingTemplate(template)
    setShowCreateForm(true)
  }

  const handleSaveTemplate = async () => {
    if (!formData.nom.trim()) {
      alert('Le nom du template est requis')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Utiliser les previews si disponibles pour le style
      const styleForSave = {
        ...formData.style,
        backgroundImage: formData.style.backgroundImage || backgroundPreview || null,
        logoImage: formData.style.logoImage || logoPreview || null,
        cachetImage: formData.style.cachetImage || cachetPreview || null
      }
      
      // Utiliser signaturePreview si disponible, sinon formData.signatureImage
      const signatureImageForSave = formData.signatureImage || signaturePreview || null
      
      // Remplacer {{signataire}} dans le HTML généré
      const template_html = generateHTML(formData.signataire || 'Le Directeur', signatureImageForSave, styleForSave)
        .replace(/\{\{signataire\}\}/g, formData.signataire || 'Le Directeur')
      const styles_css = generateCSS(styleForSave)

      let response
      if (editingTemplate) {
        response = await fetch(`/api/admin/certificat-templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nom: formData.nom,
            template_html,
            styles_css,
            active: editingTemplate.active
          })
        })
      } else {
        response = await fetch('/api/admin/certificat-templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nom: formData.nom,
            template_html,
            styles_css,
            active: false
          })
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      alert(data.message || 'Template sauvegardé avec succès')
      setShowCreateForm(false)
      setEditingTemplate(null)
      setSignaturePreview(null)
      setBackgroundPreview(null)
      setLogoPreview(null)
      setCachetPreview(null)
      await loadTemplates()
    } catch (err: any) {
      console.error('Erreur sauvegarde template:', err)
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleActivateTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/certificat-templates/${templateId}/activate`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'activation')
      }

      alert(data.message || 'Template activé avec succès')
      await loadTemplates()
    } catch (err: any) {
      console.error('Erreur activation template:', err)
      alert(err.message || 'Erreur lors de l\'activation')
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateNom: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le template "${templateNom}" ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/certificat-templates/${templateId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      alert(data.message || 'Template supprimé avec succès')
      await loadTemplates()
    } catch (err: any) {
      console.error('Erreur suppression template:', err)
      alert(err.message || 'Erreur lors de la suppression')
    }
  }

  // Remplacer les variables dans le template pour la prévisualisation
  const getPreviewHTML = () => {
    const signatureImg = formData.signatureImage || signaturePreview
    const styleForPreview = {
      ...formData.style,
      logoImage: formData.style.logoImage || logoPreview || null,
      cachetImage: formData.style.cachetImage || cachetPreview || null
    }
    // Générer le HTML avec le signataire actuel
    let html = generateHTML(formData.signataire || 'Le Directeur', signatureImg, styleForPreview)
    // Remplacer toutes les variables
    html = html.replace(/\{\{nom\}\}/g, previewData.nom)
    html = html.replace(/\{\{atelier\}\}/g, previewData.atelier)
    html = html.replace(/\{\{date\}\}/g, previewData.date)
    html = html.replace(/\{\{animateur\}\}/g, previewData.animateur)
    html = html.replace(/\{\{date_certificat\}\}/g, previewData.date_certificat)
    // Remplacer le signataire (important : après generateHTML car il contient déjà {{signataire}})
    html = html.replace(/\{\{signataire\}\}/g, formData.signataire || 'Le Directeur')
    return html
  }

  const getPreviewCSS = () => {
    // Utiliser backgroundPreview si disponible pour la prévisualisation
    const styleWithPreview = {
      ...formData.style,
      backgroundImage: formData.style.backgroundImage || backgroundPreview || null,
      logoImage: formData.style.logoImage || logoPreview || null,
      cachetImage: formData.style.cachetImage || cachetPreview || null
    }
    return generateCSS(styleWithPreview)
  }

  const updateStyle = (key: keyof StyleConfig, value: any) => {
    setFormData({
      ...formData,
      style: {
        ...formData.style,
        [key]: value
      }
    })
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
        <p className="text-gray-600">Cette fonctionnalité est réservée aux administrateurs</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Chargement des templates...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              Gestion des Templates de Certificats
            </h2>
            <p className="text-gray-600 mt-2">
              Personnalisez le design des certificats de participation aux ateliers
            </p>
          </div>
          {!showCreateForm && (
            <button
              onClick={handleCreateTemplate}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouveau Template
            </button>
          )}
        </div>
      </div>

      {/* Formulaire de création/édition simplifié */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
            </h3>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setEditingTemplate(null)
                setError(null)
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche : Paramètres */}
            <div className="space-y-6">
              {/* Nom du template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du template *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Template Classique, Template Moderne..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Section Background */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-4">🖼️ Background du certificat</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Couleur de fond</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.style.couleurBackground}
                        onChange={(e) => updateStyle('couleurBackground', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        disabled={!!formData.style.backgroundImage}
                      />
                      <input
                        type="text"
                        value={formData.style.couleurBackground}
                        onChange={(e) => updateStyle('couleurBackground', e.target.value)}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm font-mono"
                        disabled={!!formData.style.backgroundImage}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Motif de fond (optionnel)</label>
                    <select
                      value={formData.style.backgroundPattern || 'none'}
                      onChange={(e) => {
                        const value = e.target.value === 'none' ? null : e.target.value
                        updateStyle('backgroundPattern', value)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3"
                      disabled={!!formData.style.backgroundImage}
                    >
                      <option value="none">Aucun motif</option>
                      <option value="dots">Points</option>
                      <option value="lines">Lignes horizontales</option>
                      <option value="grid">Grille</option>
                      <option value="waves">Vagues diagonales</option>
                      <option value="diagonal">Lignes diagonales</option>
                    </select>
                    <p className="text-xs text-gray-500 mb-3">
                      {formData.style.backgroundImage 
                        ? 'Le motif est désactivé car une image de fond est utilisée'
                        : 'Choisissez un motif élégant pour le fond du certificat'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Image de fond (optionnel)</label>
                    {backgroundPreview || formData.style.backgroundImage ? (
                      <div className="space-y-2">
                        <div className="relative border-2 border-gray-300 rounded p-2 bg-white">
                          <img
                            src={backgroundPreview || formData.style.backgroundImage || ''}
                            alt="Aperçu background"
                            className="max-w-full max-h-24 mx-auto"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeBackground}
                          className="w-full px-3 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                          Supprimer l'image de fond
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <ImageIcon className="w-6 h-6 mb-1 text-gray-400" />
                            <p className="text-xs text-gray-500">Cliquez pour uploader</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('Le fichier est trop volumineux. Taille maximale : 5MB')
                                  return
                                }
                                handleBackgroundUpload(file)
                              }
                            }}
                            disabled={uploadingBackground}
                          />
                        </label>
                        {uploadingBackground && (
                          <div className="mt-2 text-center">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 inline mr-2" />
                            <span className="text-sm text-gray-600">Upload en cours...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Couleurs */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-4">🎨 Couleurs</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Bleu</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.style.couleurBleue}
                        onChange={(e) => updateStyle('couleurBleue', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.style.couleurBleue}
                        onChange={(e) => updateStyle('couleurBleue', e.target.value)}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Orange</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.style.couleurOrange}
                        onChange={(e) => updateStyle('couleurOrange', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.style.couleurOrange}
                        onChange={(e) => updateStyle('couleurOrange', e.target.value)}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Gris foncé</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.style.couleurGrisFonce}
                        onChange={(e) => updateStyle('couleurGrisFonce', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.style.couleurGrisFonce}
                        onChange={(e) => updateStyle('couleurGrisFonce', e.target.value)}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Gris</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.style.couleurGris}
                        onChange={(e) => updateStyle('couleurGris', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.style.couleurGris}
                        onChange={(e) => updateStyle('couleurGris', e.target.value)}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Tailles de police */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-4">📏 Tailles de police (px)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Titre principal</label>
                    <input
                      type="number"
                      value={formData.style.tailleTitre}
                      onChange={(e) => updateStyle('tailleTitre', parseInt(e.target.value) || 36)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="12"
                      max="72"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Nom du participant</label>
                    <input
                      type="number"
                      value={formData.style.tailleNom}
                      onChange={(e) => updateStyle('tailleNom', parseInt(e.target.value) || 32)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="12"
                      max="72"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Titre atelier</label>
                    <input
                      type="number"
                      value={formData.style.tailleAtelier}
                      onChange={(e) => updateStyle('tailleAtelier', parseInt(e.target.value) || 24)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="12"
                      max="48"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Texte général</label>
                    <input
                      type="number"
                      value={formData.style.tailleTexte}
                      onChange={(e) => updateStyle('tailleTexte', parseInt(e.target.value) || 16)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="10"
                      max="24"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Pied de page</label>
                    <input
                      type="number"
                      value={formData.style.tailleFooter}
                      onChange={(e) => updateStyle('tailleFooter', parseInt(e.target.value) || 14)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="10"
                      max="20"
                    />
                  </div>
                </div>
              </div>

              {/* Section Espacements */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-4">📐 Espacements (px)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Espacement sous le titre (Header)</label>
                    <input
                      type="number"
                      value={formData.style.espacementHeader}
                      onChange={(e) => updateStyle('espacementHeader', parseInt(e.target.value) || 40)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="10"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Espacement vertical contenu</label>
                    <input
                      type="number"
                      value={formData.style.espacementContent}
                      onChange={(e) => updateStyle('espacementContent', parseInt(e.target.value) || 50)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="20"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Espacement au-dessus du footer</label>
                    <input
                      type="number"
                      value={formData.style.espacementFooter}
                      onChange={(e) => updateStyle('espacementFooter', parseInt(e.target.value) || 60)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="20"
                      max="150"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Espacement autour du nom</label>
                    <input
                      type="number"
                      value={formData.style.espacementNom}
                      onChange={(e) => updateStyle('espacementNom', parseInt(e.target.value) || 25)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="10"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Espacement autour atelier</label>
                    <input
                      type="number"
                      value={formData.style.espacementAtelier}
                      onChange={(e) => updateStyle('espacementAtelier', parseInt(e.target.value) || 25)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="10"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Marge interne</label>
                    <input
                      type="number"
                      value={formData.style.margeInterne}
                      onChange={(e) => updateStyle('margeInterne', parseInt(e.target.value) || 40)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="20"
                      max="80"
                    />
                  </div>
                </div>
              </div>

              {/* Section Centrage */}
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <h4 className="font-semibold text-cyan-900 mb-4">📍 Centrage et alignement</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Alignement horizontal du texte</label>
                    <select
                      value={formData.style.centrageHorizontal}
                      onChange={(e) => updateStyle('centrageHorizontal', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="left">Gauche</option>
                      <option value="center">Centre</option>
                      <option value="right">Droite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Alignement vertical du contenu</label>
                    <select
                      value={formData.style.centrageVertical}
                      onChange={(e) => updateStyle('centrageVertical', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="top">Haut</option>
                      <option value="center">Centre</option>
                      <option value="bottom">Bas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section Typographie */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h4 className="font-semibold text-teal-900 mb-4">🔤 Typographie</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Police du titre</label>
                    <select
                      value={formData.style.policeTitre}
                      onChange={(e) => updateStyle('policeTitre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="serif">Serif (élégante - ex: Georgia, Times)</option>
                      <option value="sans-serif">Sans-serif (moderne - ex: Arial, Helvetica)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Police du texte</label>
                    <select
                      value={formData.style.policeTexte}
                      onChange={(e) => updateStyle('policeTexte', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="serif">Serif (élégante)</option>
                      <option value="sans-serif">Sans-serif (propre)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Espacement des lettres (titre)</label>
                    <input
                      type="number"
                      value={formData.style.espacementLettre}
                      onChange={(e) => updateStyle('espacementLettre', parseInt(e.target.value) || 4)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="0"
                      max="10"
                    />
                  </div>
                </div>
              </div>

              {/* Section Bordures fines */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-4">🖼️ Bordures décoratives (px - design pro)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Largeur bordure gauche</label>
                    <input
                      type="number"
                      value={formData.style.largeurBordureGauche || formData.style.epaisseurBordure}
                      onChange={(e) => updateStyle('largeurBordureGauche', parseInt(e.target.value) || 6)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="3"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Largeur bordure droite</label>
                    <input
                      type="number"
                      value={formData.style.largeurBordureDroite || formData.style.epaisseurBordure}
                      onChange={(e) => updateStyle('largeurBordureDroite', parseInt(e.target.value) || 6)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="3"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hauteur bordure haut</label>
                    <input
                      type="number"
                      value={formData.style.hauteurBordureHaut || formData.style.epaisseurBordure}
                      onChange={(e) => updateStyle('hauteurBordureHaut', parseInt(e.target.value) || 6)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="3"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hauteur bordure bas</label>
                    <input
                      type="number"
                      value={formData.style.hauteurBordureBas || formData.style.epaisseurBordure}
                      onChange={(e) => updateStyle('hauteurBordureBas', parseInt(e.target.value) || 6)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="3"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Épaisseur lignes décoratives</label>
                    <input
                      type="number"
                      value={formData.style.epaisseurLigne}
                      onChange={(e) => updateStyle('epaisseurLigne', parseInt(e.target.value) || 2)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="1"
                      max="5"
                    />
                  </div>
                </div>
              </div>

              {/* Section Logo et Numéro */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-4">🏛️ Logo et Numéro de certificat</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Numéro de certificat (optionnel)</label>
                    <input
                      type="text"
                      value={formData.style.numeroCertificat || ''}
                      onChange={(e) => updateStyle('numeroCertificat', e.target.value || null)}
                      placeholder="Ex: CERT-2025-001"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Logo (optionnel)</label>
                    {logoPreview || formData.style.logoImage ? (
                      <div className="space-y-2">
                        <div className="relative border-2 border-gray-300 rounded p-2 bg-white">
                          <img
                            src={logoPreview || formData.style.logoImage || ''}
                            alt="Aperçu logo"
                            className="max-w-full max-h-20 mx-auto"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="w-full px-3 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                          Supprimer le logo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <ImageIcon className="w-5 h-5 mb-1 text-gray-400" />
                            <p className="text-xs text-gray-500">Cliquez pour uploader</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert('Le fichier est trop volumineux. Taille maximale : 2MB')
                                  return
                                }
                                handleLogoUpload(file)
                              }
                            }}
                            disabled={uploadingLogo}
                          />
                        </label>
                        {uploadingLogo && (
                          <div className="mt-2 text-center">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 inline mr-2" />
                            <span className="text-sm text-gray-600">Upload en cours...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Cachet */}
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <h4 className="font-semibold text-rose-900 mb-4">🔖 Cachet (optionnel)</h4>
                <div>
                  {cachetPreview || formData.style.cachetImage ? (
                    <div className="space-y-2">
                      <div className="relative border-2 border-gray-300 rounded p-2 bg-white">
                        <img
                          src={cachetPreview || formData.style.cachetImage || ''}
                          alt="Aperçu cachet"
                          className="max-w-full max-h-24 mx-auto"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeCachet}
                        className="w-full px-3 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                      >
                        Supprimer le cachet
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <ImageIcon className="w-5 h-5 mb-1 text-gray-400" />
                          <p className="text-xs text-gray-500">Cliquez pour uploader un cachet</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert('Le fichier est trop volumineux. Taille maximale : 2MB')
                                return
                              }
                              handleCachetUpload(file)
                            }
                          }}
                          disabled={uploadingCachet}
                        />
                      </label>
                      {uploadingCachet && (
                        <div className="mt-2 text-center">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600 inline mr-2" />
                          <span className="text-sm text-gray-600">Upload en cours...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section Signature */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 mb-4">✍️ Signature</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Nom du signataire *</label>
                    <input
                      type="text"
                      value={formData.signataire}
                      onChange={(e) => setFormData({ ...formData, signataire: e.target.value })}
                      placeholder="Ex: Le Directeur, La Directrice, Le Responsable..."
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Image de signature (optionnel)</label>
                    {signaturePreview || formData.signatureImage ? (
                      <div className="space-y-2">
                        <div className="relative border-2 border-gray-300 rounded p-2 bg-white">
                          <img
                            src={signaturePreview || formData.signatureImage || ''}
                            alt="Aperçu signature"
                            className="max-w-full max-h-32 mx-auto"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeSignature}
                          className="w-full px-3 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                          Supprimer la signature
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Cliquez pour uploader</span> une image
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG ou WEBP (max. 2MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert('Le fichier est trop volumineux. Taille maximale : 2MB')
                                  return
                                }
                                handleSignatureUpload(file)
                              }
                            }}
                            disabled={uploadingSignature}
                          />
                        </label>
                        {uploadingSignature && (
                          <div className="mt-2 text-center">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 inline mr-2" />
                            <span className="text-sm text-gray-600">Upload en cours...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Alignement de la signature</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateStyle('alignementSignature', 'left')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                          formData.style.alignementSignature === 'left'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ⬅️ Gauche
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStyle('alignementSignature', 'center')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                          formData.style.alignementSignature === 'center' || !formData.style.alignementSignature
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ⬆️ Centre
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStyle('alignementSignature', 'right')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                          formData.style.alignementSignature === 'right'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ➡️ Droite
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingTemplate(null)
                    setError(null)
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingTemplate ? 'Mettre à jour' : 'Créer'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Colonne droite : Prévisualisation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prévisualisation en temps réel (Format A4 Paysage)
              </label>
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-100 overflow-auto sticky top-6" style={{ maxHeight: 'calc(100vh - 150px)' }}>
                <div className="flex justify-center items-center min-h-[calc(100vh-250px)]">
                  <div className="relative">
                    {/* Format A4 paysage : 297mm x 210mm (1122px x 794px à 96 DPI) */}
                    <div 
                      className="preview-container bg-white shadow-2xl"
                      style={{ 
                        width: '1122px',
                        height: '794px',
                        transform: 'scale(0.9)',
                        transformOrigin: 'center center',
                        margin: '0 auto',
                        overflow: 'visible',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <style dangerouslySetInnerHTML={{ __html: getPreviewCSS() }} />
                      <div 
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        dangerouslySetInnerHTML={{ __html: getPreviewHTML() }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des templates */}
      {!showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Templates existants</h3>

          {templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun template créé. Créez votre premier template !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 ${
                    template.active 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {template.nom}
                        </h4>
                        {template.active && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Actif
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Créé le {new Date(template.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {!template.active && (
                      <button
                        onClick={() => handleActivateTemplate(template.id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Activer
                      </button>
                    )}
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </button>
                    {!template.active && (
                      <button
                        onClick={() => handleDeleteTemplate(template.id, template.nom)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
