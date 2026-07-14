export interface UploadProgress {
  percent: number
  loaded: number
  total: number
  speedBps: number
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function formatUploadSpeed(bps: number): string {
  if (bps <= 0) return '—'
  return `${formatBytes(bps)}/s`
}

export function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  if (seconds < 60) return `${Math.ceil(seconds)} s`
  const m = Math.floor(seconds / 60)
  const s = Math.ceil(seconds % 60)
  return `${m} min ${s} s`
}

/** Upload direct vers URL signée Supabase avec suivi de progression (XHR). */
export function uploadVideoToSignedUrl(
  signedUrl: string,
  file: File,
  mimeType: string,
  onProgress: (progress: UploadProgress) => void,
  timeoutMs = 10 * 60 * 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let lastLoaded = 0
    let lastTime = Date.now()
    let speedBps = 0

    const timer = window.setTimeout(() => {
      xhr.abort()
      reject(new Error('Délai dépassé. Vérifiez votre connexion et réessayez.'))
    }, timeoutMs)

    const cleanup = () => window.clearTimeout(timer)

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return
      const now = Date.now()
      const dt = (now - lastTime) / 1000
      if (dt > 0.2) {
        speedBps = (event.loaded - lastLoaded) / dt
        lastLoaded = event.loaded
        lastTime = now
      }
      onProgress({
        percent: Math.min(100, Math.round((event.loaded / event.total) * 100)),
        loaded: event.loaded,
        total: event.total,
        speedBps,
      })
    })

    xhr.addEventListener('load', () => {
      cleanup()
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress({
          percent: 100,
          loaded: file.size,
          total: file.size,
          speedBps,
        })
        resolve()
        return
      }
      const detail = xhr.responseText?.slice(0, 120).trim()
      reject(
        new Error(
          detail
            ? `Échec de l'envoi (${xhr.status}) : ${detail}`
            : `Échec de l'envoi de la vidéo (code ${xhr.status}).`
        )
      )
    })

    xhr.addEventListener('error', () => {
      cleanup()
      reject(
        new Error(
          'Connexion interrompue pendant l\'envoi. Vérifiez votre réseau ou réduisez la taille de la vidéo.'
        )
      )
    })

    xhr.addEventListener('abort', () => {
      cleanup()
      reject(new Error('Envoi annulé ou expiré.'))
    })

    xhr.open('PUT', signedUrl, true)
    xhr.setRequestHeader('Content-Type', mimeType)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.send(file)
  })
}
