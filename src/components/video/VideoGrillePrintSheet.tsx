'use client'

import {
  EVALUATION_CONTENU_CRITERIA,
  EVALUATION_FORME_CRITERIA,
  EVALUATION_MAX_CONTENU,
  EVALUATION_MAX_FORME,
  EVALUATION_MAX_TOTAL,
  formatPoints,
  type GrilleEvaluationData,
} from '@/lib/videoEvaluationGrid'
import { COP_LOGO_URL } from '@/lib/videoPortalAssets'
import type { VideoGrillePrintData } from '@/lib/videoAdminStats'

interface VideoGrillePrintSheetProps {
  video: VideoGrillePrintData
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function CriteriaTable({
  title,
  subtitle,
  criteria,
  grille,
}: {
  title: string
  subtitle: string
  criteria: typeof EVALUATION_CONTENU_CRITERIA
  grille: GrilleEvaluationData | null
}) {
  const subtotal = criteria.reduce(
    (s, c) => s + (Number(grille?.scores?.[c.id]) || 0),
    0
  )
  const max = criteria.reduce((s, c) => s + c.maxPoints, 0)

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-[#0f3d6c] uppercase tracking-wide mb-1">
        {title}
      </h3>
      <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
      <table className="w-full border-collapse text-xs print:text-[11px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 p-2 w-12 text-center">Pts</th>
            <th className="border border-slate-300 p-2 text-left">Critère</th>
            <th className="border border-slate-300 p-2 w-16 text-center">Note</th>
            <th className="border border-slate-300 p-2 text-left">Observation</th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => (
            <tr key={c.id}>
              <td className="border border-slate-300 p-2 text-center font-semibold text-[#0f3d6c]">
                {formatPoints(c.maxPoints)}
              </td>
              <td className="border border-slate-300 p-2">{c.label}</td>
              <td className="border border-slate-300 p-2 text-center font-bold">
                {grille?.scores?.[c.id] != null ? formatPoints(grille.scores[c.id]) : '—'}
              </td>
              <td className="border border-slate-300 p-2 text-gray-600">
                {grille?.observations?.[c.id] || ''}
              </td>
            </tr>
          ))}
          <tr className="bg-blue-50 font-bold">
            <td className="border border-slate-300 p-2 text-center" colSpan={2}>
              Sous-total
            </td>
            <td className="border border-slate-300 p-2 text-center text-[#0f3d6c]">
              {formatPoints(subtotal)} / {formatPoints(max)}
            </td>
            <td className="border border-slate-300 p-2" />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function VideoGrillePrintSheet({ video }: VideoGrillePrintSheetProps) {
  const grille = video.grille_notes
  const noteContenu = grille?.note_contenu ?? 0
  const noteForme = grille?.note_forme ?? 0
  const noteTotale = video.note ?? grille?.note_totale ?? noteContenu + noteForme

  return (
    <div className="video-grille-print bg-white text-slate-900 p-8 max-w-4xl mx-auto">
      <header className="flex items-start justify-between gap-4 border-b-2 border-[#0f3d6c] pb-4 mb-6">
        <img src={COP_LOGO_URL} alt="COP" className="h-14 object-contain" />
        <div className="text-right">
          <h1 className="text-lg font-bold text-[#0f3d6c]">
            Grille d&apos;évaluation de la vidéo présentative
          </h1>
          <p className="text-xs text-gray-500 mt-1">OFPPT — Présélection candidats</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p>
            <span className="font-semibold">Candidat :</span> {video.prenom} {video.nom}
          </p>
          <p>
            <span className="font-semibold">CINE :</span> {video.cine}
          </p>
        </div>
        <div>
          <p>
            <span className="font-semibold">Filière :</span> {video.filiereLabel}
          </p>
          <p>
            <span className="font-semibold">Formateur :</span> {video.formateurNom ?? '—'}
          </p>
          <p>
            <span className="font-semibold">Date d&apos;évaluation :</span>{' '}
            {formatDate(video.evalue_le)}
          </p>
        </div>
      </section>

      <CriteriaTable
        title="Évaluation du contenu"
        subtitle="Ce qui est dit dans la vidéo"
        criteria={EVALUATION_CONTENU_CRITERIA}
        grille={grille}
      />
      <CriteriaTable
        title="Évaluation de la forme"
        subtitle="Qualité technique de la vidéo"
        criteria={EVALUATION_FORME_CRITERIA}
        grille={grille}
      />

      <div className="grid grid-cols-3 gap-3 mb-6 text-center">
        <div className="border-2 border-[#0f3d6c]/30 rounded-lg p-3 bg-blue-50">
          <p className="text-xs text-gray-500 uppercase">Contenu</p>
          <p className="text-xl font-bold text-[#0f3d6c]">
            {formatPoints(noteContenu)} / {formatPoints(EVALUATION_MAX_CONTENU)}
          </p>
        </div>
        <div className="border-2 border-[#0f3d6c]/30 rounded-lg p-3 bg-blue-50">
          <p className="text-xs text-gray-500 uppercase">Forme</p>
          <p className="text-xl font-bold text-[#0f3d6c]">
            {formatPoints(noteForme)} / {formatPoints(EVALUATION_MAX_FORME)}
          </p>
        </div>
        <div className="border-2 border-[#0f3d6c] rounded-lg p-3 bg-[#0f3d6c]/5">
          <p className="text-xs text-gray-500 uppercase">Total</p>
          <p className="text-2xl font-bold text-[#0f3d6c]">
            {formatPoints(noteTotale)} / {formatPoints(EVALUATION_MAX_TOTAL)}
          </p>
        </div>
      </div>

      <p className="text-[10px] text-gray-500 text-center mb-4">
        * Cette note représente 20 % de la note globale lors des délibérations.
      </p>

      {video.commentaire && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[#0f3d6c] mb-2">
            Appréciation globale du formateur
          </h3>
          <p className="text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 whitespace-pre-wrap">
            {video.commentaire}
          </p>
        </div>
      )}

      <table className="w-full border-collapse text-xs mt-8">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 p-3 text-left">
              Appréciation des membres de la commission
            </th>
            <th className="border border-slate-300 p-3 text-left w-48">
              Noms des membres de la commission
            </th>
            <th className="border border-slate-300 p-3 text-center w-32">Émargement</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map((i) => (
            <tr key={i} className="h-14">
              <td className="border border-slate-300 p-2" />
              <td className="border border-slate-300 p-2" />
              <td className="border border-slate-300 p-2" />
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p className="font-semibold mb-8">Signature du formateur évaluateur</p>
          <div className="border-b border-slate-400 h-10" />
          <p className="text-xs text-gray-500 mt-1">{video.formateurNom ?? ''}</p>
        </div>
        <div>
          <p className="font-semibold mb-8">Cachet et visa (Administration)</p>
          <div className="border-b border-slate-400 h-10" />
        </div>
      </div>
    </div>
  )
}
