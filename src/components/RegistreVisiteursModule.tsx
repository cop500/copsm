'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/hooks/useRole'
import {
  Users,
  Copy,
  Download,
  RefreshCw,
  Briefcase,
  Compass,
  CircleHelp,
  Calendar,
  Phone,
  School,
  BadgeCheck,
} from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

type TypeVisite = 'orientation' | 'entreprise' | 'autre'

interface RegistreVisiteur {
  id: string
  nom: string
  prenom: string
  genre?: 'homme' | 'femme' | null
  telephone: string
  niveau_scolaire?: 'primaire' | 'college' | 'lycee' | 'bachelier' | 'universitaire' | null
  niveau_souhaite?:
    | 'technicien_specialise'
    | 'technicien'
    | 'qualification'
    | 'formation_qualifiante'
    | null
  type_visite: TypeVisite
  pole_nom?: string | null
  motif_autre?: string | null
  created_at: string
}

const TYPE_LABEL: Record<TypeVisite, string> = {
  orientation: 'Orientation',
  entreprise: 'Entreprise',
  autre: 'Autre',
}

const NIVEAU_SCOLAIRE_LABEL: Record<NonNullable<RegistreVisiteur['niveau_scolaire']>, string> = {
  primaire: 'Niveau primaire',
  college: 'Collegien',
  lycee: 'Lyceen',
  bachelier: 'Bachelier',
  universitaire: 'Universitaire',
}

const NIVEAU_SOUHAITE_LABEL: Record<NonNullable<RegistreVisiteur['niveau_souhaite']>, string> = {
  technicien_specialise: 'Technicien specialise',
  technicien: 'Technicien',
  qualification: 'Qualification',
  formation_qualifiante: 'Formation qualifiante',
}

