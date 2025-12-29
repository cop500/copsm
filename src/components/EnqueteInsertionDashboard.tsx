'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  Users,
  Download,
  RefreshCw,
  Copy,
  Trash2,
  GraduationCap,
  Briefcase,
  Building2,
  MapPin,
  Target,
  BarChart3,
  Info,
  Search,
  FileText,
} from 'lucide-react'

interface EnqueteReponse {
  id: string
  nom: string
  prenom: string
  genre: string
  pole_id: string
  pole_nom?: string
  filiere_id: string
  filiere_nom?: string
  poursuite_etudes: boolean
  type_formation?: string
  option_specialite?: string
  ville_formation?: string
  etablissement?: string
  en_activite: boolean
  type_activite?: string
  entreprise_nom?: string
  poste_occupe?: string
  brand_activite?: string
  type_stage?: string
  organisme_nom?: string
  date_soumission: string
}

interface Stats {
  total: number
  tauxInsertionGlobal: number
  tauxInsertionPourcent: number
  
  // Poursuite d'études
  enEtudes: number
  pasEtudes: number
  typesFormation: Record<string, number>
  villesFormation: Record<string, number>
  etablissements: Record<string, number>
  
  // Activité professionnelle
  enActivite: number
  sansActivite: number
  typesActivite: Record<string, number>
  entreprises: Record<string, number>
  postes: Record<string, number>
  typesStage: Record<string, number>
  
  // Répartition
  parGenre: Record<string, number>
  parPole: Record<string, number>
  parFiliere: Record<string, number>
  
  // Situations combinées
  etudesEtActivite: number
  etudesSeulement: number
  activiteSeulement: number
  niEtudesNiActivite: number
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  orange: '#f97316',
  teal: '#14b8a6',
  pink: '#ec4899',
}

const COLORS_ARRAY = Object.values(COLORS)

