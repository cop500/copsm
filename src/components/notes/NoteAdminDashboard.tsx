'use client'

import { Users, CheckCircle2, Clock, FileSpreadsheet } from 'lucide-react'

interface NoteAdminDashboardProps {
  total: number
  traites: number
  restants: number
  agentsActifs: number
}

export default function NoteAdminDashboard({
  total,
  traites,
  restants,
  agentsActifs,
}: NoteAdminDashboardProps) {
  const pct = total > 0 ? Math.round((traites / total) * 100) : 0

  const cards = [
    {
      label: 'Candidats importés',
      value: total,
      icon: FileSpreadsheet,
      color: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      label: 'Notes saisies',
      value: traites,
      sub: `${pct} %`,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      label: 'Restants',
      value: restants,
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      label: 'Agents actifs',
      value: agentsActifs,
      icon: Users,
      color: 'bg-violet-50 text-violet-700 border-violet-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.label}
            className={`rounded-xl border p-4 ${c.color}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium opacity-80">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.value}</p>
                {c.sub && <p className="text-xs mt-0.5 opacity-70">{c.sub}</p>}
              </div>
              <Icon className="w-8 h-8 opacity-40" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