export default function RegistreVisiteursModule() {
  const { isAdmin } = useRole()
  const [loading, setLoading] = useState(true)
  const [visiteurs, setVisiteurs] = useState<RegistreVisiteur[]>([])
  const [typeFilter, setTypeFilter] = useState<'tous' | TypeVisite>('tous')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('registre_visiteurs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVisiteurs((data as RegistreVisiteur[]) || [])
    } catch (err) {
      console.error('Erreur chargement registre visiteurs:', err)
      alert('Erreur lors du chargement du registre des visiteurs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredVisiteurs = useMemo(() => {
    return visiteurs.filter((v) => {
      const matchesType = typeFilter === 'tous' || v.type_visite === typeFilter
      const q = search.trim().toLowerCase()
      const matchesSearch =
        q === '' ||
        `${v.nom} ${v.prenom}`.toLowerCase().includes(q) ||
        v.telephone.toLowerCase().includes(q) ||
        (v.pole_nom || '').toLowerCase().includes(q) ||
        (v.motif_autre || '').toLowerCase().includes(q) ||
        (v.niveau_scolaire ? NIVEAU_SCOLAIRE_LABEL[v.niveau_scolaire].toLowerCase().includes(q) : false) ||
        (v.niveau_souhaite ? NIVEAU_SOUHAITE_LABEL[v.niveau_souhaite].toLowerCase().includes(q) : false)

      const createdAt = new Date(v.created_at)
      const matchesFrom = dateFrom ? createdAt >= new Date(`${dateFrom}T00:00:00`) : true
      const matchesTo = dateTo ? createdAt <= new Date(`${dateTo}T23:59:59`) : true
      return matchesType && matchesSearch && matchesFrom && matchesTo
    })
  }, [visiteurs, typeFilter, search, dateFrom, dateTo])

  const counts = useMemo(() => {
    return {
      total: visiteurs.length,
      orientation: visiteurs.filter((v) => v.type_visite === 'orientation').length,
      entreprise: visiteurs.filter((v) => v.type_visite === 'entreprise').length,
      autre: visiteurs.filter((v) => v.type_visite === 'autre').length,
    }
  }, [visiteurs])

  const copyPublicLink = async () => {
    const link = `${window.location.origin}/registre-visiteurs/public`
    await navigator.clipboard.writeText(link)
    alert(`Lien copié:\n${link}`)
  }

  const exportExcel = () => {
    const data = filteredVisiteurs.map((v) => ({
      Date: new Date(v.created_at).toLocaleString('fr-FR'),
      Nom: v.nom,
      Prenom: v.prenom,
      Genre: v.genre || '',
      Telephone: v.telephone,
      Niveau_scolaire: v.niveau_scolaire ? NIVEAU_SCOLAIRE_LABEL[v.niveau_scolaire] : '',
      Niveau_souhaite: v.niveau_souhaite ? NIVEAU_SOUHAITE_LABEL[v.niveau_souhaite] : '',
      Type_visite: TYPE_LABEL[v.type_visite],
      Pole_interet: v.pole_nom || '',
      Motif_autre: v.motif_autre || '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Visiteurs')
    XLSX.writeFile(wb, `registre_visiteurs_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const chartData = useMemo(() => {
    return [
      { name: 'Orientation', value: filteredVisiteurs.filter((v) => v.type_visite === 'orientation').length },
      { name: 'Entreprise', value: filteredVisiteurs.filter((v) => v.type_visite === 'entreprise').length },
      { name: 'Autre', value: filteredVisiteurs.filter((v) => v.type_visite === 'autre').length },
    ]
  }, [filteredVisiteurs])

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-700 font-medium">Acces reserve aux administrateurs.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Registre des visiteurs
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Suivi des visiteurs COP via un formulaire public simple.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyPublicLink}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
            >
              <Copy className="w-4 h-4" />
              Copier lien public
            </button>
            <button
              type="button"
              onClick={exportExcel}
              className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Download className="w-4 h-4" />
              Exporter Excel
            </button>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Orientation</p>
          <p className="text-2xl font-bold text-blue-700">{counts.orientation}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Entreprise</p>
          <p className="text-2xl font-bold text-indigo-700">{counts.entreprise}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Autre</p>
          <p className="text-2xl font-bold text-gray-700">{counts.autre}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, prenom, telephone, pole..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'tous' | TypeVisite)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="tous">Tous les objets de visite</option>
            <option value="orientation">Orientation</option>
            <option value="entreprise">Entreprise</option>
            <option value="autre">Autre</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <div className="text-sm text-gray-600 flex items-center justify-end">
            {filteredVisiteurs.length} visite(s)
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Repartition par objet de visite (periode filtree)</h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : filteredVisiteurs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun visiteur pour ces filtres.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredVisiteurs.map((v) => (
              <div key={v.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {v.nom} {v.prenom}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-3 flex-wrap">
                    {v.genre && <span className="capitalize">Genre: {v.genre}</span>}
                    {v.niveau_scolaire && (
                      <span className="inline-flex items-center gap-1">
                        <School className="w-4 h-4" />
                        Niveau scolaire: {NIVEAU_SCOLAIRE_LABEL[v.niveau_scolaire]}
                      </span>
                    )}
                    {v.niveau_souhaite && (
                      <span className="inline-flex items-center gap-1">
                        <BadgeCheck className="w-4 h-4" />
                        Niveau souhaite: {NIVEAU_SOUHAITE_LABEL[v.niveau_souhaite]}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {v.telephone}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {v.type_visite === 'orientation' && <Compass className="w-4 h-4" />}
                      {v.type_visite === 'entreprise' && <Briefcase className="w-4 h-4" />}
                      {v.type_visite === 'autre' && <CircleHelp className="w-4 h-4" />}
                      {TYPE_LABEL[v.type_visite]}
                    </span>
                    {v.pole_nom && <span>Pole: {v.pole_nom}</span>}
                    {v.motif_autre && <span>Motif: {v.motif_autre}</span>}
                  </p>
                </div>
                <div className="text-sm text-gray-500 inline-flex items-center gap-1 whitespace-nowrap">
                  <Calendar className="w-4 h-4" />
                  {new Date(v.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

