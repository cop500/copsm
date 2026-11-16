import type { supabaseAdmin } from '@/lib/supabaseAdmin'

type Admin = NonNullable<typeof supabaseAdmin>

const CHUNK = 80
const BUCKET = 'cv-connect'

async function listerDossier(admin: Admin, prefix: string): Promise<string[]> {
  const chemins: string[] = []
  let offset = 0
  for (;;) {
    const { data, error } = await admin.storage.from(BUCKET).list(prefix || undefined, {
      limit: 1000,
      offset,
    })
    if (error) throw new Error(error.message)
    if (!data?.length) break
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id == null) {
        chemins.push(...(await listerDossier(admin, path)))
      } else {
        chemins.push(path)
      }
    }
    if (data.length < 1000) break
    offset += 1000
  }
  return chemins
}

export async function apercuCvConnect(admin: Admin) {
  const cheminsStorage = await listerDossier(admin, '')
  const ids: string[] = []
  const cheminsDb: string[] = []
  const page = 1000
  for (let from = 0; from < 50000; from += page) {
    const { data, error } = await admin
      .from('cv_connect_submissions')
      .select('id, cv_storage_path')
      .range(from, from + page - 1)
    if (error) throw new Error(error.message)
    if (!data?.length) break
    for (const row of data) {
      ids.push(row.id)
      if (row.cv_storage_path) cheminsDb.push(row.cv_storage_path)
    }
    if (data.length < page) break
  }
  const chemins = [...new Set([...cheminsStorage, ...cheminsDb])]
  return {
    soumissions: ids.length,
    fichiers: chemins.length,
    chemins,
    ids,
  }
}

export async function viderCvConnect(admin: Admin) {
  const apercu = await apercuCvConnect(admin)
  const erreurs: string[] = []
  let fichiersSupprimes = 0

  for (let i = 0; i < apercu.chemins.length; i += CHUNK) {
    const lot = apercu.chemins.slice(i, i + CHUNK)
    const { error } = await admin.storage.from(BUCKET).remove(lot)
    if (error) erreurs.push(error.message)
    else fichiersSupprimes += lot.length
  }

  const { error: delErr } = await admin.from('cv_connect_submissions').delete().neq('id', '')
  if (delErr) erreurs.push(delErr.message)

  return {
    soumissions: apercu.soumissions,
    fichiersSupprimes,
    erreurs,
  }
}
