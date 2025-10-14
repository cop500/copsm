'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
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
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Copy,
  Trash2,
} from 'lucide-react'

export default function EnqueteInsertionDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const [stats, setStats] = useState<any>(null)
  const [reponses, setReponses] = useState<any[]>([])
  const [poles, setPoles] = useState<any[]>([])
  const [filieres, setFilieres] = useState<any[]>([])

  const [filters, setFilters] = useState({
    pole: '',
    filiere: '',
    genre: '',
    search: '',
  })

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, filters])

  const checkUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single()

    // Autoriser admin et Siham El Omari
    const isAuthorized = profile?.role === 'business_developer' || currentUser.email === 'siham.elomari@example.com'

    if (!isAuthorized) {
      router.push('/dashboard')
      return
    }

    setUser(profile)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        polesRes,
        filieresRes,
        reponsesRes,
      ] = await Promise.all([
        supabase.from('poles').select('*').order('nom'),
        supabase.from('filieres').select('*').order('nom'),
        supabase.from('enquete_reponses').select('*').order('date_soumission', { ascending: false }),
      ])

      if (polesRes.data) setPoles(polesRes.data)
      if (filieresRes.data) setFilieres(filieresRes.data)
      if (reponsesRes.data) setReponses(reponsesRes.data)

      calculateStats(reponsesRes.data || [])
    } catch (err) {
      console.error('Erreur chargement données:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: any[]) => {
    const total = data.length

    const genreStats = data.reduce((acc, r) => {
      acc[r.genre] = (acc[r.genre] || 0) + 1
      return acc
    }, {})

    const enEtudes = data.filter(r => r.poursuite_etudes).length
    const pasEtudes = data.filter(r => !r.poursuite_etudes).length

    const formationStats = data
      .filter(r => r.type_formation)
      .reduce((acc, r) => {
        acc[r.type_formation] = (acc[r.type_formation] || 0) + 1
        return acc
      }, {})

    const enActivite = data.filter(r => r.en_activite).length
    const sansActivite = data.filter(r => !r.en_activite).length

    const activiteStats = data
      .filter(r => r.type_activite)
      .reduce((acc, r) => {
        acc[r.type_activite] = (acc[r.type_activite] || 0) + 1
        return acc
      }, {})

    const entreprisesStats = data
      .filter(r => r.entreprise_nom)
      .reduce((acc, r) => {
        acc[r.entreprise_nom] = (acc[r.entreprise_nom] || 0) + 1
        return acc
      }, {})

    const topEntreprises = Object.entries(entreprisesStats)
      .map(([nom, count]) => ({ nom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const tauxInsertion = data.filter(r => r.poursuite_etudes || r.en_activite).length

    setStats({
      total,
      repondues: total,
      enAttente: 0,
      expires: 0,
      tauxReponse: 100,
      genreStats,
      enEtudes,
      pasEtudes,
      formationStats,
      enActivite,
      sansActivite,
      activiteStats,
      topEntreprises,
      tauxInsertion,
      tauxInsertionPourcent: total > 0 ? Math.round((tauxInsertion / total) * 100) : 0,
    })
  }

  const deleteReponse = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('enquete_reponses')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Recharger les données
      await loadData()
      alert('Réponse supprimée avec succès')
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression')
    }
  }

  const exportCSV = () => {
    const headers = ['Nom', 'Prénom', 'Genre', 'Pôle', 'Filière', 'Poursuite études', 'Type formation', 'En activité', 'Type activité', 'Entreprise', 'Date']
    const rows = reponses.map(r => [
      r.nom,
      r.prenom,
      r.genre,
      r.pole_nom,
      r.filiere_nom,
      r.poursuite_etudes ? 'Oui' : 'Non',
      r.type_formation || '',
      r.en_activite ? 'Oui' : 'Non',
      r.type_activite || '',
      r.entreprise_nom || '',
      new Date(r.date_soumission).toLocaleDateString('fr-FR'),
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enquete_insertion_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const copyPublicLink = () => {
    const link = `${window.location.origin}/enquete-insertion/public`
    navigator.clipboard.writeText(link)
    alert(`✅ Lien public copié !\n\n${link}\n\nPartagez ce lien avec tous vos stagiaires.`)
  }

  const filteredReponses = reponses.filter(r => {
    if (filters.pole && r.pole_id !== filters.pole) return false
    if (filters.filiere && r.filiere_id !== filters.filiere) return false
    if (filters.genre && r.genre !== filters.genre) return false
    if (filters.search) {
      const search = filters.search.toLowerCase()
      if (!r.nom.toLowerCase().includes(search) && !r.prenom.toLowerCase().includes(search)) return false
    }
    return true
  })

  const totalPages = Math.ceil(filteredReponses.length / itemsPerPage)
  const paginatedReponses = filteredReponses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const genreData = stats ? Object.entries(stats.genreStats).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  })) : []

  const formationData = stats ? Object.entries(stats.formationStats).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  })) : []

  const activiteData = stats ? Object.entries(stats.activiteStats).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  })) : []

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Enquête d'Insertion</h1>
          <p className="text-gray-600">Suivi et statistiques des enquêtes d'insertion professionnelle</p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Lien public de l'enquête</h3>
              <p className="text-sm text-gray-600 mb-2">Partagez ce lien avec tous vos stagiaires :</p>
              <code className="text-sm bg-white px-3 py-2 rounded border border-green-300 text-green-700">
                {typeof window !== 'undefined' ? `${window.location.origin}/enquete-insertion/public` : ''}
              </code>
            </div>
            <button
              onClick={copyPublicLink}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg"
            >
              <Copy className="w-5 h-5" />
              Copier le lien
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats?.total || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Total réponses</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats?.repondues || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Réponses reçues</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats?.enActivite || 0}</span>
            </div>
            <p className="text-sm text-gray-600">En activité</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats?.tauxInsertionPourcent || 0}%</span>
            </div>
            <p className="text-sm text-gray-600">Taux d'insertion</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition par Genre</h3>
            {genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Poursuite d'Études</h3>
            <div className="space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">En poursuite d'études</span>
                <span className="font-semibold text-blue-600">{stats?.enEtudes || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pas en poursuite d'études</span>
                <span className="font-semibold text-gray-600">{stats?.pasEtudes || 0}</span>
              </div>
            </div>
            {formationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={formationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune donnée disponible</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Situation Professionnelle</h3>
            <div className="space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">En activité</span>
                <span className="font-semibold text-green-600">{stats?.enActivite || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sans activité</span>
                <span className="font-semibold text-gray-600">{stats?.sansActivite || 0}</span>
              </div>
            </div>
            {activiteData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activiteData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune donnée disponible</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Entreprises Employeuses</h3>
            {stats?.topEntreprises?.length > 0 ? (
              <div className="space-y-2">
                {stats.topEntreprises.slice(0, 10).map((entreprise: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-700">{entreprise.nom}</span>
                    <span className="font-semibold text-blue-600">{entreprise.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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

          <div className="flex items-center gap-4">
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Réponses ({filteredReponses.length})
            </h3>
          </div>
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
                      {reponse.pole_nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reponse.filiere_nom}
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
    </div>
  )
}

