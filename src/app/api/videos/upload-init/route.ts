import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  normalizeCine,
  VIDEO_FILIERES,
  VIDEO_MAX_BYTES,
  type VideoFiliereId,
} from '@/lib/videoPreselectionConstants'
import { createVideoUploadUrl, VIDEO_BUCKET } from '@/lib/videoStorage'
import { createUploadToken } from '@/lib/videoUploadToken'

export const runtime = 'nodejs'

const ALLOWED_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
])

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration serveur indisponible' }, { status: 500 })
    }

    const body = await request.json()
    const nom = String(body.nom ?? '').trim()
    const prenom = String(body.prenom ?? '').trim()
    const cine = normalizeCine(String(body.cine ?? ''))
    const filiere = String(body.filiere ?? '').trim() as VideoFiliereId
    const fileSize = Number(body.fileSize ?? 0)
    const mimeType = String(body.mimeType ?? 'video/mp4')

    if (!nom || !prenom || !cine) {
      return NextResponse.json({ error: 'Nom, prénom et CINE sont obligatoires.' }, { status: 400 })
    }

    if (!VIDEO_FILIERES.some((f) => f.id === filiere)) {
      return NextResponse.json({ error: 'Filière invalide.' }, { status: 400 })
    }

    if (!fileSize || fileSize > VIDEO_MAX_BYTES) {
      return NextResponse.json(
        { error: 'Vidéo trop volumineuse (maximum 50 Mo pour la phase test).' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json(
        { error: 'Format non accepté. Utilisez MP4 ou WebM.' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabaseAdmin
      .from('videos_preselection')
      .select('id')
      .eq('cine', cine)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Une vidéo a déjà été déposée pour ce CINE.' },
        { status: 409 }
      )
    }

    const ext = mimeType.includes('webm')
      ? 'webm'
      : mimeType.includes('quicktime')
        ? 'mov'
        : 'mp4'
    const safeName = `${cine}_${nom}_${prenom}`.replace(/[^a-zA-Z0-9_-]/g, '_')
    const storagePath = `${filiere}/${Date.now()}_${safeName}.${ext}`

    const upload = await createVideoUploadUrl(storagePath)
    if (!upload) {
      return NextResponse.json(
        { error: 'Impossible de préparer l\'upload. Vérifiez le bucket videos-preselection.' },
        { status: 500 }
      )
    }

    const completeToken = createUploadToken(storagePath, cine)

    return NextResponse.json({
      signedUrl: upload.signedUrl,
      uploadToken: upload.token,
      storagePath,
      bucket: VIDEO_BUCKET,
      completeToken,
    })
  } catch (err: unknown) {
    console.error('[videos/upload-init]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la préparation.' },
      { status: 500 }
    )
  }
}
