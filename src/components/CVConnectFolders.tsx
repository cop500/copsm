'use client'

import React, { useState, useMemo } from 'react'
import { 
  Folder, FolderOpen, FileText, Eye, Download, Trash2, 
  ChevronRight, ChevronDown, Users, Calendar, Mail, Phone,
  GraduationCap, Building2, Search, Filter, CheckCircle,
  Clock, Archive, Sparkles, TrendingUp, Wrench, Code, 
  Fish, Factory, ShoppingCart, Palette, Hotel, Heart,
  Sprout, Hammer, Cpu, Anchor, Cog, TrendingUp as TrendingUpIcon,
  Brush, Utensils, Stethoscope, Wheat
} from 'lucide-react'

interface CVSubmission {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  pole_id: string
  filiere_id: string
  cv_filename: string
  cv_storage_url?: string
  cv_google_drive_url?: string
  statut: 'nouveau' | 'traite' | 'archive'
  submitted_at: string
  pole?: { id: string; nom: string }
  filiere?: { id: string; nom: string }
}

interface CVConnectFoldersProps {
  submissions: CVSubmission[]
  loading: boolean
  onViewCV: (url: string, filename: string) => void
  onDownloadCV: (url: string, filename: string) => void
  onDeleteCV: (id: string, filename: string) => void
  onUpdateStatus: (id: string, status: string) => Promise<void>
  searchTerm?: string
}

