import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { VIDEO_MAX_BYTES } from '@/lib/videoPreselectionConstants'

export const VIDEO_BUCKET = 'videos-preselection'

export type VideoStorageType = 'supabase' | 'drive'

export interface VideoUploadResult {
  storageType: VideoStorageType
  bucket: string
  path: string
}

/** Phase 1 : Supabase. Phase 2 : brancher Google Drive ici. */
export async function uploadVideoFile(
  fileBuffer: Buffer,
  storagePath: string,
  mimeType: string
): Promise<VideoUploadResult> {
  if (!supabaseAdmin) {
    throw new Error('Configuration serveur indisponible')
  }
  if (fileBuffer.length > VIDEO_MAX_BYTES) {
    throw new Error('La vidéo dépasse la taille maximale autorisée (50 Mo).')
  }

  const { error } = await supabaseAdmin.storage
    .from(VIDEO_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  return {
    storageType: 'supabase',
    bucket: VIDEO_BUCKET,
    path: storagePath,
  }
}

export async function deleteVideoFile(bucket: string, path: string): Promise<void> {
  if (!supabaseAdmin) return
  await supabaseAdmin.storage.from(bucket).remove([path])
}

export async function getVideoSignedUrl(
  bucket: string,
  path: string,
  expiresInSec = 3600
): Promise<string | null> {
  if (!supabaseAdmin) return null
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSec)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