export default function EnqueteInsertionDashboard() {
  const [loading, setLoading] = useState(true)
  const [reponses, setReponses] = useState<EnqueteReponse[]>([])
  const [poles, setPoles] = useState<any[]>([])
  const [filieres, setFilieres] = useState<any[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  const [filters, setFilters] = useState({
    pole: '',
    filiere: '',
    genre: '',
    search: '',
    periode: 'all', // 'all', 'month', 'year'
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [selectedView, setSelectedView] = useState<'overview' | 'details' | 'table'>('overview')
  const itemsPerPage = 10

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [polesRes, filieresRes, reponsesRes] = await Promise.all([
        supabase.from('poles').select('*').order('nom'),
        supabase.from('filieres').select('*').order('nom'),
        supabase.from('enquete_reponses').select('*').order('date_soumission', { ascending: false }),
      ])

      if (polesRes.data) setPoles(polesRes.data)
      if (filieresRes.data) setFilieres(filieresRes.data)
      if (reponsesRes.data) {
        const reponses = reponsesRes.data as unknown as EnqueteReponse[]
        setReponses(reponses)
        calculateStats(reponses)
      }
    } catch (err) {
      console.error('Erreur chargement données:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: EnqueteReponse[]) => {
    const total = data.length

    // Indicateur de Parcours Post-Formation (poursuite études OU activité)
    const inseres = data.filter(r => r.poursuite_etudes || r.en_activite).length
    const tauxInsertionGlobal = inseres
    const tauxInsertionPourcent = total > 0 ? Math.round((inseres / total) * 100) : 0

    // Poursuite d'études
    const enEtudes = data.filter(r => r.poursuite_etudes).length
    const pasEtudes = total - enEtudes
    const typesFormation = data
      .filter(r => r.type_formation)
      .reduce((acc, r) => {
        acc[r.type_formation!] = (acc[r.type_formation!] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    const villesFormation = data
      .filter(r => r.ville_formation)
      .reduce((acc, r) => {
        acc[r.ville_formation!] = (acc[r.ville_formation!] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    const etablissements = data
      .filter(r => r.etablissement)
      .reduce((acc, r) => {
        acc[r.etablissement!] = (acc[r.etablissement!] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    // Activité professionnelle
    const enActivite = data.filter(r => r.en_activite).length
    const sansActivite = total - enActivite
    const typesActivite = data
      .filter(r => r.type_activite)
      .reduce((acc, r) => {
        acc[r.type_activite!] = (acc[r.type_activite!] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    const entreprises = data
      .filter(r => r.entreprise_nom)
      .reduce((acc, r) => {
        acc[r.entreprise_nom!] = (acc[r.entreprise_nom!] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    const postes = data
      .filter(r => r.poste_occupe)
      .reduce((acc, r) => {
        acc[r.poste_occupe!] = (acc[r.poste_occupe!] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    const typesStage = data
      .filter(r => r.type_stage)
      .reduce((acc, r) => {
        acc[r.type_stage!] = (acc[r.type_stage!] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    // Répartition
    const parGenre = data.reduce((acc, r) => {
      acc[r.genre] = (acc[r.genre] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const parPole = data.reduce((acc, r) => {
      const poleNom = r.pole_nom || 'Non spécifié'
      acc[poleNom] = (acc[poleNom] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const parFiliere = data.reduce((acc, r) => {
      const filiereNom = r.filiere_nom || 'Non spécifié'
      acc[filiereNom] = (acc[filiereNom] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Situations combinées
    const etudesEtActivite = data.filter(r => r.poursuite_etudes && r.en_activite).length
    const etudesSeulement = data.filter(r => r.poursuite_etudes && !r.en_activite).length
    const activiteSeulement = data.filter(r => !r.poursuite_etudes && r.en_activite).length
    const niEtudesNiActivite = data.filter(r => !r.poursuite_etudes && !r.en_activite).length

    setStats({
      total,
      tauxInsertionGlobal,
      tauxInsertionPourcent,
      enEtudes,
      pasEtudes,
      typesFormation,
      villesFormation,
      etablissements,
      enActivite,
      sansActivite,
      typesActivite,
      entreprises,
      postes,
      typesStage,
      parGenre,
      parPole,
      parFiliere,
      etudesEtActivite,
      etudesSeulement,
      activiteSeulement,
      niEtudesNiActivite,
    })
  }

  const filteredReponses = useMemo(() => {
    let filtered = [...reponses]

    // Filtre par période
    if (filters.periode !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      if (filters.periode === 'month') {
        cutoff.setMonth(now.getMonth() - 1)
      } else if (filters.periode === 'year') {
        cutoff.setFullYear(now.getFullYear() - 1)
      }
      filtered = filtered.filter(r => new Date(r.date_soumission) >= cutoff)
    }

    // Autres filtres
    if (filters.pole) {
      filtered = filtered.filter(r => r.pole_id === filters.pole)
    }
    if (filters.filiere) {
      filtered = filtered.filter(r => r.filiere_id === filters.filiere)
    }
    if (filters.genre) {
      filtered = filtered.filter(r => r.genre === filters.genre)
    }
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(r =>
        r.nom.toLowerCase().includes(search) ||
        r.prenom.toLowerCase().includes(search) ||
        r.entreprise_nom?.toLowerCase().includes(search) ||
        r.poste_occupe?.toLowerCase().includes(search)
      )
    }

    return filtered
  }, [reponses, filters])

  const exportCSV = () => {
    const headers = [
      'Nom', 'Prénom', 'Genre', 'Pôle', 'Filière',
      'Poursuite études', 'Type formation', 'Option/Spécialité', 'Ville formation', 'Établissement',
      'En activité', 'Type activité', 'Entreprise', 'Poste', 'Brand activité', 'Type stage', 'Organisme',
      'Date soumission'
    ]
    
    const rows = filteredReponses.map(r => [
      r.nom,
      r.prenom,
      r.genre,
      r.pole_nom || '',
      r.filiere_nom || '',
      r.poursuite_etudes ? 'Oui' : 'Non',
      r.type_formation || '',
      r.option_specialite || '',
      r.ville_formation || '',
      r.etablissement || '',
      r.en_activite ? 'Oui' : 'Non',
      r.type_activite || '',
      r.entreprise_nom || '',
      r.poste_occupe || '',
      r.brand_activite || '',
      r.type_stage || '',
      r.organisme_nom || '',
      new Date(r.date_soumission).toLocaleDateString('fr-FR'),
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enquete_insertion_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const copyPublicLink = () => {
    const link = `${window.location.origin}/enquete-insertion/public`
    navigator.clipboard.writeText(link)
    alert(`✅ Lien public copié !\n\n${link}`)
  }

  const deleteReponse = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) return

    try {
      const { error } = await supabase
        .from('enquete_reponses')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadData()
      alert('Réponse supprimée avec succès')
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Aucune donnée disponible</p>
      </div>
    )
  }

  // Préparer les données pour les graphiques
  const situationsCombinéesData = [
    { name: 'Études + Activité', value: stats.etudesEtActivite, color: COLORS.success },
    { name: 'Études seulement', value: stats.etudesSeulement, color: COLORS.primary },
    { name: 'Activité seulement', value: stats.activiteSeulement, color: COLORS.warning },
    { name: 'Ni études ni activité', value: stats.niEtudesNiActivite, color: COLORS.danger },
  ]

  const typesFormationData = Object.entries(stats.typesFormation)
    .map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
    }))
    .sort((a, b) => b.value - a.value)

  const typesActiviteData = Object.entries(stats.typesActivite)
    .map(([name, value]) => ({
      name: name === 'emploi_salarie' ? 'Emploi salarié' :
            name === 'travail_independant' ? 'Travail indépendant' :
            name === 'stage' ? 'Stage' : name,
      value,
    }))
    .sort((a, b) => b.value - a.value)

  const topEntreprises = Object.entries(stats.entreprises)
    .map(([nom, count]) => ({ nom, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const topPostes = Object.entries(stats.postes)
    .map(([nom, count]) => ({ nom, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const topVilles = Object.entries(stats.villesFormation)
    .map(([nom, count]) => ({ nom, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const parPoleData = Object.entries(stats.parPole)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const parFiliereData = Object.entries(stats.parFiliere)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15)

  const genreData = Object.entries(stats.parGenre).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const totalPages = Math.ceil(filteredReponses.length / itemsPerPage)
  const paginatedReponses = filteredReponses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Enquête d'Insertion Professionnelle</h1>
              <p className="text-gray-600 text-lg">Tableau de bord complet et analyse détaillée des données</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyPublicLink}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                Lien public
              </button>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>

          {/* Navigation des vues */}
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200 w-fit">
            <button
              onClick={() => setSelectedView('overview')}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                selectedView === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Vue d'ensemble
            </button>
            <button
              onClick={() => setSelectedView('details')}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                selectedView === 'details'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Info className="w-4 h-4" />
              Détails complets
            </button>
            <button
              onClick={() => setSelectedView('table')}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                selectedView === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Tableau des réponses
            </button>
          </div>
        </div>

        {/* Vue d'ensemble - Indicateur de Parcours Post-Formation */}
        {selectedView === 'overview' && (
          <>
            {/* Carte principale - Indicateur de Parcours Post-Formation */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Indicateur de Parcours Post-Formation</h2>
                    <p className="text-blue-100 text-lg">
                      Pourcentage de stagiaires ayant poursuivi leurs études <strong>OU</strong> trouvé une activité professionnelle
                    </p>
                  </div>
                  <Target className="w-16 h-16 text-white/20" />
                </div>
                <div className="flex items-end gap-8">
                  <div>
                    <div className="text-6xl font-bold mb-2">{stats.tauxInsertionPourcent}%</div>
                    <div className="text-blue-100 text-lg">
                      {stats.tauxInsertionGlobal} sur {stats.total} stagiaires
                    </div>
                  </div>
                  <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-blue-100 mb-1">En poursuite d'études</div>
                        <div className="text-2xl font-bold">{stats.enEtudes}</div>
                      </div>
                      <div>
                        <div className="text-sm text-blue-100 mb-1">En activité professionnelle</div>
                        <div className="text-2xl font-bold">{stats.enActivite}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cartes de métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                  <span className="text-3xl font-bold text-gray-800">{stats.total}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium mb-2">Total réponses</p>
                <div className="text-xs text-gray-500 space-y-1 mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span>Études + Activité:</span>
                    <span className="font-semibold">{stats.etudesEtActivite}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Études seulement:</span>
                    <span className="font-semibold">{stats.etudesSeulement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Activité seulement:</span>
                    <span className="font-semibold">{stats.activiteSeulement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ni études ni activité:</span>
                    <span className="font-semibold">{stats.niEtudesNiActivite}</span>
                  </div>
                  <div className="flex justify-between pt-1 mt-1 border-t border-gray-300 font-bold text-gray-700">
                    <span>Total:</span>
                    <span>{stats.etudesEtActivite + stats.etudesSeulement + stats.activiteSeulement + stats.niEtudesNiActivite}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <GraduationCap className="w-8 h-8 text-green-600" />
                  <span className="text-3xl font-bold text-gray-800">{stats.enEtudes}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium mb-2">En poursuite d'études</p>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  {stats.total > 0 ? Math.round((stats.enEtudes / stats.total) * 100) : 0}% du total
                </p>
                <div className="text-xs text-gray-500 space-y-1 pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span>Études + Activité:</span>
                    <span className="font-semibold text-green-600">{stats.etudesEtActivite}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Études seulement:</span>
                    <span className="font-semibold text-green-600">{stats.etudesSeulement}</span>
                  </div>
                  <div className="flex justify-between pt-1 mt-1 border-t border-gray-300 font-bold text-gray-700">
                    <span>Total:</span>
                    <span>{stats.etudesEtActivite + stats.etudesSeulement}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-4">
                  <Briefcase className="w-8 h-8 text-orange-600" />
                  <span className="text-3xl font-bold text-gray-800">{stats.enActivite}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium mb-2">En activité professionnelle</p>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  {stats.total > 0 ? Math.round((stats.enActivite / stats.total) * 100) : 0}% du total
                </p>
                <div className="text-xs text-gray-500 space-y-1 pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span>Études + Activité:</span>
                    <span className="font-semibold text-orange-600">{stats.etudesEtActivite}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Activité seulement:</span>
                    <span className="font-semibold text-orange-600">{stats.activiteSeulement}</span>
                  </div>
                  <div className="flex justify-between pt-1 mt-1 border-t border-gray-300 font-bold text-gray-700">
                    <span>Total:</span>
                    <span>{stats.etudesEtActivite + stats.activiteSeulement}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <span className="text-3xl font-bold text-gray-800">{stats.tauxInsertionPourcent}%</span>
                </div>
                <p className="text-sm text-gray-600 font-medium mb-2">Indicateur de Parcours Post-Formation</p>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  {stats.tauxInsertionGlobal} stagiaires insérés
                </p>
                <div className="text-xs text-gray-500 space-y-1 pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span>Études + Activité:</span>
                    <span className="font-semibold text-purple-600">{stats.etudesEtActivite}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Études seulement:</span>
                    <span className="font-semibold text-purple-600">{stats.etudesSeulement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Activité seulement:</span>
                    <span className="font-semibold text-purple-600">{stats.activiteSeulement}</span>
                  </div>
                  <div className="flex justify-between pt-1 mt-1 border-t border-gray-300 font-bold text-gray-700">
                    <span>Total insérés:</span>
                    <span>{stats.etudesEtActivite + stats.etudesSeulement + stats.activiteSeulement}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphiques principaux */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Situations combinées */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Situations Combinées
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Répartition des stagiaires selon leur situation (études et/ou activité)
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={situationsCombinéesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {situationsCombinéesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {situationsCombinéesData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Types de formation */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  Types de Formation
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Répartition des types de formation poursuivis par les stagiaires
                </p>
                {typesFormationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={typesFormationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
                )}
              </div>

              {/* Types d'activité */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-orange-600" />
                  Types d'Activité Professionnelle
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Répartition des types d'activité professionnelle
                </p>
                {typesActiviteData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={typesActiviteData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={COLORS.warning} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
                )}
              </div>

              {/* Répartition par genre */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Répartition par Genre
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Distribution des réponses selon le genre
                </p>
                {genreData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_ARRAY[index % COLORS_ARRAY.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
                )}
              </div>
            </div>

            {/* Top entreprises et postes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Top 10 Entreprises Employeuses
                </h3>
                {topEntreprises.length > 0 ? (
                  <div className="space-y-3">
                    {topEntreprises.map((entreprise, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 font-medium">{entreprise.nom}</span>
                        </div>
                        <span className="font-bold text-blue-600">{entreprise.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-green-600" />
                  Top 10 Postes Occupés
                </h3>
                {topPostes.length > 0 ? (
                  <div className="space-y-3">
                    {topPostes.map((poste, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 font-medium">{poste.nom}</span>
                        </div>
                        <span className="font-bold text-green-600">{poste.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Vue détails complets */}
        {selectedView === 'details' && (
          <div className="space-y-6">
            {/* Répartition par pôle */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition par Pôle</h3>
              {parPoleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={parPoleData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
              )}
            </div>

            {/* Répartition par filière */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition par Filière (Top 15)</h3>
              {parFiliereData.length > 0 ? (
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={parFiliereData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={200} />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.success} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
              )}
            </div>

            {/* Villes de formation */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                Top 10 Villes de Formation
              </h3>
              {topVilles.length > 0 ? (
                <div className="space-y-3">
                  {topVilles.map((ville, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="text-gray-700 font-medium">{ville.nom}</span>
                      </div>
                      <span className="font-bold text-red-600">{ville.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
              )}
            </div>

            {/* Explication des données */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Explication des Données
              </h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📊 Indicateur de Parcours Post-Formation</h4>
                  <p>
                    L'indicateur de parcours post-formation représente le pourcentage de stagiaires qui ont <strong>soit</strong> poursuivi leurs études, 
                    <strong>soit</strong> trouvé une activité professionnelle (ou les deux). 
                    Un stagiaire est considéré comme "inséré" s'il remplit au moins l'une de ces conditions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🎓 Poursuite d'Études</h4>
                  <p>
                    Cette section regroupe les stagiaires qui continuent leur formation après leur passage au COP. 
                    Les types de formation incluent : passerelle, licence professionnelle, licence d'excellence, 
                    cycle d'ingénieur, et formation qualifiante.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">💼 Activité Professionnelle</h4>
                  <p>
                    Cette section regroupe les stagiaires qui ont trouvé une activité professionnelle. 
                    Les types d'activité incluent : emploi salarié, travail indépendant/auto-entrepreneur, et stage.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📈 Situations Combinées</h4>
                  <p>
                    Certains stagiaires peuvent à la fois poursuivre leurs études <strong>ET</strong> exercer une activité professionnelle. 
                    Cette catégorie permet de mieux comprendre la réalité de l'insertion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vue tableau */}
        {selectedView === 'table' && (
          <div className="space-y-6">
            {/* Filtres */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher (nom, prénom, entreprise, poste)..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <select
                  value={filters.periode}
                  onChange={(e) => setFilters({ ...filters, periode: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les périodes</option>
                  <option value="month">Dernier mois</option>
                  <option value="year">Dernière année</option>
                </select>
                <select
                  value={filters.pole}
                  onChange={(e) => setFilters({ ...filters, pole: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les pôles</option>
                  {poles.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
                <select
                  value={filters.filiere}
                  onChange={(e) => setFilters({ ...filters, filiere: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les filières</option>
                  {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
                <select
                  value={filters.genre}
                  onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les genres</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {filteredReponses.length} réponse(s) trouvée(s)
                </div>
                <button
                  onClick={exportCSV}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exporter CSV
                </button>
              </div>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pôle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filière</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Études</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activité</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedReponses.map((reponse) => (
                      <tr key={reponse.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {reponse.prenom} {reponse.nom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {reponse.genre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reponse.pole_nom || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reponse.filiere_nom || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reponse.poursuite_etudes ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Oui
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Non
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reponse.en_activite ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Oui
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Non
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                          <div className="space-y-1">
                            {reponse.type_formation && (
                              <div className="text-xs">
                                <span className="font-medium">Formation:</span> {reponse.type_formation.replace('_', ' ')}
                              </div>
                            )}
                            {reponse.entreprise_nom && (
                              <div className="text-xs">
                                <span className="font-medium">Entreprise:</span> {reponse.entreprise_nom}
                              </div>
                            )}
                            {reponse.poste_occupe && (
                              <div className="text-xs">
                                <span className="font-medium">Poste:</span> {reponse.poste_occupe}
                              </div>
                            )}
                            {reponse.brand_activite && (
                              <div className="text-xs">
                                <span className="font-medium">Activité:</span> {reponse.brand_activite}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(reponse.date_soumission).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => deleteReponse(reponse.id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

