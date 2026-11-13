/** Photo identité ambassadeur : lisible à l’écran, légère en Storage. */
export const PHOTO_AMBASSADEUR = {
  /** Affichage carte (CSS). Sur écran Retina on sert 400 px. */
  affichagePx: 96,
  /** Côté du carré enregistré. */
  stockagePx: 400,
  jpegQuality: 0.82,
  /** Poids cible après compression. */
  maxKo: 180,
  maxMoSource: 8,
} as const

/** Consigne à donner aux stagiaires ambassadeurs. */
export const CONSIGNE_PHOTO_AMBASSADEUR =
  'Photo identité, visage de face, fond uni. Carré 400 × 400 pixels, format JPEG, 150 à 200 Ko maximum (éviter les photos de plusieurs Mo).'

export function pathPhotoAmbassadeur(url?: string | null): string | null {
  if (!url) return null
  const marker = '/object/public/photos/'
  const i = url.indexOf(marker)
  if (i === -1) return null
  return decodeURIComponent(url.slice(i + marker.length).split('?')[0])
}

export async function compresserPhotoAmbassadeur(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choisissez une image (JPEG ou PNG).')
  }
  if (file.size > PHOTO_AMBASSADEUR.maxMoSource * 1024 * 1024) {
    throw new Error(`Photo trop lourde (max ${PHOTO_AMBASSADEUR.maxMoSource} Mo).`)
  }

  const bitmap = await createImageBitmap(file)
  const size = PHOTO_AMBASSADEUR.stockagePx
  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const dw = bitmap.width * scale
  const dh = bitmap.height * scale
  const dx = (size - dw) / 2
  const dy = (size - dh) / 2 - dh * 0.06

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Compression impossible sur cet appareil.')
  }
  ctx.fillStyle = '#0f3d6c'
  ctx.fillRect(0, 0, size, size)
  ctx.drawImage(bitmap, dx, dy, dw, dh)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Compression JPEG impossible.'))),
      'image/jpeg',
      PHOTO_AMBASSADEUR.jpegQuality
    )
  })

  if (blob.size > PHOTO_AMBASSADEUR.maxKo * 1024) {
    const plusLeger = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Compression JPEG impossible.'))),
        'image/jpeg',
        0.65
      )
    })
    return new File([plusLeger], 'photo-ambassadeur.jpg', { type: 'image/jpeg' })
  }

  return new File([blob], 'photo-ambassadeur.jpg', { type: 'image/jpeg' })
}
