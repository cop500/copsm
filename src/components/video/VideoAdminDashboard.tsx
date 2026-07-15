'use client'

import { BarChart3, CheckCircle2, Clock, UserCheck, Users, Video } from 'lucide-react'
import type { VideoAdminStats } from '@/lib/videoAdminStats'

interface VideoAdminDashboardProps {
  stats: VideoAdminStats
}

const cards = [
  {
    key: 'totalVideos',
    label: 'Vidéos déposées',
    icon: Video,
    color: 'text-violet-600 bg-violet-50',
    getValue: (s: VideoAdminStats) => s.totalVideos,
  },
  {
    key: 'formateurs',
    label: 'Formateurs actifs',
    icon: Users,
    color: 'text-blue-600 bg-blue-50',
    getValue: (s: VideoAdminStats) => `${s.formateursActifs} / ${s.totalFormateurs}`,
  },
  {
    key: 'pending',
    label: 'En attente d\'affectation',
    icon: Clock,
    color: 'text-amber-600 bg-amber-50',
    getValue: (s: VideoAdminStats) => s.enAttenteAffectation,
  },
  {
    key: 'assigned',
    label: 'Vidéos affectées',
    icon: UserCheck,
    color: 'text-cyan-600 bg-cyan-50',
    getValue: (s: VideoAdminStats) => s.affectees,
  },
  {
    key: 'evaluated',
    label: 'Vidéos évaluées',
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-50',
    getValue: (s: VideoAdminStats) => s.evaluees,
  },
  {
    key: 'average',
    label: 'Note moyenne /30',
    icon: BarChart3,
    color: 'text-indigo-600 bg-indigo-50',
    getValue: (s: VideoAdminStats) => (s.noteMoyenne != null ? `${s.noteMoyenne}/30` : '—'),
  },
] as const

export default function VideoAdminDashboard({ stats }: VideoAdminDashboardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.key}
            className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex p-2 rounded-lg ${card.color} mb-2`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.getValue(stats)}</p>
            <p className="text-xs text-gray-500 mt-1 leading-snug">{card.label}</p>
          </div>
        )
      })}
    </div>
  )
}
