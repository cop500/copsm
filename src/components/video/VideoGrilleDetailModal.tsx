'use client'

import { useEffect, useRef } from 'react'
import { Printer, X } from 'lucide-react'
import type { VideoGrillePrintData } from '@/lib/videoAdminStats'
import VideoGrillePrintSheet from './VideoGrillePrintSheet'

interface VideoGrilleDetailModalProps {
  video: VideoGrillePrintData | null
  onClose: () => void
}

export default function VideoGrilleDetailModal({ video, onClose }: VideoGrilleDetailModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handlePrint = () => {
    if (!printRef.current) return
    const html = printRef.current.innerHTML
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Grille — ${video?.prenom} ${video?.nom}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
        .bg-slate-100 { background: #f1f5f9; }
        .bg-blue-50 { background: #eff6ff; }
        .text-\\[\\#0f3d6c\\] { color: #0f3d6c; }
        img { max-height: 56px; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>${html}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 400)
  }

  if (!video) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b bg-white rounded-t-2xl">
          <div>
            <h2 className="font-bold text-gray-900">
              Grille — {video.prenom} {video.nom}
            </h2>
            <p className="text-sm text-gray-500">{video.cine} · {video.filiereLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
            >
              <Printer className="w-4 h-4" /> Imprimer / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg border hover:bg-gray-50"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div ref={printRef} className="p-4 max-h-[70vh] overflow-y-auto">
          <VideoGrillePrintSheet video={video} />
        </div>
      </div>
    </div>
  )
}
