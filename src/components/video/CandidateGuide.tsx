'use client'

import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { CANDIDATE_GUIDE_SECTIONS } from '@/lib/videoEvaluationGrid'

export default function CandidateGuide() {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl shadow-black/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-blue-50/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a6bb5] to-[#0f3d6c] text-white flex items-center justify-center shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Guide du candidat</h2>
            <p className="text-xs text-slate-500">Script à suivre pour votre vidéo (2 min max)</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
          <p className="text-sm text-slate-600 pt-4 leading-relaxed">
            Pour mieux élaborer votre vidéo présentative, suivez ce script. Appliquez-vous
            convenablement, détendez-vous et refaites l&apos;essai jusqu&apos;à obtenir une version
            qui vous reflète.
          </p>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {CANDIDATE_GUIDE_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4"
              >
                <h3 className="font-semibold text-[#0f3d6c] text-sm mb-2">{section.title}</h3>
                <ul className="space-y-1.5">
                  {section.items.map((item) => (
                    <li key={item} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-cyan-500 shrink-0 font-bold">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
