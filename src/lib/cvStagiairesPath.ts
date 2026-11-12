const MARKER = '/cv-stagiaires/'

/** Chemin Storage à partir de l’URL publique d’un CV. */
export function pathDepuisCvUrl(url?: string | null): string | null {
  if (!url) return null
  const i = url.indexOf(MARKER)
  if (i === -1) return null
  const raw = url.slice(i + MARKER.length).split('?')[0]
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
