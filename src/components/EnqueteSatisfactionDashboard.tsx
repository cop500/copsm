'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useEnqueteSatisfaction } from '@/hooks/useEnqueteSatisfaction'
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
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp,
  Users,
  Star,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  Calendar,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react'
import * as XLSX from 'xlsx'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export const EnqueteSatisfactionDashboard: React.FC = () => {
  const { enquetes, loading, error, fetchEnquetes, deleteEnquete, getStats } = useEnqueteSatisfaction()
  const [selectedEnquete, setSelectedEnquete] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const stats = getStats()

  // Chargement du rôle pour afficher les actions admin
  useEffect(() => {
    const loadRole = async () => {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()
        if (!user) {
          console.log('Aucun utilisateur connecté')
          return
        }
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Erreur lors du chargement du profil:', error)
          return
        }
        
        // Vérifier plusieurs rôles admin possibles
        const adminRoles = ['business_developer', 'manager_cop', 'directeur']
        if (profile?.role && adminRoles.includes(profile.role)) {
          console.log('Rôle admin détecté:', profile.role)
          setIsAdmin(true)
        } else {
          console.log('Rôle non-admin:', profile?.role)
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du rôle:', err)
      }
    }
    loadRole()
  }, [])

  // Filtrer les enquêtes
  const filteredEnquetes = useMemo(() => {
    if (!searchTerm) return enquetes
    const term = searchTerm.toLowerCase()
    return enquetes.filter(e =>
      e.nom_entreprise.toLowerCase().includes(term) ||
      e.nom_representant.toLowerCase().includes(term) ||
      e.email_entreprise.toLowerCase().includes(term)
    )
  }, [enquetes, searchTerm])

  // Données pour les graphiques
  const satisfactionLauréatsData = [
    { name: 'Niveau technique', moyenne: stats.moyenneNiveauTechnique.toFixed(1) },
    { name: 'Communication', moyenne: stats.moyenneCommunication.toFixed(1) },
    { name: 'Soft skills', moyenne: stats.moyenneSoftSkills.toFixed(1) },
    { name: 'Adéquation', moyenne: stats.moyenneAdequation.toFixed(1) }
  ]

  const satisfactionJDData = [
    { name: 'Organisation', moyenne: stats.moyenneOrganisation.toFixed(1) },
    { name: 'Accueil', moyenne: stats.moyenneAccueil.toFixed(1) },
    { name: 'Communication', moyenne: stats.moyenneCommunicationEvent.toFixed(1) },
    { name: 'Pertinence', moyenne: stats.moyennePertinence.toFixed(1) },
    { name: 'Fluidité', moyenne: stats.moyenneFluidite.toFixed(1) },
    { name: 'Logistique', moyenne: stats.moyenneLogistique.toFixed(1) }
  ]

  const profilsInteressantsData = [
    { name: 'Oui', value: stats.profilsInteressants.oui },
    { name: 'Non', value: stats.profilsInteressants.non },
    { name: 'En cours', value: stats.profilsInteressants.en_cours }
  ]

  const intentionsRevenirData = [
    { name: 'Oui', value: stats.intentionsRevenir.oui },
    { name: 'Non', value: stats.intentionsRevenir.non },
    { name: 'Peut-être', value: stats.intentionsRevenir.peut_etre }
  ]

  // Exporter en Excel
  const exportToExcel = () => {
    const data = enquetes.map(e => ({
      'Date': new Date(e.created_at).toLocaleDateString('fr-FR'),
      'Entreprise': e.nom_entreprise,
      'Représentant': e.nom_representant,
      'Fonction': e.fonction_representant,
      'Email': e.email_entreprise,
      'Téléphone': e.telephone_entreprise || '',
      'Niveau technique': e.niveau_technique || '',
      'Communication': e.communication || '',
      'Soft skills': e.soft_skills || '',
      'Adéquation': e.adequation_besoins || '',
      'Profil intéressant': e.profil_interessant || '',
      'Intention recruter': e.intention_recruter || '',
      'Organisation globale': e.organisation_globale || '',
      'Accueil': e.accueil_accompagnement || '',
      'Communication avant event': e.communication_avant_event || '',
      'Pertinence profils': e.pertinence_profils || '',
      'Fluidité': e.fluidite_delais || '',
      'Logistique': e.logistique_espace || '',
      'Profils retenus': e.nombre_profils_retenus || '',
      'Intention revenir': e.intention_revenir || '',
      'Recommandation': e.recommandation_autres_entreprises || '',
      'Suggestions': e.suggestions || ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Enquêtes')
    XLSX.writeFile(wb, `enquetes_satisfaction_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Télécharger un template Excel (admin)
  const downloadTemplate = () => {
    const sample = [
      {
        nom_entreprise: 'Exemple SARL',
        nom_representant: 'Marie Dupont',
        fonction_representant: 'DRH',
        email_entreprise: 'contact@exemple.com',
        telephone_entreprise: '0600000000',
        niveau_technique: 4,
        communication: 4,
        soft_skills: 5,
        adequation_besoins: 4,
        profil_interessant: 'oui',
        intention_recruter: 'peut_etre',
        organisation_globale: 5,
        accueil_accompagnement: 5,
        communication_avant_event: 4,
        pertinence_profils: 4,
        fluidite_delais: 4,
        logistique_espace: 5,
        nombre_profils_retenus: '2-5',
        intention_revenir: 'oui',
        recommandation_autres_entreprises: 'oui',
        suggestions: 'Exemple de remarque facultative'
      }
    ]
    const ws = XLSX.utils.json_to_sheet(sample)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'template_enquete_satisfaction.xlsx')
  }

  // Importer un fichier Excel (admin)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheet = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheet]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      if (!rows.length) {
        alert('Le fichier est vide.')
        return
      }

      const required = ['nom_entreprise', 'nom_representant', 'fonction_representant', 'email_entreprise']
      const missingHeaders = required.filter((h) => !(h in rows[0]))
      if (missingHeaders.length) {
        alert(`En-têtes manquants dans le fichier : ${missingHeaders.join(', ')}`)
        return
      }

      const {
        data: { session }
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        alert('Session expirée, veuillez vous reconnecter.')
        return
      }

      const res = await fetch('/api/enquete-satisfaction/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rows })
      })

      const json = await res.json()
      if (!res.ok) {
        alert(`Import en erreur : ${json.error || 'Erreur inconnue'}`)
        return
      }

      await fetchEnquetes(true)
      alert(`Import terminé : ${json.imported} lignes importées. ${json.rejected?.length || 0} rejetées.`)
    } catch (err: any) {
      console.error('Erreur import Excel:', err)
      alert('Erreur lors de l’import. Vérifiez le format du fichier.')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Supprimer une enquête
  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette enquête ?')) {
      await deleteEnquete(id)
    }
  }

  // Voir les détails
  const handleViewDetail = (enquete: any) => {
    setSelectedEnquete(enquete)
    setShowDetail(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>Erreur : {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec les 4 indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Taux de Satisfaction Global (NPS-like) */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-semibold text-blue-700 mb-1">Taux de Satisfaction Global</p>
          <p className="text-4xl font-bold text-blue-900 mb-1">{stats.tauxSatisfactionGlobal}%</p>
          <p className="text-xs text-blue-600">NPS-like (Fidélité + Advocacy)</p>
        </div>

        {/* 2. Qualité des Lauréats */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-semibold text-green-700 mb-1">Qualité des Lauréats</p>
          <p className="text-4xl font-bold text-green-900 mb-1">{stats.qualiteLaureats.toFixed(1)}/5</p>
          <p className="text-xs text-green-600">Score composite (4 critères)</p>
        </div>

        {/* 3. Taux de Conversion Recrutement */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-semibold text-purple-700 mb-1">Taux de Conversion</p>
          <p className="text-4xl font-bold text-purple-900 mb-1">{stats.tauxConversionRecrutement}%</p>
          <p className="text-xs text-purple-600">Recrutement (Matching)</p>
        </div>

        {/* 4. Performance des Services */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm border-2 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-semibold text-orange-700 mb-1">Performance des Services</p>
          <p className="text-4xl font-bold text-orange-900 mb-1">{stats.performanceServices.toFixed(1)}/5</p>
          <p className="text-xs text-orange-600">Score composite (6 critères)</p>
        </div>
      </div>

      {/* Graphiques - Section principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Satisfaction lauréats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Satisfaction concernant les lauréats</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={satisfactionLauréatsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="moyenne" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Satisfaction par rapport à nos services */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Satisfaction par rapport à nos services</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={satisfactionJDData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="moyenne" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphiques - Profils intéressants et Intention de revenir - Design créatif */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Profils intéressants - Diagramme en barres verticales créatif */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 p-6 rounded-2xl shadow-xl border-2 border-blue-300 relative overflow-hidden">
          {/* Effet de fond décoratif */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-200 rounded-full blur-2xl opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Profils intéressants trouvés</h3>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                {stats.profilsInteressants.oui + stats.profilsInteressants.non + stats.profilsInteressants.en_cours} réponses
              </div>
            </div>

            {/* Graphique en barres verticales avec design créatif */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-blue-100">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={profilsInteressantsData.map(item => ({
                    ...item,
                    name: item.name === 'En cours' ? 'En cours' : item.name
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorOui" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="colorNon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="colorEnCours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                      <stop offset="100%" stopColor="#D97706" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #3b82f6',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any) => [`${value} réponses`, 'Nombre']}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[12, 12, 0, 0]}
                    strokeWidth={2}
                  >
                    {profilsInteressantsData.map((entry, index) => {
                      let fillColor = ''
                      if (entry.name === 'Oui') fillColor = 'url(#colorOui)'
                      else if (entry.name === 'Non') fillColor = 'url(#colorNon)'
                      else fillColor = 'url(#colorEnCours)'
                      
                      return (
                        <Cell key={`cell-${index}`} fill={fillColor} stroke={fillColor} strokeWidth={2} />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cartes statistiques avec icônes */}
            <div className="grid grid-cols-3 gap-3">
              {profilsInteressantsData.map((item, index) => {
                const total = stats.profilsInteressants.oui + stats.profilsInteressants.non + stats.profilsInteressants.en_cours
                const percentage = total > 0 ? (item.value / total) * 100 : 0
                const iconMap: { [key: string]: any } = {
                  'Oui': CheckCircle,
                  'Non': XCircle,
                  'En cours': Clock
                }
                const colorMap: { [key: string]: string } = {
                  'Oui': 'from-green-500 to-green-600',
                  'Non': 'from-red-500 to-red-600',
                  'En cours': 'from-yellow-500 to-orange-500'
                }
                const bgColorMap: { [key: string]: string } = {
                  'Oui': 'bg-green-50 border-green-200',
                  'Non': 'bg-red-50 border-red-200',
                  'En cours': 'bg-yellow-50 border-yellow-200'
                }
                const Icon = iconMap[item.name] || CheckCircle
                
                return (
                  <div key={item.name} className={`${bgColorMap[item.name]} rounded-xl p-4 border-2 transition-transform hover:scale-105`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 text-${item.name === 'Oui' ? 'green' : item.name === 'Non' ? 'red' : 'yellow'}-600`} />
                      <span className="text-xs font-semibold text-gray-600 uppercase">{item.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{item.value}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Intentions de revenir - Diagramme en barres verticales créatif */}
        <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 rounded-2xl shadow-xl border-2 border-purple-300 relative overflow-hidden">
          {/* Effet de fond décoratif */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-200 rounded-full blur-2xl opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Intention de revenir</h3>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                {stats.intentionsRevenir.oui + stats.intentionsRevenir.non + stats.intentionsRevenir.peut_etre} réponses
              </div>
            </div>

            {/* Graphique en barres verticales avec design créatif */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-purple-100">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={intentionsRevenirData.map(item => ({
                    ...item,
                    name: item.name === 'Peut-être' ? 'Peut-être' : item.name
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorOuiRevenir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="colorNonRevenir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="colorPeutEtre" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F97316" stopOpacity={1} />
                      <stop offset="100%" stopColor="#EA580C" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #8b5cf6',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any) => [`${value} réponses`, 'Nombre']}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[12, 12, 0, 0]}
                    strokeWidth={2}
                  >
                    {intentionsRevenirData.map((entry, index) => {
                      let fillColor = ''
                      if (entry.name === 'Oui') fillColor = 'url(#colorOuiRevenir)'
                      else if (entry.name === 'Non') fillColor = 'url(#colorNonRevenir)'
                      else fillColor = 'url(#colorPeutEtre)'
                      
                      return (
                        <Cell key={`cell-${index}`} fill={fillColor} stroke={fillColor} strokeWidth={2} />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cartes statistiques avec icônes */}
            <div className="grid grid-cols-3 gap-3">
              {intentionsRevenirData.map((item, index) => {
                const total = stats.intentionsRevenir.oui + stats.intentionsRevenir.non + stats.intentionsRevenir.peut_etre
                const percentage = total > 0 ? (item.value / total) * 100 : 0
                const iconMap: { [key: string]: any } = {
                  'Oui': CheckCircle,
                  'Non': XCircle,
                  'Peut-être': Clock
                }
                const bgColorMap: { [key: string]: string } = {
                  'Oui': 'bg-green-50 border-green-200',
                  'Non': 'bg-red-50 border-red-200',
                  'Peut-être': 'bg-orange-50 border-orange-200'
                }
                const Icon = iconMap[item.name] || CheckCircle
                
                return (
                  <div key={item.name} className={`${bgColorMap[item.name]} rounded-xl p-4 border-2 transition-transform hover:scale-105`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 text-${item.name === 'Oui' ? 'green' : item.name === 'Non' ? 'red' : 'orange'}-600`} />
                      <span className="text-xs font-semibold text-gray-600 uppercase">{item.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{item.value}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des enquêtes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Liste des enquêtes</h3>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter Excel
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Template admin
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" />
                  {importing ? 'Import...' : 'Importer Excel'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </>
            )}
            <button
              onClick={() => fetchEnquetes(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Recherche */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Rechercher par entreprise, représentant ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 px-3 py-2 bg-gray-100 rounded-lg">
              Admin: {isAdmin ? '✅ Oui' : '❌ Non'}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Représentant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEnquetes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucune enquête trouvée
                  </td>
                </tr>
              ) : (
                filteredEnquetes.map((enquete) => (
                  <tr key={enquete.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(enquete.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {enquete.nom_entreprise}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {enquete.nom_representant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {enquete.email_entreprise}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(enquete)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-50"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin ? (
                          <button
                            onClick={() => handleDelete(enquete.id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
                            title="Supprimer (Admin uniquement)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de détails */}
      {showDetail && selectedEnquete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Détails de l'enquête</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Informations entreprise */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Informations entreprise</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Entreprise</p>
                    <p className="font-medium">{selectedEnquete.nom_entreprise}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Représentant</p>
                    <p className="font-medium">{selectedEnquete.nom_representant}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fonction</p>
                    <p className="font-medium">{selectedEnquete.fonction_representant}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedEnquete.email_entreprise}</p>
                  </div>
                  {selectedEnquete.telephone_entreprise && (
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="font-medium">{selectedEnquete.telephone_entreprise}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {new Date(selectedEnquete.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </section>

              {/* Satisfaction lauréats */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Satisfaction concernant les lauréats</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedEnquete.niveau_technique && (
                    <div>
                      <p className="text-sm text-gray-600">Niveau technique</p>
                      <p className="font-medium">{selectedEnquete.niveau_technique}/5</p>
                    </div>
                  )}
                  {selectedEnquete.communication && (
                    <div>
                      <p className="text-sm text-gray-600">Communication</p>
                      <p className="font-medium">{selectedEnquete.communication}/5</p>
                    </div>
                  )}
                  {selectedEnquete.soft_skills && (
                    <div>
                      <p className="text-sm text-gray-600">Soft skills</p>
                      <p className="font-medium">{selectedEnquete.soft_skills}/5</p>
                    </div>
                  )}
                  {selectedEnquete.adequation_besoins && (
                    <div>
                      <p className="text-sm text-gray-600">Adéquation</p>
                      <p className="font-medium">{selectedEnquete.adequation_besoins}/5</p>
                    </div>
                  )}
                  {selectedEnquete.profil_interessant && (
                    <div>
                      <p className="text-sm text-gray-600">Profil intéressant</p>
                      <p className="font-medium capitalize">{selectedEnquete.profil_interessant.replace('_', ' ')}</p>
                    </div>
                  )}
                  {selectedEnquete.intention_recruter && (
                    <div>
                      <p className="text-sm text-gray-600">Intention de recruter</p>
                      <p className="font-medium capitalize">{selectedEnquete.intention_recruter.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Satisfaction par rapport à nos services */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Satisfaction par rapport à nos services</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedEnquete.organisation_globale && (
                    <div>
                      <p className="text-sm text-gray-600">Organisation globale</p>
                      <p className="font-medium">{selectedEnquete.organisation_globale}/5</p>
                    </div>
                  )}
                  {selectedEnquete.accueil_accompagnement && (
                    <div>
                      <p className="text-sm text-gray-600">Accueil et accompagnement</p>
                      <p className="font-medium">{selectedEnquete.accueil_accompagnement}/5</p>
                    </div>
                  )}
                  {selectedEnquete.communication_avant_event && (
                    <div>
                      <p className="text-sm text-gray-600">Communication avant l'événement</p>
                      <p className="font-medium">{selectedEnquete.communication_avant_event}/5</p>
                    </div>
                  )}
                  {selectedEnquete.pertinence_profils && (
                    <div>
                      <p className="text-sm text-gray-600">Pertinence des profils</p>
                      <p className="font-medium">{selectedEnquete.pertinence_profils}/5</p>
                    </div>
                  )}
                  {selectedEnquete.fluidite_delais && (
                    <div>
                      <p className="text-sm text-gray-600">Fluidité / délais</p>
                      <p className="font-medium">{selectedEnquete.fluidite_delais}/5</p>
                    </div>
                  )}
                  {selectedEnquete.logistique_espace && (
                    <div>
                      <p className="text-sm text-gray-600">Logistique / espace</p>
                      <p className="font-medium">{selectedEnquete.logistique_espace}/5</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Retombées */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Retombées</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedEnquete.nombre_profils_retenus && (
                    <div>
                      <p className="text-sm text-gray-600">Nombre de profils retenus</p>
                      <p className="font-medium">{selectedEnquete.nombre_profils_retenus}</p>
                    </div>
                  )}
                  {selectedEnquete.intention_revenir && (
                    <div>
                      <p className="text-sm text-gray-600">Intention de revenir</p>
                      <p className="font-medium capitalize">{selectedEnquete.intention_revenir.replace('_', ' ')}</p>
                    </div>
                  )}
                  {selectedEnquete.recommandation_autres_entreprises && (
                    <div>
                      <p className="text-sm text-gray-600">Recommandation</p>
                      <p className="font-medium capitalize">{selectedEnquete.recommandation_autres_entreprises}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Suggestions */}
              {selectedEnquete.suggestions && (
                <section>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Suggestions</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedEnquete.suggestions}</p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

