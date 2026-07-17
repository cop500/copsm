import { NextResponse } from 'next/server'
import { verifyVideoNotesAdminFromRequest } from '@/lib/verifyAdminRequest'
import { parseFormateurCookie, verifyFormateurSessionToken } from '@/lib/formateurAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getVideoSignedUrl } from '@/lib/videoStorage'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  const { data: video, error } = await supabaseAdmin
    .from('videos_preselection')
    .select('id, storage_bucket, storage_path, statut, formateur_id')
    .eq('id', id)
    .single()

  if (error || !video) {
    return NextResponse.json({ error: 'Vidéo introuvable' }, { status: 404 })
  }

  if (video.statut === 'evaluee') {
    return NextResponse.json({ error: 'Fichier vidéo déjà supprimé après évaluation.' }, { status: 410 })
  }

  let allowed = false

  const videoNotesAdminAuth = await verifyVideoNotesAdminFromRequest(request)
  if (!videoNotesAdminAuth.error) {
    allowed = true
  } else {
    const token = parseFormateurCookie(request.headers.get('cookie'))
    const session = verifyFormateurSessionToken(token)
    if (session && video.formateur_id === session.formateurId && video.statut === 'affectee') {
      allowed = true
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const signedUrl = await getVideoSignedUrl(video.storage_bucket, video.storage_path, 3600)
  if (!signedUrl) {
    return NextResponse.json({ error: 'Impossible de lire la vidéo' }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrl })
}