export const CVConnectFolders: React.FC<CVConnectFoldersProps> = ({
  submissions,
  loading,
  onViewCV,
  onDownloadCV,
  onDeleteCV,
  onUpdateStatus,
  searchTerm = ''
}) => {
  const [expandedPoles, setExpandedPoles] = useState<Set<string>>(new Set())
  const [expandedFilieres, setExpandedFilieres] = useState<Set<string>>(new Set())
  const [selectedCV, setSelectedCV] = useState<CVSubmission | null>(null)

  // Grouper les CV par pôle puis par filière
  const groupedData = useMemo(() => {
    const polesMap = new Map<string, {
      pole: { id: string; nom: string }
      filieres: Map<string, {
        filiere: { id: string; nom: string }
        cvs: CVSubmission[]
      }>
    }>()

    submissions.forEach(cv => {
      if (!cv.pole || !cv.filiere) return

      const poleId = cv.pole.id
      const filiereId = cv.filiere.id

      // Créer le pôle s'il n'existe pas
      if (!polesMap.has(poleId)) {
        polesMap.set(poleId, {
          pole: cv.pole,
          filieres: new Map()
        })
      }

      const poleData = polesMap.get(poleId)!

      // Créer la filière si elle n'existe pas
      if (!poleData.filieres.has(filiereId)) {
        poleData.filieres.set(filiereId, {
          filiere: cv.filiere,
          cvs: []
        })
      }

      // Ajouter le CV
      poleData.filieres.get(filiereId)!.cvs.push(cv)
    })

    return Array.from(polesMap.values())
  }, [submissions])

  // Filtrer selon le terme de recherche
  const filteredData = useMemo(() => {
    if (!searchTerm) return groupedData

    const searchLower = searchTerm.toLowerCase()
    return groupedData
      .map(poleData => {
        const filteredFilieres = Array.from(poleData.filieres.values())
          .map(filiereData => ({
            ...filiereData,
            cvs: filiereData.cvs.filter(cv =>
              cv.nom.toLowerCase().includes(searchLower) ||
              cv.prenom.toLowerCase().includes(searchLower) ||
              cv.email.toLowerCase().includes(searchLower) ||
              cv.pole?.nom.toLowerCase().includes(searchLower) ||
              cv.filiere?.nom.toLowerCase().includes(searchLower)
            )
          }))
          .filter(filiereData => filiereData.cvs.length > 0)

        return {
          ...poleData,
          filieres: new Map(
            filteredFilieres.map(fd => [fd.filiere.id, fd])
          )
        }
      })
      .filter(poleData => poleData.filieres.size > 0)
  }, [groupedData, searchTerm])

  const togglePole = (poleId: string) => {
    const newExpanded = new Set(expandedPoles)
    if (newExpanded.has(poleId)) {
      newExpanded.delete(poleId)
    } else {
      newExpanded.add(poleId)
    }
    setExpandedPoles(newExpanded)
  }

  const toggleFiliere = (poleId: string, filiereId: string) => {
    const key = `${poleId}-${filiereId}`
    const newExpanded = new Set(expandedFilieres)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedFilieres(newExpanded)
  }

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'nouveau': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'traite': return 'bg-green-100 text-green-800 border-green-200'
      case 'archive': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'nouveau': return <Sparkles className="w-4 h-4" />
      case 'traite': return <CheckCircle className="w-4 h-4" />
      case 'archive': return <Archive className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'nouveau': return 'Nouveau'
      case 'traite': return 'Traité'
      case 'archive': return 'Archivé'
      default: return statut
    }
  }

  // Couleurs par pôle (gradients attractifs)
  const getPoleGradient = (poleName: string) => {
    const gradients: { [key: string]: string } = {
      'BTP': 'from-amber-500 to-orange-600',
      'Digital': 'from-purple-500 to-pink-600',
      'Pêche': 'from-blue-500 to-cyan-600',
      'Industrie': 'from-gray-500 to-slate-600',
      'Gestion & Commerce': 'from-indigo-500 to-purple-600',
      'Arts Graphiques': 'from-teal-500 to-emerald-600',
      'Hôtellerie & Tourisme': 'from-rose-500 to-red-600',
      'Santé': 'from-green-500 to-teal-600',
      'Agriculture': 'from-lime-500 to-green-600',
    }
    
    const normalizedName = poleName.toUpperCase()
    for (const [key, gradient] of Object.entries(gradients)) {
      if (normalizedName.includes(key.toUpperCase())) {
        return gradient
      }
    }
    return 'from-blue-500 to-indigo-600' // Default
  }

  // Icônes par pôle
  const getPoleIcon = (poleName: string, isExpanded: boolean) => {
    const normalizedName = poleName.toUpperCase()
    
    // BTP
    if (normalizedName.includes('BTP') || normalizedName.includes('BATIMENT')) {
      return isExpanded ? <Hammer className="w-7 h-7 text-white" /> : <Wrench className="w-7 h-7 text-white" />
    }
    
    // Digital
    if (normalizedName.includes('DIGITAL') || normalizedName.includes('NUMERIQUE') || normalizedName.includes('INFORMATIQUE')) {
      return <Cpu className="w-7 h-7 text-white" />
    }
    
    // Pêche
    if (normalizedName.includes('PECHE') || normalizedName.includes('PÊCHE') || normalizedName.includes('AQUACULTURE')) {
      return isExpanded ? <Fish className="w-7 h-7 text-white" /> : <Anchor className="w-7 h-7 text-white" />
    }
    
    // Industrie
    if (normalizedName.includes('INDUSTRIE') || normalizedName.includes('PRODUCTION')) {
      return <Factory className="w-7 h-7 text-white" />
    }
    
    // Gestion & Commerce
    if (normalizedName.includes('GESTION') || normalizedName.includes('COMMERCE') || normalizedName.includes('MARKETING')) {
      return <ShoppingCart className="w-7 h-7 text-white" />
    }
    
    // Arts Graphiques
    if (normalizedName.includes('ARTS') || normalizedName.includes('GRAPHIQUE') || normalizedName.includes('DESIGN')) {
      return isExpanded ? <Palette className="w-7 h-7 text-white" /> : <Brush className="w-7 h-7 text-white" />
    }
    
    // Hôtellerie & Tourisme
    if (normalizedName.includes('HOTELLERIE') || normalizedName.includes('HÔTELLERIE') || normalizedName.includes('TOURISME') || normalizedName.includes('RESTAURATION')) {
      return <Utensils className="w-7 h-7 text-white" />
    }
    
    // Santé
    if (normalizedName.includes('SANTE') || normalizedName.includes('SANTÉ') || normalizedName.includes('MEDICAL')) {
      return <Stethoscope className="w-7 h-7 text-white" />
    }
    
    // Agriculture
    if (normalizedName.includes('AGRICULTURE') || normalizedName.includes('AGRO') || normalizedName.includes('ELEVAGE')) {
      return isExpanded ? <Sprout className="w-7 h-7 text-white" /> : <Wheat className="w-7 h-7 text-white" />
    }
    
    // Default
    return isExpanded ? <FolderOpen className="w-7 h-7 text-white" /> : <Folder className="w-7 h-7 text-white" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des CV...</p>
        </div>
      </div>
    )
  }

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun CV trouvé</h3>
        <p className="text-gray-600">
          {searchTerm ? 'Aucun CV ne correspond à votre recherche.' : 'Aucun CV n\'a été déposé pour le moment.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredData.map((poleData) => {
        const poleId = poleData.pole.id
        const isPoleExpanded = expandedPoles.has(poleId)
        const filieresArray = Array.from(poleData.filieres.values())
        const totalCVsInPole = filieresArray.reduce((sum, f) => sum + f.cvs.length, 0)
        const poleGradient = getPoleGradient(poleData.pole.nom)

        return (
          <div key={poleId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header du Pôle */}
            <div
              className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all"
              onClick={() => togglePole(poleId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-14 h-14 bg-gradient-to-r ${poleGradient} rounded-xl flex items-center justify-center shadow-lg transform transition-transform ${isPoleExpanded ? 'rotate-6 scale-105' : 'hover:scale-105'}`}>
                    {getPoleIcon(poleData.pole.nom, isPoleExpanded)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{poleData.pole.nom}</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {totalCVsInPole} CV{totalCVsInPole > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center space-x-4">
                      <span className="flex items-center">
                        <GraduationCap className="w-4 h-4 mr-1" />
                        {filieresArray.length} filière{filieresArray.length > 1 ? 's' : ''}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isPoleExpanded ? (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Filières du Pôle */}
            {isPoleExpanded && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-4 space-y-3">
                  {filieresArray.map((filiereData) => {
                    const filiereId = filiereData.filiere.id
                    const key = `${poleId}-${filiereId}`
                    const isFiliereExpanded = expandedFilieres.has(key)
                    const cvsCount = filiereData.cvs.length

                    return (
                      <div key={filiereId} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        {/* Header de la Filière */}
                        <div
                          className="p-4 cursor-pointer hover:bg-blue-50 transition-colors rounded-t-lg"
                          onClick={() => toggleFiliere(poleId, filiereId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{filiereData.filiere.nom}</h4>
                                <p className="text-sm text-gray-600">
                                  {cvsCount} CV{cvsCount > 1 ? 's' : ''} disponible{cvsCount > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isFiliereExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Liste des CV */}
                        {isFiliereExpanded && (
                          <div className="border-t border-gray-200 p-4 space-y-3">
                            {filiereData.cvs.map((cv) => {
                              const cvUrl = cv.cv_storage_url || cv.cv_google_drive_url

                              return (
                                <div
                                  key={cv.id}
                                  className="bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                                        <FileText className="w-6 h-6 text-white" />
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <h5 className="font-semibold text-gray-900">
                                            {cv.nom} {cv.prenom}
                                          </h5>
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(cv.statut)}`}>
                                            {getStatusIcon(cv.statut)}
                                            <span className="ml-1">{getStatusLabel(cv.statut)}</span>
                                          </span>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                                          <div className="flex items-center space-x-1">
                                            <Mail className="w-4 h-4" />
                                            <span className="truncate max-w-xs">{cv.email}</span>
                                          </div>
                                          {cv.telephone && (
                                            <div className="flex items-center space-x-1">
                                              <Phone className="w-4 h-4" />
                                              <span>{cv.telephone}</span>
                                            </div>
                                          )}
                                          <div className="flex items-center space-x-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(cv.submitted_at).toLocaleDateString('fr-FR')}</span>
                                          </div>
                                        </div>
                                        
                                        <p className="text-xs text-gray-500 truncate max-w-md">
                                          {cv.cv_filename}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2 ml-4">
                                      <select
                                        value={cv.statut}
                                        onChange={(e) => onUpdateStatus(cv.id, e.target.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${getStatusColor(cv.statut)} hover:shadow-sm`}
                                      >
                                        <option value="nouveau">Nouveau</option>
                                        <option value="traite">Traité</option>
                                        <option value="archive">Archivé</option>
                                      </select>
                                      
                                      {cvUrl && (
                                        <>
                                          <button
                                            onClick={() => onViewCV(cvUrl, cv.cv_filename)}
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Voir le CV"
                                          >
                                            <Eye className="w-5 h-5" />
                                          </button>
                                          <button
                                            onClick={() => onDownloadCV(cvUrl, cv.cv_filename)}
                                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                            title="Télécharger"
                                          >
                                            <Download className="w-5 h-5" />
                                          </button>
                                        </>
                                      )}
                                      <button
                                        onClick={() => onDeleteCV(cv.id, cv.cv_filename)}
                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Supprimer"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

