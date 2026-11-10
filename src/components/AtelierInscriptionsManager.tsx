'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { synchroniserCapaciteAtelier } from '@/lib/atelierInscriptionsCount'
import { printAllAttestationsAtelier, type AtelierAttestation } from '@/lib/attestationAtelierPrint'
import { AtelierIndicateursBlock } from './AtelierIndicateursBlock'
import type { AtelierIndicateurs, EvaluationStagiaire } from '@/lib/atelierEvaluation'
import { CRITERES_ATELIER, moyenneGlobaleNotes } from '@/lib/atelierEvaluation'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
// Import du plugin autotable - il ajoute automatiquement la méthode autoTable à jsPDF
import 'jspdf-autotable'

// Extension de type pour autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
import { 
  Users, X, Download, Trash2, Search, Star,
  GraduationCap, FileText, XCircle, CheckCircle2, Mail, Check, Send, RefreshCw, Pencil
} from 'lucide-react'

interface AtelierInscriptionsManagerProps {
  atelier: any
  onClose: () => void
}

interface Inscription {
  id: string
  stagiaire_nom: string
  stagiaire_email: string
  stagiaire_telephone?: string
  pole: string
  filliere: string
  statut?: string // Optionnel maintenant, seulement 'annule' si annulée
  date_inscription: string
  present?: boolean
  certificat_token?: string
  date_validation_presence?: string
}

