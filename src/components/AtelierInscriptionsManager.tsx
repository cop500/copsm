'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
  Users, X, Download, Trash2, Eye, CheckCircle, 
  Clock, AlertCircle, Search, Filter, Calendar,
  Mail, Phone, MapPin, GraduationCap, FileText
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
  statut: string
  date_inscription: string
}

function AtelierInscriptionsManager({ atelier, onClose }: AtelierInscriptionsManagerProps) {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInscriptions, setSelectedInscriptions] = useState<string[]>([])

  // Charger les inscriptions de l'atelier
  const loadInscriptions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
            .from('inscriptions_ateliers')
            .select('*')
            .eq('atelier_id', atelier.id)
            .order('date_inscription', { ascending: false })

      if (error) throw error
      setInscriptions((data || []) as unknown as Inscription[])
    } catch (error) {
      console.error('Erreur chargement inscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les inscriptions
  const filteredInscriptions = inscriptions.filter(inscription => {
    const matchesSearch = searchTerm === '' || 
      inscription.stagiaire_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscription.stagiaire_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscription.pole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscription.filliere.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || inscription.statut === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Obtenir le statut en français
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirme': return 'Confirmée'
      case 'en_attente': return 'En attente'
      case 'annule': return 'Annulée'
      default: return status
    }
  }

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirme': return 'bg-green-100 text-green-800 border-green-200'
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'annule': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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
        'Statut': getStatusLabel(inscription.statut),
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
        ['Total inscriptions', filteredInscriptions.length],
        ['Confirmées', inscriptions.filter(i => i.statut === 'confirme').length],
        ['En attente', inscriptions.filter(i => i.statut === 'en_attente').length],
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
      doc.text(`Total inscriptions: ${filteredInscriptions.length}`, 15, yPos)
      yPos += 5
      doc.text(`Confirmées: ${inscriptions.filter(i => i.statut === 'confirme').length}`, 15, yPos)
      yPos += 5
      doc.text(`En attente: ${inscriptions.filter(i => i.statut === 'en_attente').length}`, 15, yPos)
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
        getStatusLabel(inscription.statut),
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

      // Mettre à jour la capacité de l'atelier
      await supabase
        .from('evenements')
        .update({ capacite_actuelle: (atelier.capacite_actuelle || 0) - 1 })
        .eq('id', atelier.id)

      await loadInscriptions()
    } catch (error) {
      console.error('Erreur suppression inscription:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Changer le statut d'une inscription
  const handleChangeStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('inscriptions_ateliers')
        .update({ statut: newStatus })
        .eq('id', id)

      if (error) throw error
      await loadInscriptions()
    } catch (error) {
      console.error('Erreur changement statut:', error)
      alert('Erreur lors du changement de statut')
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
                {atelier.titre} - {inscriptions.length} inscription(s)
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

        {/* Statistiques */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">{inscriptions.length}</p>
              </div>
            </div>
          </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Confirmées</p>
                  <p className="text-xl font-bold text-green-600">
                    {inscriptions.filter(i => i.statut === 'confirme').length}
                  </p>
              </div>
            </div>
          </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {inscriptions.filter(i => i.statut === 'en_attente').length}
                  </p>
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
                    {atelier.capacite_actuelle || 0}/{atelier.capacite_maximale}
                  </p>
              </div>
            </div>
          </div>
        </div>
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

            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="confirme">Confirmées</option>
                <option value="annule">Annulées</option>
            </select>
          </div>

            <div className="flex gap-2">
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
                {searchTerm || statusFilter !== 'all' 
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
                      Date inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInscriptions.map((inscription) => (
                    <tr key={inscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {inscription.stagiaire_nom}
                      </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inscription.date_inscription).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={inscription.statut}
                          onChange={(e) => handleChangeStatus(inscription.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(inscription.statut)}`}
                        >
                          <option value="en_attente">En attente</option>
                          <option value="confirme">Confirmée</option>
                          <option value="annule">Annulée</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                              <button
                            onClick={() => handleDeleteInscription(inscription.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
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