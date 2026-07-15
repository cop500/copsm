import { NextResponse } from 'next/server'
import { parseFormateurCookie, verifyFormateurSessionToken } from '@/lib/formateurAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { deleteVideoFile } from '@/lib/videoStorage'
import {
  buildGrilleData,
  validateGrilleScores,
  type GrilleObservations,
  type GrilleScores,
} from '@/lib/videoEvaluationGrid'

export const runtime = 'nodejs'

async function getFormateurFromRequest(request: Request) {
  const token = parseFormateurCookie(request.headers.get('cookie'))
  const session = verifyFormateurSessionToken(token)
  if (!session || !supabaseAdmin) return null
  const { data } = await supabaseAdmin
    .from('formateurs_video')
    .select('id, nom, filiere, actif')
    .eq('id', session.formateurId)
    .eq('actif', true)
    .single()
  return data
}

export async function GET(request: Request) {
  const formateur = await getFormateurFromRequest(request)
  if (!formateur) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin!
    .from('videos_preselection')
    .select('id, nom, prenom, cine, filiere, statut, created_at')
    .eq('formateur_id', formateur.id)
    .eq('statut', 'affectee')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ videos: data ?? [], formateur })
}

export async function POST(request: Request) {
  const formateur = await getFormateurFromRequest(request)
  if (!formateur) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { videoId, commentaire, grille } = await request.json()
  const scores = (grille?.scores ?? {}) as GrilleScores
  const observations = (grille?.observations ?? {}) as GrilleObservations

  if (!videoId) {
    return NextResponse.json({ error: 'Vidéo requise.' }, { status: 400 })
  }

  const scoreError = validateGrilleScores(scores)
  if (scoreError) {
    return NextResponse.json({ error: scoreError }, { status: 400 })
  }

  const grilleData = buildGrilleData(scores, observations)
  const noteNum = grilleData.note_totale

  if (noteNum < 0 || noteNum > 30) {
    return NextResponse.json({ error: 'Note totale invalide.' }, { status: 400 })
  }
  if (!commentaire?.trim()) {
    return NextResponse.json({ error: 'Commentaire obligatoire.' }, { status: 400 })
  }

  const { data: video, error: fetchErr } = await supabaseAdmin!
    .from('videos_preselection')
    .select('id, formateur_id, statut, storage_bucket, storage_path')
    .eq('id', videoId)
    .single()

  if (fetchErr || !video) {
    return NextResponse.json({ error: 'Vidéo introuvable.' }, { status: 404 })
  }
  if (video.formateur_id !== formateur.id || video.statut !== 'affectee') {
    return NextResponse.json({ error: 'Vidéo non affectée à vous.' }, { status: 403 })
  }

  const { error: updateErr } = await supabaseAdmin!
    .from('videos_preselection')
    .update({
      note: noteNum,
      grille_notes: grilleData,
      commentaire: commentaire.trim(),
      statut: 'evaluee',
      evalue_le: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', videoId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  await deleteVideoFile(video.storage_bucket, video.storage_path)

  return NextResponse.json({ success: true, message: 'Évaluation enregistrée. Vidéo archivée (fichier supprimé).' })
}
