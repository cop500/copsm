import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  normalizeCine,
  VIDEO_FILIERES,
  type VideoFiliereId,
} from '@/lib/videoPreselectionConstants'
import { videoExistsInStorage, VIDEO_BUCKET } from '@/lib/videoStorage'
import { verifyUploadToken } from '@/lib/videoUploadToken'

export const runtime = 'nodejs'

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
    const storagePath = String(body.storagePath ?? '').trim()
    const completeToken = String(body.completeToken ?? '')

    if (!nom || !prenom || !cine || !storagePath || !completeToken) {
      return NextResponse.json({ error: 'Données incomplètes.' }, { status: 400 })
    }

    if (!verifyUploadToken(storagePath, cine, completeToken)) {
      return NextResponse.json({ error: 'Session d\'upload expirée. Recommencez.' }, { status: 400 })
    }

    if (!VIDEO_FILIERES.some((f) => f.id === filiere)) {
      return NextResponse.json({ error: 'Filière invalide.' }, { status: 400 })
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

    const exists = await videoExistsInStorage(VIDEO_BUCKET, storagePath)
    if (!exists) {
      return NextResponse.json(
        { error: 'Fichier vidéo introuvable. L\'upload a peut-être échoué.' },
        { status: 400 }
      )
    }

    const { data: row, error: insertError } = await supabaseAdmin
      .from('videos_preselection')
      .insert({
        nom,
        prenom,
        cine,
        filiere,
        storage_type: 'supabase',
        storage_bucket: VIDEO_BUCKET,
        storage_path: storagePath,
        statut: 'en_attente_affectation',
      })
      .select('id, cine, filiere, created_at')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Vidéo enregistrée avec succès. Merci pour votre candidature.',
      id: row.id,
    })
  } catch (err: unknown) {
    console.error('[videos/upload-complete]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.' },
      { status: 500 }
    )
  }
}
