import type { supabaseAdmin } from '@/lib/supabaseAdmin'
import { pathDepuisCvUrl } from '@/lib/cvStagiairesPath'

type Admin = NonNullable<typeof supabaseAdmin>

const CHUNK = 80

export async function listerCvDemandesTerminees(
  admin: Admin,
  demandeIds?: string[]
) {
  let ids = demandeIds?.filter(Boolean) || []
  if (ids.length === 0) {
    const { data: demandes, error: dErr } = await admin
      .from('demandes_entreprises')
      .select('id')
      .eq('statut', 'terminee')
    if (dErr) throw dErr
    ids = (demandes || []).map((d) => d.id)
  }

  if (ids.length === 0) {
    return {
      demandes: 0,
      candidaturesAvecCv: 0,
      chemins: [] as string[],
      idsCandidatures: [] as string[],
    }
  }

  const idsCandidatures: string[] = []
  const chemins: string[] = []
  const page = 1000
  for (let from = 0; from < 20000; from += page) {
    const { data: rows, error } = await admin
      .from('candidatures_stagiaires')
      .select('id, cv_url, demande_entreprise_id')
      .in('demande_entreprise_id', ids)
      .not('cv_url', 'is', null)
      .range(from, from + page - 1)
    if (error) throw error
    if (!rows?.length) break
    for (const row of rows) {
      if (!row.cv_url) continue
      idsCandidatures.push(row.id)
      const path = pathDepuisCvUrl(row.cv_url)
      if (path) chemins.push(path)
    }
    if (rows.length < page) break
  }

  return {
    demandes: ids.length,
    candidaturesAvecCv: idsCandidatures.length,
    chemins: [...new Set(chemins)],
    idsCandidatures,
  }
}

export async function supprimerPdfCandidatures(
  admin: Admin,
  cibles: { chemins: string[]; idsCandidatures: string[] }
) {
  let fichiersSupprimes = 0
  const erreurs: string[] = []

  for (let i = 0; i < cibles.chemins.length; i += CHUNK) {
    const lot = cibles.chemins.slice(i, i + CHUNK)
    const { error } = await admin.storage.from('cv-stagiaires').remove(lot)
    if (error) erreurs.push(error.message)
    else fichiersSupprimes += lot.length
  }

  for (let i = 0; i < cibles.idsCandidatures.length; i += CHUNK) {
    const lot = cibles.idsCandidatures.slice(i, i + CHUNK)
    const { error } = await admin
      .from('candidatures_stagiaires')
      .update({ cv_url: null })
      .in('id', lot)
    if (error) erreurs.push(error.message)
  }

  return { fichiersSupprimes, erreurs }
}
