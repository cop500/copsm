import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  normalizeCine,
  VIDEO_FILIERES,
  VIDEO_MAX_BYTES,
  type VideoFiliereId,
} from '@/lib/videoPreselectionConstants'
import { uploadVideoFile } from '@/lib/videoStorage'

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

    const formData = await request.formData()
    const nom = String(formData.get('nom') ?? '').trim()
    const prenom = String(formData.get('prenom') ?? '').trim()
    const cine = normalizeCine(String(formData.get('cine') ?? ''))
    const filiere = String(formData.get('filiere') ?? '').trim() as VideoFiliereId
    const file = formData.get('video')

    if (!nom || !prenom || !cine) {
      return NextResponse.json({ error: 'Nom, prénom et CINE sont obligatoires.' }, { status: 400 })
    }

    if (!VIDEO_FILIERES.some((f) => f.id === filiere)) {
      return NextResponse.json({ error: 'Filière invalide.' }, { status: 400 })
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Vidéo obligatoire.' }, { status: 400 })
    }

    if (file.size > VIDEO_MAX_BYTES) {
      return NextResponse.json(
        { error: 'Vidéo trop volumineuse (maximum 50 Mo pour la phase test).' },
        { status: 400 }
      )
    }

    const mime = file.type || 'video/mp4'
    if (!ALLOWED_MIME.has(mime)) {
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

    const ext = mime.includes('webm') ? 'webm' : mime.includes('quicktime') ? 'mov' : 'mp4'
    const safeName = `${cine}_${nom}_${prenom}`.replace(/[^a-zA-Z0-9_-]/g, '_')
    const storagePath = `${filiere}/${Date.now()}_${safeName}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploaded = await uploadVideoFile(buffer, storagePath, mime)

    const { data: row, error: insertError } = await supabaseAdmin
      .from('videos_preselection')
      .insert({
        nom,
        prenom,
        cine,
        filiere,
        storage_type: uploaded.storageType,
        storage_bucket: uploaded.bucket,
        storage_path: uploaded.path,
        statut: 'en_attente_affectation',
      })
      .select('id, cine, filiere, created_at')
      .single()

    if (insertError) {
      const { deleteVideoFile } = await import('@/lib/videoStorage')
      await deleteVideoFile(uploaded.bucket, uploaded.path)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Vidéo enregistrée avec succès. Merci pour votre candidature.',
      id: row.id,
    })
  } catch (err: unknown) {
    console.error('[videos/upload]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors du dépôt.' },
      { status: 500 }
    )
  }
}
