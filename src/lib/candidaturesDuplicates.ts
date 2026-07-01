/** Champs minimaux pour détecter les doublons (même personne + même offre). */
export interface CandidatureDuplicateFields {
  id: string
  created_at: string
  email?: string | null
  telephone?: string | null
  nom?: string | null
  prenom?: string | null
  entreprise_nom: string
  poste: string
  demande_entreprise_id?: string | null
  poste_index?: number | null
}

export interface DuplicateInfo {
  groupSize: number
  /** 1 = premier envoi chronologique, 2 = deuxième, etc. */
  positionInGroup: number
  isNewest: boolean
  isDuplicate: boolean
}

function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase()
}

function normalizePhone(phone?: string | null): string {
  return (phone || '').replace(/\D/g, '')
}

export function getOfferKey(c: CandidatureDuplicateFields): string {
  if (c.demande_entreprise_id) {
    const idx = c.poste_index ?? -1
    return `demande:${c.demande_entreprise_id}:${idx}`
  }
  const poste = (c.poste || '').trim().toLowerCase()
  const ent = (c.entreprise_nom || '').trim().toLowerCase()
  return `legacy:${ent}|${poste}`
}

export function getPersonKey(c: CandidatureDuplicateFields): string {
  const email = normalizeEmail(c.email)
  if (email) return `email:${email}`
  const tel = normalizePhone(c.telephone)
  if (tel.length >= 9) return `tel:${tel}`
  const nom = (c.nom || '').trim().toLowerCase()
  const prenom = (c.prenom || '').trim().toLowerCase()
  if (nom && prenom) return `name:${nom}|${prenom}`
  return `id:${c.id}`
}

export function getDuplicateGroupKey(c: CandidatureDuplicateFields): string {
  return `${getOfferKey(c)}::${getPersonKey(c)}`
}

/** Pour chaque candidature : infos doublon sur la même offre. */
export function buildDuplicateMap(
  candidatures: CandidatureDuplicateFields[]
): Map<string, DuplicateInfo> {
  const groups = new Map<string, CandidatureDuplicateFields[]>()

  for (const c of candidatures) {
    const key = getDuplicateGroupKey(c)
    const list = groups.get(key) ?? []
    list.push(c)
    groups.set(key, list)
  }

  const result = new Map<string, DuplicateInfo>()

  for (const items of groups.values()) {
    const sorted = [...items].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const groupSize = sorted.length
    sorted.forEach((c, index) => {
      const positionInGroup = index + 1
      const isNewest = index === sorted.length - 1
      result.set(c.id, {
        groupSize,
        positionInGroup,
        isNewest,
        isDuplicate: groupSize > 1,
      })
    })
  }

  return result
}

export function countHiddenDuplicates(map: Map<string, DuplicateInfo>): number {
  let count = 0
  map.forEach((info) => {
    if (info.isDuplicate && !info.isNewest) count++
  })
  return count
}
