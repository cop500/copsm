/** Taille max par requête Supabase/PostgREST (souvent 1000 en projet par défaut). */
const PAGE_SIZE = 1000

/**
 * Récupère toutes les lignes d'une requête paginée (.range).
 * Évite le plafond des 1000 enregistrements sur un seul select('*').
 */
export async function fetchAllPages<T>(
  queryPage: (
    from: number,
    to: number
  ) => Promise<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const all: T[] = []
  let offset = 0

  for (;;) {
    const { data, error } = await queryPage(offset, offset + PAGE_SIZE - 1)
    if (error) throw error
    const batch = data ?? []
    all.push(...batch)
    if (batch.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return all
}