function AtelierInscriptionsManager({ atelier, onClose }: AtelierInscriptionsManagerProps) {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInscriptions, setSelectedInscriptions] = useState<string[]>([])
  const [validating, setValidating] = useState(false)
  const [indicateurs, setIndicateurs] = useState<AtelierIndicateurs | undefined>(undefined)
  const [notesParInscription, setNotesParInscription] = useState<Record<string, EvaluationStagiaire>>({})
  const [editingNomId, setEditingNomId] = useState<string | null>(null)
  const [editingNomValue, setEditingNomValue] = useState('')
  const [savingNom, setSavingNom] = useState(false)
  
  // La validation de présence est disponible pour tous les statuts d'atelier
  // (planifié, en_cours, termine) pour plus de flexibilité

  // Charger les inscriptions de l'atelier
  const loadInscriptions = async () => {
    try {
      setLoading(true)
      console.log('🔍 Chargement inscriptions pour atelier:', atelier.id, 'Statut:', atelier.statut)
      
      const { data, error } = await supabase
            .from('inscriptions_ateliers')
            .select('*')
            .eq('atelier_id', atelier.id)
            .order('date_inscription', { ascending: false })

      if (error) {
        console.error('❌ Erreur Supabase:', error)
        throw error
      }
      
      console.log('✅ Inscriptions chargées:', data?.length || 0, 'inscription(s)')
      console.log('📋 Données brutes:', data)
      
      // Filtrer les inscriptions annulées AVANT de les stocker
      const inscriptionsValides = (data || []).filter((inscription: any) => inscription.statut !== 'annule')
      console.log('✅ Inscriptions valides (non annulées):', inscriptionsValides.length)
      
      setInscriptions(inscriptionsValides as unknown as Inscription[])
    } catch (error) {
      console.error('❌ Erreur chargement inscriptions:', error)
      // Afficher l'erreur à l'utilisateur
      alert('Erreur lors du chargement des inscriptions. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les inscriptions (seulement par recherche, plus de filtre par statut)
  const filteredInscriptions = inscriptions.filter(inscription => {
    // Exclure uniquement les inscriptions annulées (statut === 'annule')
    // Les inscriptions avec statut null, undefined ou autre sont considérées comme actives
    if (inscription.statut === 'annule') return false
    
    const matchesSearch = searchTerm === '' || 
      inscription.stagiaire_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscription.stagiaire_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inscription.pole && inscription.pole.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inscription.filliere && inscription.filliere.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSearch
  })
  
  // Compter uniquement les inscriptions actives (non annulées)
  // Une inscription est active si statut est null, undefined, ou différent de 'annule'
  const inscriptionsActives = inscriptions.filter(i => !i.statut || i.statut !== 'annule')
  
  // Compter les présences validées (inscriptions actives avec présence validée)
  const presencesValidees = inscriptionsActives.filter(i => i.present === true).length
  const presentsAvecAttestation = inscriptionsActives.filter(
    (i) => i.present === true && Boolean(i.certificat_token)
  )
  const presentsAvecEmail = presentsAvecAttestation.filter(
    (i) => Boolean((i.stagiaire_email || '').trim())
  )

  useEffect(() => {
    if (!atelier?.id) return
    let cancelled = false
    fetch(`/api/ateliers/evaluation/indicateurs/?ids=${atelier.id}&details=1`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setIndicateurs(data.indicateurs?.[atelier.id])
        setNotesParInscription(data.notesParInscription || {})
      })
      .catch(() => {
        if (!cancelled) {
          setIndicateurs(undefined)
          setNotesParInscription({})
        }
      })

    return () => {
      cancelled = true
    }
  }, [atelier?.id, inscriptions.length, presencesValidees])

  // Obtenir le statut en français (seulement pour les annulées)
  const getStatusLabel = (status?: string) => {
    if (status === 'annule') return 'Annulée'
    return 'Inscrit' // Par défaut, toutes les inscriptions sont considérées comme inscrites
  }

  // Exporter les inscriptions en Excel (structuré)
  const exportToExcel = () => {
    if (filteredInscriptions.length === 0) {
      alert('Aucune inscription à exporter')
      return
    }

    try {
      // Créer le workbook
      const workbook = XLSX.utils.book_new()

      // Préparer les données avec formatage
      const data = filteredInscriptions.map((inscription, index) => ({
        'N°': index + 1,
        'Nom complet': inscription.stagiaire_nom,
        'Email': inscription.stagiaire_email,
        'Téléphone': inscription.stagiaire_telephone || 'Non renseigné',
        'Pôle': inscription.pole,
        'Filière': inscription.filliere,
        'Statut': inscription.statut === 'annule' ? 'Annulée' : 'Inscrit',
        'A noté': notesParInscription[inscription.id] ? 'Oui' : 'Non',
        'Moyenne notation': moyenneGlobaleNotes(notesParInscription[inscription.id] || {}) ?? '',
        'Date inscription': new Date(inscription.date_inscription).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }))

      // Créer la feuille avec les données
      const worksheet = XLSX.utils.json_to_sheet(data)

      // Définir les largeurs de colonnes
      const columnWidths = [
        { wch: 5 },   // N°
        { wch: 25 },  // Nom complet
        { wch: 30 },  // Email
        { wch: 15 },  // Téléphone
        { wch: 20 },  // Pôle
        { wch: 25 },  // Filière
        { wch: 15 },  // Statut
        { wch: 20 }   // Date inscription
      ]
      worksheet['!cols'] = columnWidths

      // Ajouter un en-tête avec informations de l'atelier
      const headerData = [
        ['LISTE DES INSCRIPTIONS - ATELIER'],
        [''],
        ['Atelier', atelier.titre || 'N/A'],
        ['Date d\'export', new Date().toLocaleDateString('fr-FR')],
        ['Total inscriptions', inscriptionsActives.length],
        ['Annulées', inscriptions.filter(i => i.statut === 'annule').length],
        [''],
        ['DÉTAIL DES INSCRIPTIONS'],
        [''],
        Object.keys(data[0] || {}),
        ...data.map(row => Object.values(row))
      ]

      // Créer une nouvelle feuille avec l'en-tête et les données
      const wsWithHeader = XLSX.utils.aoa_to_sheet(headerData)
      
      // Définir les largeurs pour la feuille complète
      wsWithHeader['!cols'] = columnWidths

      // Fusionner les cellules de l'en-tête
      if (!wsWithHeader['!merges']) wsWithHeader['!merges'] = []
      wsWithHeader['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } })
      wsWithHeader['!merges'].push({ s: { r: 9, c: 0 }, e: { r: 9, c: 7 } })

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(workbook, wsWithHeader, 'Inscriptions')

      // Générer le nom du fichier
      const fileName = `Inscriptions_${atelier.titre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`

      // Télécharger le fichier
      XLSX.writeFile(workbook, fileName)
      
      alert(`Fichier Excel exporté avec succès : ${fileName}`)
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error)
      alert('Erreur lors de l\'export Excel. Veuillez réessayer.')
    }
  }

  // Exporter les inscriptions en PDF
  const exportToPDF = () => {
    if (filteredInscriptions.length === 0) {
      alert('Aucune inscription à exporter')
      return
    }

    try {
      // Créer le document PDF
      const doc = new jsPDF('landscape', 'mm', 'a4')
      
      // Couleurs
      const primaryColor = [255, 102, 0] // Orange
      const secondaryColor = [0, 102, 204] // Bleu
      const textColor = [51, 51, 51]
      const lightGray = [245, 245, 245]

      // En-tête
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('LISTE DES INSCRIPTIONS', 15, 15)
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Atelier: ${atelier.titre || 'N/A'}`, 15, 22)

      // Informations de l'atelier
      let yPos = 35
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Informations générales', 15, yPos)
      
      yPos += 7
      doc.setFont('helvetica', 'normal')
      doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 15, yPos)
      yPos += 5
      doc.text(`Total inscriptions: ${inscriptionsActives.length}`, 15, yPos)
      yPos += 5
      doc.text(`Annulées: ${inscriptions.filter(i => i.statut === 'annule').length}`, 15, yPos)

      // Préparer les données pour le tableau
      const tableData = filteredInscriptions.map((inscription, index) => [
        index + 1,
        inscription.stagiaire_nom,
        inscription.stagiaire_email,
        inscription.stagiaire_telephone || 'Non renseigné',
        inscription.pole,
        inscription.filliere,
        inscription.statut === 'annule' ? 'Annulée' : 'Inscrit',
        new Date(inscription.date_inscription).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      ])

      // Créer le tableau avec autoTable
      // Vérifier si autoTable est disponible
      if (typeof (doc as any).autoTable === 'function') {
        try {
          ;(doc as any).autoTable({
            startY: yPos + 10,
            head: [['N°', 'Nom complet', 'Email', 'Téléphone', 'Pôle', 'Filière', 'Statut', 'Date inscription']],
            body: tableData,
            theme: 'striped',
            headStyles: {
              fillColor: [secondaryColor[0], secondaryColor[1], secondaryColor[2]],
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 9
            },
            bodyStyles: {
              fontSize: 8,
              textColor: [textColor[0], textColor[1], textColor[2]]
            },
            alternateRowStyles: {
              fillColor: [lightGray[0], lightGray[1], lightGray[2]]
            },
            columnStyles: {
              0: { cellWidth: 15 }, // N°
              1: { cellWidth: 40 }, // Nom complet
              2: { cellWidth: 50 }, // Email
              3: { cellWidth: 35 }, // Téléphone
              4: { cellWidth: 35 }, // Pôle
              5: { cellWidth: 40 }, // Filière
              6: { cellWidth: 30 }, // Statut
              7: { cellWidth: 30 }  // Date inscription
            },
            margin: { left: 15, right: 15 },
            styles: {
              overflow: 'linebreak',
              cellPadding: 2
            }
          })
        } catch (tableError) {
          // Fallback: créer un tableau simple sans autoTable
          createSimpleTable(doc, yPos + 10, tableData, secondaryColor, textColor, lightGray)
        }
      } else {
        // Fallback si autoTable n'est pas disponible
        createSimpleTable(doc, yPos + 10, tableData, secondaryColor, textColor, lightGray)
      }
      
      // Fonction helper pour créer un tableau simple sans autoTable
      function createSimpleTable(
        doc: jsPDF, 
        startY: number, 
        data: any[][], 
        headerColor: number[], 
        textColor: number[], 
        rowColor: number[]
      ) {
        const headers = ['N°', 'Nom complet', 'Email', 'Téléphone', 'Pôle', 'Filière', 'Statut', 'Date inscription']
        const colWidths = [15, 40, 50, 35, 35, 40, 30, 30]
        const rowHeight = 8
        let currentY = startY
        
        // En-tête
        doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        let xPos = 15
        headers.forEach((header, i) => {
          doc.rect(xPos, currentY, colWidths[i], rowHeight, 'F')
          doc.text(header, xPos + 2, currentY + 5)
          xPos += colWidths[i]
        })
        currentY += rowHeight
        
        // Données
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        data.forEach((row, rowIndex) => {
          if (rowIndex % 2 === 0) {
            doc.setFillColor(rowColor[0], rowColor[1], rowColor[2])
            let xPos = 15
            colWidths.forEach((width) => {
              doc.rect(xPos, currentY, width, rowHeight, 'F')
              xPos += width
            })
          }
          xPos = 15
          row.forEach((cell, colIndex) => {
            const cellText = String(cell || '').substring(0, 30) // Limiter la longueur
            doc.text(cellText, xPos + 2, currentY + 5)
            xPos += colWidths[colIndex]
          })
          currentY += rowHeight
          
          // Nouvelle page si nécessaire
          if (currentY > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage()
            currentY = 20
          }
        })
      }

      // Pied de page
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Page ${i} sur ${pageCount} - Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      // Générer le nom du fichier
      const fileName = `Inscriptions_${atelier.titre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`

      // Télécharger le PDF
      doc.save(fileName)
      
      alert(`Fichier PDF exporté avec succès : ${fileName}`)
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error)
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.')
    }
  }

  // Supprimer une inscription
  const handleDeleteInscription = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) return

    try {
      const { error } = await supabase
        .from('inscriptions_ateliers')
        .delete()
        .eq('id', id)

      if (error) throw error

      await synchroniserCapaciteAtelier(supabase, atelier.id)

      await loadInscriptions()
    } catch (error) {
      console.error('Erreur suppression inscription:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const commencerCorrectionNom = (inscription: Inscription) => {
    setEditingNomId(inscription.id)
    setEditingNomValue(inscription.stagiaire_nom || '')
  }

  const annulerCorrectionNom = () => {
    setEditingNomId(null)
    setEditingNomValue('')
  }

  const enregistrerNomInscrit = async (id: string) => {
    const nom = editingNomValue.replace(/\s+/g, ' ').trim()
    if (!nom) {
      alert('Le nom affiché sur l’attestation ne peut pas être vide.')
      return
    }

    try {
      setSavingNom(true)
      const { error } = await supabase
        .from('inscriptions_ateliers')
        .update({ stagiaire_nom: nom })
        .eq('id', id)

      if (error) throw error

      setInscriptions((prev) =>
        prev.map((inscription) =>
          inscription.id === id ? { ...inscription, stagiaire_nom: nom } : inscription
        )
      )
      setEditingNomId(null)
      setEditingNomValue('')
    } catch (error) {
      console.error('Erreur correction nom inscrit:', error)
      alert('Impossible d’enregistrer le nom. Réessayez.')
    } finally {
      setSavingNom(false)
    }
  }

  // Annuler une inscription
  const handleCancelInscription = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette inscription ?')) return

    try {
      const { error } = await supabase
        .from('inscriptions_ateliers')
        .update({ statut: 'annule' })
        .eq('id', id)

      if (error) throw error

      await synchroniserCapaciteAtelier(supabase, atelier.id)

      await loadInscriptions()
    } catch (error) {
      console.error('Erreur annulation inscription:', error)
      alert('Erreur lors de l\'annulation')
    }
  }

  // Valider/dévalider la présence d'un stagiaire individuellement
  const handleTogglePresence = async (inscriptionId: string, present: boolean) => {
    // La validation de présence est maintenant disponible pour tous les statuts

    try {
      setValidating(true)
      
      const response = await fetch(`/api/ateliers/${atelier.id}/valider-presences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inscriptionId,
          present
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la validation de la présence')
      }

      // Recharger les inscriptions pour mettre à jour l'interface
      await loadInscriptions()
      
      if (present) {
        alert('Présence validée avec succès ! Le certificat peut maintenant être téléchargé.')
      } else {
        alert('Validation de présence retirée.')
      }
    } catch (error: any) {
      console.error('Erreur validation présence:', error)
      alert(error.message || 'Erreur lors de la validation de la présence')
    } finally {
      setValidating(false)
    }
  }

  // Valider les présences en lot (pour les inscriptions sélectionnées)
  const handleValidatePresencesBatch = async () => {
    // La validation de présence est maintenant disponible pour tous les statuts

    if (selectedInscriptions.length === 0) {
      alert('Veuillez sélectionner au moins une inscription à valider')
      return
    }

    if (!window.confirm(`Valider la présence de ${selectedInscriptions.length} stagiaire(s) ?`)) {
      return
    }

    try {
      setValidating(true)

      const response = await fetch(`/api/ateliers/${atelier.id}/valider-presences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inscriptionIds: selectedInscriptions
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la validation des présences')
      }

      // Recharger les inscriptions
      await loadInscriptions()
      
      // Réinitialiser la sélection
      setSelectedInscriptions([])
      
      alert(data.message || `${selectedInscriptions.length} présence(s) validée(s) avec succès !`)
      
      if (data.errors && data.errors.length > 0) {
        console.warn('Erreurs partielles:', data.errors)
      }
    } catch (error: any) {
      console.error('Erreur validation présences:', error)
      alert(error.message || 'Erreur lors de la validation des présences')
    } finally {
      setValidating(false)
    }
  }

  const dateAtelierLabel = atelier.date_debut
    ? new Date(atelier.date_debut).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const openMailto = (href: string) => {
    const link = document.createElement('a')
    link.href = href
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resolveAnimateur = async (): Promise<{ nom: string; role: string }> => {
    let nom = String(atelier.animateur_nom || '').trim()
    let role = String(atelier.animateur_role || '').trim()
    if (!nom && atelier.animateur_id) {
      const { data: profil } = await supabase
        .from('profiles')
        .select('nom, prenom, role')
        .eq('id', atelier.animateur_id)
        .maybeSingle()
      if (profil) {
        nom = `${profil.prenom || ''} ${profil.nom || ''}`.trim()
        role = role || profil.role || ''
      }
    }
    return { nom, role }
  }

  const attestationsDesPresents = async (): Promise<AtelierAttestation[]> => {
    const { nom, role } = await resolveAnimateur()
    return presentsAvecAttestation.map((inscription) => ({
      inscriptionId: inscription.id,
      stagiaireNom: inscription.stagiaire_nom,
      titreAtelier: atelier.titre,
      dateDebut: atelier.date_debut,
      dateFin: atelier.date_fin,
      animateurNom: nom,
      animateurRole: role,
    }))
  }

  const handlePrintAttestationsPresents = async () => {
    if (presentsAvecAttestation.length === 0) {
      alert('Aucun présent avec attestation. Validez d’abord les présences.')
      return
    }
    printAllAttestationsAtelier(await attestationsDesPresents())
  }

  const generateMailtoLink = (inscription: Inscription): string => {
    if (!inscription.present || !inscription.certificat_token) {
      return ''
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://copsm.space'
    const certificatUrl = `${baseUrl}/certificat/${inscription.certificat_token}`

    let emailBody = `Bonjour ${inscription.stagiaire_nom},\n\n`
    emailBody += `Félicitations ! Vous avez participé avec succès à l'atelier :\n\n`
    emailBody += `${atelier.titre}\n`
    if (dateAtelierLabel) {
      emailBody += `Date : ${dateAtelierLabel}\n`
    }
    if (atelier.animateur_nom) {
      emailBody += `Animateur : ${atelier.animateur_nom}\n`
    }
    emailBody += `\nVotre attestation de participation est maintenant disponible. Vous pouvez la télécharger en cliquant sur le lien ci-dessous :\n\n`
    emailBody += `${certificatUrl}\n\n`
    emailBody += `Vous pourrez télécharger votre attestation autant de fois que nécessaire en utilisant ce lien.\n\n`
    emailBody += `Cordialement,\n`
    emailBody += `L'équipe du Centre d'Orientation Professionnelle CMC SM`

    const subject = encodeURIComponent(`Votre attestation de participation - ${atelier.titre}`)
    const body = encodeURIComponent(emailBody)
    return `mailto:${encodeURIComponent(inscription.stagiaire_email || '')}?subject=${subject}&body=${body}`
  }

  const handleSendCertificatEmail = (inscriptionId: string) => {
    const inscription = inscriptions.find((i) => i.id === inscriptionId)
    if (!inscription) return

    if (!inscription.present) {
      alert("La présence doit être validée avant d'envoyer l'attestation")
      return
    }

    if (!inscription.certificat_token) {
      alert("Aucun lien d'attestation trouvé. Veuillez d'abord valider la présence.")
      return
    }

    const mailtoLink = generateMailtoLink(inscription)
    if (!mailtoLink) {
      alert("Impossible de générer l'e-mail. Vérifiez que la présence est validée.")
      return
    }
    openMailto(mailtoLink)
  }

  const handleSendUnSeulMailPresents = async () => {
    if (presentsAvecEmail.length === 0) {
      alert('Aucun présent avec e-mail. Validez d’abord les présences.')
      return
    }

    const sansEmail = presentsAvecAttestation.length - presentsAvecEmail.length
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://copsm.space'
    const bcc = presentsAvecEmail.map((i) => i.stagiaire_email.trim()).join(';')

    const liens = presentsAvecEmail
      .slice()
      .sort((a, b) => a.stagiaire_nom.localeCompare(b.stagiaire_nom, 'fr', { sensitivity: 'base' }))
      .map((i) => `${i.stagiaire_nom} : ${baseUrl}/certificat/${i.certificat_token}`)
      .join('\n')

    let emailBody = `Bonjour,\n\n`
    emailBody += `Vous avez participé à l'atelier :\n${atelier.titre}\n`
    if (dateAtelierLabel) emailBody += `Date : ${dateAtelierLabel}\n`
    emailBody += `\nVotre attestation de participation est disponible via le lien correspondant à votre nom :\n\n`
    emailBody += `${liens}\n\n`
    emailBody += `Cordialement,\n`
    emailBody += `L'équipe du Centre d'Orientation Professionnelle CMC SM`

    const subject = encodeURIComponent(`Attestation de participation — ${atelier.titre}`)
    const mailtoTropLong = encodeURIComponent(emailBody).length > 1800

    if (mailtoTropLong) {
      emailBody = `Bonjour,\n\nVous avez participé à l'atelier :\n${atelier.titre}\n`
      if (dateAtelierLabel) emailBody += `Date : ${dateAtelierLabel}\n`
      emailBody += `\nLes attestations de participation (une page par stagiaire) sont à joindre au format PDF.\nEnregistrez le document ouvert à l'écran (Imprimer → Enregistrer au format PDF), puis joignez-le à cet e-mail.\n\nCordialement,\nL'équipe du Centre d'Orientation Professionnelle CMC SM`
      printAllAttestationsAtelier(await attestationsDesPresents())
    }

    const href = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${subject}&body=${encodeURIComponent(emailBody)}`
    openMailto(href)

    if (sansEmail > 0) {
      setTimeout(() => {
        alert(`${sansEmail} présent(s) sans e-mail n'ont pas été ajoutés à la copie cachée.`)
      }, 400)
    }
  }

  useEffect(() => {
    loadInscriptions()
  }, [atelier.id])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Gestion des inscriptions
          </h2>
              <p className="text-gray-600 mt-1">
                {atelier.titre} - {inscriptionsActives.length} inscription(s)
              </p>
            </div>
          <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
              <X className="w-6 h-6" />
          </button>
            </div>
          </div>

        {/* Statistiques simplifiées */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Inscriptions actives</p>
                  <p className="text-xl font-bold text-gray-900">{inscriptionsActives.length}</p>
              </div>
            </div>
          </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
          </div>
              <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Capacité</p>
                  <p className="text-xl font-bold text-purple-600">
                    {inscriptionsActives.length}/{atelier.capacite_maximale || 'N/A'}
                  </p>
              </div>
            </div>
          </div>
          
          {/* Afficher les présences validées pour tous les ateliers */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Présences validées</p>
                <p className="text-xl font-bold text-green-600">
                  {presencesValidees}/{inscriptionsActives.length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <AtelierIndicateursBlock stats={indicateurs} />
      </div>

        {/* Filtres et actions */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                  placeholder="Rechercher un stagiaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
              />
            </div>
          </div>

            <div className="flex gap-2 flex-wrap">
              {/* Bouton valider présences disponible pour tous les statuts */}
              <button
                onClick={handleValidatePresencesBatch}
                disabled={validating || selectedInscriptions.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className={`w-4 h-4 ${validating ? 'animate-spin' : ''}`} />
                {validating ? 'Validation...' : `Valider présences (${selectedInscriptions.length})`}
              </button>
              
              <button
                onClick={handlePrintAttestationsPresents}
                disabled={presentsAvecAttestation.length === 0}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="Ouvre toutes les attestations des présents pour imprimer ou enregistrer en PDF"
              >
                <FileText className="w-4 h-4" />
                {presentsAvecAttestation.length > 0
                  ? `Imprimer attestations (${presentsAvecAttestation.length})`
                  : 'Imprimer attestations'}
              </button>
              <button
                onClick={handleSendUnSeulMailPresents}
                disabled={presentsAvecEmail.length === 0}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="Ouvre un seul e-mail Outlook, en copie cachée à tous les présents"
              >
                <Mail className="w-4 h-4" />
                {presentsAvecEmail.length > 0
                  ? `Un seul mail aux présents (${presentsAvecEmail.length})`
                  : 'Un seul mail aux présents'}
              </button>
              
              <button
                onClick={exportToExcel}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            <button
                onClick={exportToPDF}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                PDF
            </button>
          </div>
        </div>
      </div>

        {/* Liste des inscriptions */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des inscriptions...</p>
      </div>
          ) : filteredInscriptions.length === 0 ? (
            <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune inscription</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Aucune inscription ne correspond à vos critères de recherche.'
                  : 'Aucune inscription n\'a encore été enregistrée pour cet atelier.'
                }
              </p>
          </div>
        ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* Case à cocher pour sélection multiple - disponible pour tous les statuts */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={selectedInscriptions.length === filteredInscriptions.length && filteredInscriptions.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInscriptions(filteredInscriptions.map(i => i.id))
                          } else {
                            setSelectedInscriptions([])
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stagiaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Formation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Présent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInscriptions.map((inscription) => (
                    <tr 
                      key={inscription.id} 
                      className={`hover:bg-gray-50 ${inscription.present ? 'bg-green-50' : ''}`}
                    >
                      {/* Case à cocher pour sélection - disponible pour tous les statuts */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedInscriptions.includes(inscription.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInscriptions([...selectedInscriptions, inscription.id])
                            } else {
                              setSelectedInscriptions(selectedInscriptions.filter(id => id !== inscription.id))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingNomId === inscription.id ? (
                          <div className="flex items-center gap-2 min-w-[220px]">
                            <input
                              autoFocus
                              type="text"
                              value={editingNomValue}
                              disabled={savingNom}
                              onChange={(e) => setEditingNomValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  void enregistrerNomInscrit(inscription.id)
                                }
                                if (e.key === 'Escape') annulerCorrectionNom()
                              }}
                              className="w-52 px-2 py-1 text-sm border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              title="Nom tel qu’il apparaîtra sur l’attestation"
                            />
                            <button
                              type="button"
                              disabled={savingNom}
                              onClick={() => void enregistrerNomInscrit(inscription.id)}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Enregistrer le nom"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={savingNom}
                              onClick={annulerCorrectionNom}
                              className="text-gray-500 hover:text-gray-800 disabled:opacity-50"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-gray-900">
                            <span className="inline-flex items-center gap-1.5">
                              {inscription.stagiaire_nom}
                              <button
                                type="button"
                                onClick={() => commencerCorrectionNom(inscription)}
                                className="text-gray-400 hover:text-purple-700"
                                title="Corriger le nom pour l’attestation"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </span>
                            {inscription.present && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Présent
                              </span>
                            )}
                            {notesParInscription[inscription.id] && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-900">
                                <Star className="w-3 h-3 mr-1" />
                                A noté
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{inscription.stagiaire_email}</div>
                              {inscription.stagiaire_telephone && (
                          <div className="text-sm text-gray-500">{inscription.stagiaire_telephone}</div>
                              )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {inscription.pole} - {inscription.filliere}
                            </div>
                      </td>
                      {/* Colonne Présent avec checkbox - disponible pour tous les statuts */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={inscription.present === true}
                          onChange={(e) => handleTogglePresence(inscription.id, e.target.checked)}
                          disabled={validating}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={inscription.present ? "Cliquer pour retirer la validation" : "Cliquer pour valider la présence"}
                        />
                        {inscription.date_validation_presence && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(inscription.date_validation_presence).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const note = notesParInscription[inscription.id]
                          if (note) {
                            const globale = moyenneGlobaleNotes(note)
                            return (
                              <div className="text-xs text-gray-800 space-y-1 min-w-[140px]">
                                <div className="inline-flex items-center gap-1 font-medium text-amber-900">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  {globale != null ? `${globale}/5` : 'Noté'}
                                </div>
                                {CRITERES_ATELIER.map(({ key, label }) => (
                                  <div key={key} className="flex justify-between gap-2 text-gray-600">
                                    <span className="truncate" title={label}>{label}</span>
                                    <span className="tabular-nums font-medium text-gray-800">{note[key]}/5</span>
                                  </div>
                                ))}
                                {note.commentaire && (
                                  <p className="text-gray-500 italic line-clamp-2" title={note.commentaire}>
                                    « {note.commentaire} »
                                  </p>
                                )}
                              </div>
                            )
                          }
                          if (inscription.present) {
                            return <span className="text-xs text-gray-400">Pas encore noté</span>
                          }
                          return <span className="text-xs text-gray-300">—</span>
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inscription.date_inscription).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                        })}
                      </td>
                      {/* Colonne Email - Bouton ouvrir Outlook */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {inscription.present && inscription.certificat_token ? (
                          <button
                            onClick={() => handleSendCertificatEmail(inscription.id)}
                            className="flex items-center gap-2 px-3 py-1 rounded-lg transition-colors bg-orange-100 text-orange-700 hover:bg-orange-200"
                            title="Ouvre Outlook avec l'email pré-rempli pour envoyer le certificat"
                          >
                            <Mail className="w-3 h-3" />
                            <span className="text-xs">Ouvrir Outlook</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Présence requise</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                              <button
                            onClick={() => handleCancelInscription(inscription.id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Annuler l'inscription"
                          >
                            <XCircle className="w-4 h-4" />
                              </button>
                              <button
                            onClick={() => handleDeleteInscription(inscription.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer définitivement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                      </td>
                    </tr>
                      ))}
                </tbody>
              </table>
                </div>
        )}
      </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
                <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
    </div>
  )
} 

export default AtelierInscriptionsManager