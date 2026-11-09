type ClientLike = {
  from: (table: string) => any
}

function estActive(statut?: string | null): boolean {
  return statut !== 'annule'
}

export async function compterInscriptionsActives(
  client: ClientLike,
  atelierIds: string[]
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  const ids = [...new Set(atelierIds.filter(Boolean))]
  for (const id of ids) counts[id] = 0
  if (ids.length === 0) return counts

  const { data, error } = await client
    .from('inscriptions_ateliers')
    .select('atelier_id, statut')
    .in('atelier_id', ids)
    .range(0, 19999)

  if (error) {
    console.error('comptage inscriptions ateliers:', error)
    return counts
  }

  for (const row of data || []) {
    if (!row?.atelier_id || !estActive(row.statut)) continue
    counts[row.atelier_id] = (counts[row.atelier_id] || 0) + 1
  }
  return counts
}

export function appliquerComptesInscriptions<T extends { id: string; capacite_actuelle?: number | null }>(
  ateliers: T[],
  counts: Record<string, number>
): T[] {
  return ateliers.map((atelier) => ({
    ...atelier,
    capacite_actuelle: counts[atelier.id] ?? 0,
  }))
}

export async function synchroniserCapaciteAtelier(
  client: ClientLike,
  atelierId: string
): Promise<number> {
  const counts = await compterInscriptionsActives(client, [atelierId])
  const n = counts[atelierId] ?? 0
  await client.from('evenements').update({ capacite_actuelle: n }).eq('id', atelierId)
  return n
}
