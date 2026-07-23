import type { CvTriStatut } from '@/lib/cvTriStatut'

const STORAGE_KEY = 'cop_cv_tri_cache_v1'

export interface CvTriCacheEntry {
  cv_tri_statut: CvTriStatut
  updated_at: string
  pendingSync?: boolean
}

type CvTriCacheMap = Record<string, CvTriCacheEntry>

function readMap(): CvTriCacheMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as CvTriCacheMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeMap(map: CvTriCacheMap): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* quota / private mode */
  }
}

export function getCvTriFromCache(candidatureId: string): CvTriCacheEntry | null {
  return readMap()[candidatureId] ?? null
}

export function setCvTriInCache(
  candidatureId: string,
  cvTriStatut: CvTriStatut,
  options?: { pendingSync?: boolean }
): void {
  const map = readMap()
  map[candidatureId] = {
    cv_tri_statut: cvTriStatut,
    updated_at: new Date().toISOString(),
    pendingSync: options?.pendingSync ?? false,
  }
  writeMap(map)
}

export function markCvTriSynced(candidatureId: string, cvTriStatut: CvTriStatut): void {
  setCvTriInCache(candidatureId, cvTriStatut, { pendingSync: false })
}

export function listPendingCvTriSync(): Array<{ id: string; entry: CvTriCacheEntry }> {
  return Object.entries(readMap())
    .filter(([, entry]) => entry.pendingSync)
    .map(([id, entry]) => ({ id, entry }))
}

/** Fusionne le cache local si la base renvoie encore « en_attente » ou vide. */
export function mergeCvTriFromCache<T extends { id: string; cv_tri_statut?: string | null }>(
  rows: T[]
): T[] {
  const map = readMap()
  if (!Object.keys(map).length) return rows

  return rows.map((row) => {
    const cached = map[row.id]
    if (!cached) return row

    const dbStatut = row.cv_tri_statut || 'en_attente'
    const cacheIsDecision = cached.cv_tri_statut === 'accepte' || cached.cv_tri_statut === 'refuse'

    if (dbStatut === 'en_attente' && cacheIsDecision) {
      return { ...row, cv_tri_statut: cached.cv_tri_statut }
    }

    if (
      (cached.cv_tri_statut === 'accepte' || cached.cv_tri_statut === 'refuse') &&
      dbStatut === cached.cv_tri_statut
    ) {
      markCvTriSynced(row.id, cached.cv_tri_statut)
    }

    return row
  })
}

export function countPendingCvTriSync(): number {
  return listPendingCvTriSync().length
}
