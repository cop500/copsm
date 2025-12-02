'use client'

import React, { useState, useMemo } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  Building2,
  Eye,
  Clock,
  Target,
  X,
  FileSpreadsheet,
  Upload,
  Download
} from 'lucide-react'
import { useVisitesEntreprises } from '@/hooks/useVisitesEntreprises'
import { useEntreprises } from '@/hooks/useEntreprises'
import { supabase } from '@/lib/supabase'
import VisiteForm from './VisiteForm'
import VisitesDashboard from './VisitesDashboard'
import type { VisiteEntreprise } from '@/hooks/useVisitesEntreprises'
import * as XLSX from 'xlsx'

const VisitesEntreprisesModule: React.FC = () => {
  const { visites, loading, error, refresh, saveVisite, deleteVisite, getStats } = useVisitesEntreprises()
  const { entreprises, saveEntreprise, refresh: refreshEntreprises } = useEntreprises()
  
  const [showForm, setShowForm] = useState(false)
  const [editingVisite, setEditingVisite] = useState<VisiteEntreprise | null>(null)
  const [selectedVisite, setSelectedVisite] = useState<VisiteEntreprise | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterEtat, setFilterEtat] = useState('')
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard')
  
  // États pour l'import Excel
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<any[]>([])

  // Statistiques
  const stats = useMemo(() => getStats(), [visites, getStats])

  // Filtrage des visites
  const visitesFiltrees = useMemo(() => {
    return visites.filter(v => {
      const matchSearch = 
        (v.entreprise?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.objectif || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.compte_rendu || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchStatut = filterStatut === '' || v.statut_relation === filterStatut
      const matchEtat = filterEtat === '' || v.etat_relation === filterEtat
      
      return matchSearch && matchStatut && matchEtat
    })
  }, [visites, searchTerm, filterStatut, filterEtat])

  // Fonction pour télécharger le template Excel
  const downloadTemplate = () => {
    const template = [
      {
        'Nom Entreprise': 'Exemple SARL',
        'Secteur Entreprise': 'Informatique',
        'Date Visite': '2024-01-15',
        'Heure Visite': '14:00',
        'Objectif': 'Présentation des formations disponibles',
        'Personnes Rencontrées (Nom)': 'Jean Dupont',
        'Personnes Rencontrées (Fonction)': 'Directeur RH',
        'Personnes Rencontrées (Email)': 'j.dupont@exemple.fr',
        'Personnes Rencontrées (Téléphone)': '+212 6XX XXX XXX',
        'Compte-rendu': 'Visite productive, intérêt marqué pour nos formations',
        'Points Discutés': 'Formations en développement web, opportunités de stage',
        'Besoins Détectés': 'Recrutement de 5 développeurs junior',
        'Actions à Prévoir': 'Envoyer catalogue formations, planifier réunion de suivi',
        'Niveau Intérêt': 'fort',
        'État Relation': 'actif',
        'Action Suivi (Tâche)': 'Envoyer catalogue',
        'Action Suivi (Date Limite)': '2024-01-20',
        'Action Suivi (Statut)': 'en_attente'
      }
    ]

    const valeursAutorisees = [
      { 'Champ': 'Niveau Intérêt', 'Valeurs autorisées': 'faible, moyen, fort' },
      { 'Champ': 'État Relation', 'Valeurs autorisées': 'prospect, actif, partenaire' },
      { 'Champ': 'Action Suivi (Statut)', 'Valeurs autorisées': 'en_attente, en_cours, termine, annule' },
      { 'Champ': 'Date Format', 'Format': 'YYYY-MM-DD (ex: 2024-01-15)' },
      { 'Champ': 'Heure Format', 'Format': 'HH:MM (ex: 14:00)' }
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wsValeurs = XLSX.utils.json_to_sheet(valeursAutorisees)
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Visites')
    XLSX.utils.book_append_sheet(wb, wsValeurs, 'Valeurs autorisées')
    
    XLSX.writeFile(wb, 'template_visites_entreprises.xlsx')
  }

  // Fonction pour lire le fichier Excel
  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // Normaliser les valeurs
        const normalizeStatut = (value: string): 'faible' | 'moyen' | 'fort' => {
          const normalized = (value || '').toLowerCase().trim()
          const mapping: { [key: string]: 'faible' | 'moyen' | 'fort' } = {
            'faible': 'faible',
            'moyen': 'moyen',
            'fort': 'fort',
            'low': 'faible',
            'medium': 'moyen',
            'high': 'fort'
          }
          return mapping[normalized] || 'moyen'
        }

        const normalizeEtat = (value: string): 'prospect' | 'actif' | 'partenaire' => {
          const normalized = (value || '').toLowerCase().trim()
          const mapping: { [key: string]: 'prospect' | 'actif' | 'partenaire' } = {
            'prospect': 'prospect',
            'actif': 'actif',
            'partenaire': 'partenaire'
          }
          return mapping[normalized] || 'prospect'
        }

        const normalizeActionStatut = (value: string): 'en_attente' | 'en_cours' | 'termine' | 'annule' => {
          const normalized = (value || '').toLowerCase().trim()
          const mapping: { [key: string]: 'en_attente' | 'en_cours' | 'termine' | 'annule' } = {
            'en_attente': 'en_attente',
            'en_cours': 'en_cours',
            'termine': 'termine',
            'annule': 'annule',
            'en attente': 'en_attente',
            'en cours': 'en_cours',
            'terminé': 'termine',
            'annulé': 'annule'
          }
          return mapping[normalized] || 'en_attente'
        }

        // Mapper les colonnes Excel vers nos champs
        const mappedData = jsonData.map((row: any, index: number) => {
          // Trouver l'entreprise par nom
          const entrepriseNom = row['Nom Entreprise'] || row['Entreprise'] || ''
          let entreprise = entreprises.find(e => 
            e.nom.toLowerCase().trim() === entrepriseNom.toLowerCase().trim()
          )

          // Si l'entreprise n'existe pas, on la marquera pour création automatique
          const entrepriseACreer = !entreprise ? {
            nom: entrepriseNom,
            secteur: row['Secteur Entreprise'] || row['Secteur'] || '',
            statut: 'prospect' as 'prospect' | 'actif' | 'inactif' | 'partenaire',
            niveau_interet: normalizeStatut(row['Niveau Intérêt'] || row['Niveau Interet'] || 'moyen'),
            partenaire_privilegie: false,
            // On stocke les infos pour créer l'entreprise plus tard
            _a_creer: true
          } : null

          // Gérer les personnes rencontrées
          const personnesRencontrees = []
          if (row['Personnes Rencontrées (Nom)']) {
            personnesRencontrees.push({
              nom: row['Personnes Rencontrées (Nom)'] || '',
              fonction: row['Personnes Rencontrées (Fonction)'] || '',
              email: row['Personnes Rencontrées (Email)'] || '',
              telephone: row['Personnes Rencontrées (Téléphone)'] || ''
            })
          }

          // Gérer les actions de suivi
          const actionsSuivi = []
          if (row['Action Suivi (Tâche)']) {
            actionsSuivi.push({
              tache: row['Action Suivi (Tâche)'] || '',
              date_limite: row['Action Suivi (Date Limite)'] || '',
              statut: normalizeActionStatut(row['Action Suivi (Statut)'] || 'en_attente')
            })
          }

          // Formater la date
          let dateVisite = row['Date Visite'] || ''
          if (dateVisite) {
            // Si c'est un nombre Excel (date serial), le convertir
            if (typeof dateVisite === 'number') {
              const excelEpoch = new Date(1899, 11, 30)
              const date = new Date(excelEpoch.getTime() + dateVisite * 86400000)
              dateVisite = date.toISOString().split('T')[0]
            } else if (dateVisite instanceof Date) {
              dateVisite = dateVisite.toISOString().split('T')[0]
            } else {
              // Essayer de parser la date
              const parsed = new Date(dateVisite)
              if (!isNaN(parsed.getTime())) {
                dateVisite = parsed.toISOString().split('T')[0]
              }
            }
          }

          return {
            entreprise_id: entreprise?.id || null,
            entreprise_nom: entrepriseNom,
            entreprise_a_creer: entrepriseACreer,
            date_visite: dateVisite,
            heure_visite: row['Heure Visite'] || '',
            objectif: row['Objectif'] || '',
            personnes_rencontrees: personnesRencontrees,
            compte_rendu: row['Compte-rendu'] || row['Compte rendu'] || '',
            points_discutes: row['Points Discutés'] || row['Points discutes'] || '',
            besoins_detectes: row['Besoins Détectés'] || row['Besoins detectes'] || '',
            actions_a_prevues: row['Actions à Prévoir'] || row['Actions a prevues'] || '',
            statut_relation: normalizeStatut(row['Niveau Intérêt'] || row['Niveau Interet'] || 'moyen'),
            etat_relation: normalizeEtat(row['État Relation'] || row['Etat Relation'] || 'prospect'),
            actions_suivi: actionsSuivi
          }
        }).filter(item => {
          // Filtrer les lignes valides (doit avoir nom entreprise et date)
          return item.entreprise_nom && item.date_visite
        })

        if (mappedData.length === 0) {
          throw new Error('Aucune ligne valide trouvée dans le fichier Excel')
        }

        setImportPreview(mappedData)
        setImportFile(file)
      } catch (error: any) {
        alert('Erreur lors de la lecture du fichier Excel: ' + error.message)
      }
    }
    
    reader.onerror = () => {
      alert('Erreur lors de la lecture du fichier')
    }
    
    reader.readAsArrayBuffer(file)
  }

  // Fonction pour importer les visites
  const handleImport = async () => {
    if (!importFile || importPreview.length === 0) {
      alert('Veuillez sélectionner un fichier Excel valide')
      return
    }

    setImporting(true)
    let successCount = 0
    let errorCount = 0
    let entreprisesCreees = 0
    const errors: string[] = []
    const entreprisesMap = new Map<string, string>() // Map nom -> id

    try {
      // Étape 1: Créer les entreprises manquantes
      const entreprisesACreer = new Map<string, any>()
      
      for (const row of importPreview) {
        if (row.entreprise_a_creer && !row.entreprise_id) {
          const nomEntreprise = row.entreprise_nom.toLowerCase().trim()
          if (!entreprisesACreer.has(nomEntreprise)) {
            entreprisesACreer.set(nomEntreprise, row.entreprise_a_creer)
          }
        } else if (row.entreprise_id) {
          // Entreprise existante, on l'ajoute à la map
          entreprisesMap.set(row.entreprise_nom.toLowerCase().trim(), row.entreprise_id)
        }
      }

      // Créer les entreprises manquantes
      for (const [nom, entrepriseData] of entreprisesACreer) {
        try {
          // Préparer les données de l'entreprise avec tous les champs requis
          const entrepriseToCreate = {
            nom: entrepriseData.nom,
            secteur: entrepriseData.secteur || null,
            statut: entrepriseData.statut || 'prospect',
            niveau_interet: entrepriseData.niveau_interet || 'moyen',
            partenaire_privilegie: false // Champ requis
          }

          // Créer l'entreprise directement avec Supabase pour récupérer l'ID
          const { data: newEntreprise, error: entrepriseError } = await supabase
            .from('entreprises')
            .insert([entrepriseToCreate])
            .select()
            .single()

          if (entrepriseError) {
            console.error('Erreur création entreprise:', {
              nom: entrepriseData.nom,
              error: entrepriseError,
              data: entrepriseToCreate
            })
            errors.push(`Erreur création entreprise "${entrepriseData.nom}": ${entrepriseError.message}${entrepriseError.details ? ` (${entrepriseError.details})` : ''}${entrepriseError.hint ? ` - ${entrepriseError.hint}` : ''}`)
          } else if (newEntreprise) {
            entreprisesMap.set(nom, newEntreprise.id)
            entreprisesCreees++
            console.log(`✅ Entreprise créée: ${entrepriseData.nom} (ID: ${newEntreprise.id})`)
          }
        } catch (error: any) {
          console.error('Exception création entreprise:', error)
          errors.push(`Erreur création entreprise "${entrepriseData.nom}": ${error.message}`)
        }
      }

      // Rafraîchir la liste des entreprises pour avoir les IDs à jour
      if (entreprisesCreees > 0) {
        await refreshEntreprises()
      }

      // Étape 2: Créer les visites
      for (const row of importPreview) {
        try {
          // Trouver l'ID de l'entreprise (existante ou créée)
          let entrepriseId = row.entreprise_id
          if (!entrepriseId) {
            entrepriseId = entreprisesMap.get(row.entreprise_nom.toLowerCase().trim())
          }

          if (!entrepriseId) {
            errorCount++
            errors.push(`${row.entreprise_nom}: Impossible de trouver ou créer l'entreprise`)
            continue
          }

          // Formater la date avec l'heure si fournie
          let dateVisite = row.date_visite
          if (row.heure_visite && dateVisite) {
            const [hours, minutes] = row.heure_visite.split(':')
            const date = new Date(dateVisite)
            date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0)
            dateVisite = date.toISOString()
          } else if (dateVisite) {
            dateVisite = new Date(dateVisite).toISOString()
          }

          const visiteData = {
            entreprise_id: entrepriseId,
            date_visite: dateVisite,
            heure_visite: row.heure_visite || null,
            objectif: row.objectif || null,
            personnes_rencontrees: row.personnes_rencontrees || [],
            compte_rendu: row.compte_rendu || null,
            points_discutes: row.points_discutes || null,
            besoins_detectes: row.besoins_detectes || null,
            actions_a_prevues: row.actions_a_prevues || null,
            statut_relation: row.statut_relation || 'moyen',
            etat_relation: row.etat_relation || 'prospect',
            actions_suivi: row.actions_suivi || []
          }

          const result = await saveVisite(visiteData)
          if (result.success) {
            successCount++
          } else {
            errorCount++
            errors.push(`${row.entreprise_nom}: ${result.error}`)
          }
        } catch (error: any) {
          errorCount++
          errors.push(`${row.entreprise_nom || 'Inconnu'}: ${error.message}`)
        }
      }

      let message = `Import terminé : ${successCount} visite(s) ajoutée(s)`
      if (entreprisesCreees > 0) {
        message += `, ${entreprisesCreees} entreprise(s) créée(s)`
      }
      if (errorCount > 0) {
        message += `, ${errorCount} erreur(s)`
      }
      
      if (errors.length > 0 && errors.length <= 5) {
        alert(message + '\n\nErreurs:\n' + errors.join('\n'))
      } else if (errors.length > 5) {
        alert(message + `\n\n${errors.length} erreur(s) détectée(s). Voir la console pour les détails.`)
        console.error('Erreurs d\'import:', errors)
      } else {
        alert(message)
      }

      setShowImportModal(false)
      setImportFile(null)
      setImportPreview([])
      refresh()
    } catch (error: any) {
      alert('Erreur lors de l\'import : ' + error.message)
    } finally {
      setImporting(false)
    }
  }

  // Ouvrir le formulaire pour créer une nouvelle visite
  const handleNewVisite = () => {
    setEditingVisite(null)
    setShowForm(true)
  }

  // Ouvrir le formulaire pour modifier une visite
  const handleEditVisite = (visite: VisiteEntreprise) => {
    setEditingVisite(visite)
    setShowForm(true)
  }

  // Supprimer une visite
  const handleDeleteVisite = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette visite ?')) {
      return
    }
    
    const result = await deleteVisite(id)
    if (result.success) {
      refresh()
    } else {
      alert(`Erreur: ${result.error}`)
    }
  }

  // Sauvegarder une visite
  const handleSaveVisite = async (data: Partial<VisiteEntreprise>) => {
    const result = await saveVisite(data)
    if (result.success) {
      setShowForm(false)
      setEditingVisite(null)
      refresh()
    }
    return result
  }

  // Afficher les détails d'une visite
  const handleViewDetail = (visite: VisiteEntreprise) => {
    setSelectedVisite(visite)
    setShowDetail(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des visites...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Visites Entreprises
          </h1>
          <p className="text-gray-600 mt-1">Gestion du suivi terrain avec les entreprises</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'dashboard' ? 'list' : 'dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {viewMode === 'dashboard' ? (
              <>
                <Calendar className="w-4 h-4" />
                Vue liste
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Tableau de bord
              </>
            )}
          </button>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Template Excel
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Importer Excel
          </button>
          <button
            onClick={handleNewVisite}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle visite
          </button>
        </div>
      </div>

      {/* Tableau de bord ou Liste */}
      {viewMode === 'dashboard' ? (
        <>
          <VisitesDashboard visites={visites} stats={stats} />
          
          {/* Liste récente des visites */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visites récentes</h3>
            {visitesFiltrees.slice(0, 10).length > 0 ? (
              <div className="space-y-3">
                {visitesFiltrees.slice(0, 10).map((visite) => (
                  <div
                    key={visite.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {visite.entreprise?.nom || 'Entreprise inconnue'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(visite.date_visite).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {visite.heure_visite && ` à ${visite.heure_visite}`}
                      </p>
                      {visite.objectif && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {visite.objectif}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {visite.statut_relation && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          visite.statut_relation === 'fort' ? 'bg-green-100 text-green-800' :
                          visite.statut_relation === 'moyen' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {visite.statut_relation}
                        </span>
                      )}
                      <button
                        onClick={() => handleViewDetail(visite)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditVisite(visite)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVisite(visite.id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune visite enregistrée</p>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par entreprise, objectif, compte-rendu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les niveaux</option>
                  <option value="faible">Faible</option>
                  <option value="moyen">Moyen</option>
                  <option value="fort">Fort</option>
                </select>
              </div>
              <div>
                <select
                  value={filterEtat}
                  onChange={(e) => setFilterEtat(e.target.value)}
                  className="py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les états</option>
                  <option value="prospect">Prospect</option>
                  <option value="actif">Actif</option>
                  <option value="partenaire">Partenaire</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des visites */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {visitesFiltrees.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {visitesFiltrees.map((visite) => (
                  <div
                    key={visite.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {visite.entreprise?.nom || 'Entreprise inconnue'}
                          </h3>
                          {visite.statut_relation && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              visite.statut_relation === 'fort' ? 'bg-green-100 text-green-800' :
                              visite.statut_relation === 'moyen' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {visite.statut_relation}
                            </span>
                          )}
                          {visite.etat_relation && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {visite.etat_relation}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(visite.date_visite).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          {visite.heure_visite && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {visite.heure_visite}
                            </span>
                          )}
                        </div>
                        {visite.objectif && (
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Objectif:</strong> {visite.objectif}
                          </p>
                        )}
                        {visite.compte_rendu && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {visite.compte_rendu}
                          </p>
                        )}
                        {visite.personnes_rencontrees && visite.personnes_rencontrees.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            {visite.personnes_rencontrees.length} personne(s) rencontrée(s)
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewDetail(visite)}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditVisite(visite)}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVisite(visite.id)}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune visite trouvée</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Formulaire de création/modification */}
      {showForm && (
        <VisiteForm
          visite={editingVisite || undefined}
          onSave={handleSaveVisite}
          onCancel={() => {
            setShowForm(false)
            setEditingVisite(null)
          }}
        />
      )}

      {/* Modal de détails */}
      {showDetail && selectedVisite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">Détails de la visite</h2>
              <button
                onClick={() => {
                  setShowDetail(false)
                  setSelectedVisite(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Entreprise</h3>
                <p className="text-gray-700">{selectedVisite.entreprise?.nom || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Date</h3>
                  <p className="text-gray-700">
                    {new Date(selectedVisite.date_visite).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {selectedVisite.heure_visite && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Heure</h3>
                    <p className="text-gray-700">{selectedVisite.heure_visite}</p>
                  </div>
                )}
              </div>
              {selectedVisite.objectif && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Objectif</h3>
                  <p className="text-gray-700">{selectedVisite.objectif}</p>
                </div>
              )}
              {selectedVisite.personnes_rencontrees && selectedVisite.personnes_rencontrees.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Personnes rencontrées</h3>
                  <div className="space-y-2">
                    {selectedVisite.personnes_rencontrees.map((personne, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <p className="font-medium text-gray-900">{personne.nom}</p>
                        <p className="text-sm text-gray-600">{personne.fonction}</p>
                        {personne.email && <p className="text-sm text-gray-600">{personne.email}</p>}
                        {personne.telephone && <p className="text-sm text-gray-600">{personne.telephone}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedVisite.compte_rendu && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Compte-rendu</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedVisite.compte_rendu}</p>
                </div>
              )}
              {selectedVisite.points_discutes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Points discutés</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedVisite.points_discutes}</p>
                </div>
              )}
              {selectedVisite.besoins_detectes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Besoins détectés</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedVisite.besoins_detectes}</p>
                </div>
              )}
              {selectedVisite.actions_a_prevues && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Actions à prévoir</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedVisite.actions_a_prevues}</p>
                </div>
              )}
              {selectedVisite.actions_suivi && selectedVisite.actions_suivi.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Actions de suivi</h3>
                  <div className="space-y-2">
                    {selectedVisite.actions_suivi.map((action, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <p className="font-medium text-gray-900">{action.tache}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          {action.date_limite && (
                            <span>Date limite: {new Date(action.date_limite).toLocaleDateString('fr-FR')}</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            action.statut === 'termine' ? 'bg-green-100 text-green-800' :
                            action.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                            action.statut === 'annule' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {action.statut}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedVisite.statut_relation && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Niveau d'intérêt</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedVisite.statut_relation === 'fort' ? 'bg-green-100 text-green-800' :
                      selectedVisite.statut_relation === 'moyen' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedVisite.statut_relation}
                    </span>
                  </div>
                )}
                {selectedVisite.etat_relation && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">État de la relation</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {selectedVisite.etat_relation}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetail(false)
                  setSelectedVisite(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowDetail(false)
                  handleEditVisite(selectedVisite)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  Importer des visites depuis Excel
                </h2>
                <p className="text-gray-600 mt-1">Importez vos visites déjà effectuées en masse</p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                  setImportPreview([])
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Instructions :</h3>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                <li>Téléchargez d'abord le template Excel pour voir le format attendu</li>
                <li>Les entreprises seront créées automatiquement si elles n'existent pas</li>
                <li>Le format de date doit être YYYY-MM-DD (ex: 2024-01-15)</li>
                <li>Le format d'heure doit être HH:MM (ex: 14:00)</li>
                <li>Les colonnes obligatoires sont : Nom Entreprise, Date Visite, Objectif</li>
                <li>Optionnel : Secteur Entreprise pour créer l'entreprise avec un secteur</li>
              </ul>
              </div>

              {/* Upload de fichier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner le fichier Excel
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(file)
                        }
                      }}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Cliquez pour sélectionner un fichier Excel
                      </p>
                      {importFile && (
                        <p className="text-sm text-blue-600 mt-2 font-medium">
                          {importFile.name}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Prévisualisation */}
              {importPreview.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Prévisualisation ({importPreview.length} visite(s))
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Entreprise
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Heure
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Objectif
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Niveau
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              État
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importPreview.slice(0, 20).map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-900">{row.entreprise_nom}</span>
                                  {!row.entreprise_id && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800" title="Cette entreprise sera créée automatiquement">
                                      Nouvelle
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {row.date_visite}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {row.heure_visite || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {row.objectif ? (row.objectif.length > 50 ? row.objectif.substring(0, 50) + '...' : row.objectif) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  row.statut_relation === 'fort' ? 'bg-green-100 text-green-800' :
                                  row.statut_relation === 'moyen' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {row.statut_relation}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {row.etat_relation}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importPreview.length > 20 && (
                        <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600 text-center">
                          ... et {importPreview.length - 20} autre(s) visite(s)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                    setImportPreview([])
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={importing}
                >
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || importPreview.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Importer {importPreview.length} visite(s)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisitesEntreprisesModule

