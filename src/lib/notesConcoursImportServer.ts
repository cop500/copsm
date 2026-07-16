import { supabaseAdmin } from '@/lib/supabaseAdmin'

type ImportRow = Record<string, string | number | null>

const BATCH_SIZE = 100

export async function importCandidatsRows(rows: ImportRow[], replace = true) {
  if (!supabaseAdmin) throw new Error('Configuration serveur')

  const notesByCef = new Map<
    string,
    { note_70: number; note_20: number; agent_id: string | null; saisi_le: string | null }
  >()

  if (replace) {
    const { data: existingNotes } = await supabaseAdmin
      .from('candidats_notes_concours')
      .select('cef, note_70, note_20, agent_id, saisi_le')
      .not('note_70', 'is', null)

    for (const row of existingNotes ?? []) {
      if (row.cef && row.note_70 != null) {
        notesByCef.set(row.cef, {
          note_70: Number(row.note_70),
          note_20: Number(row.note_20),
          agent_id: row.agent_id,
          saisi_le: row.saisi_le,
        })
      }
    }

    const { error: delErr } = await supabaseAdmin
      .from('candidats_notes_concours')
      .delete()
      .not('id', 'is', null)

    if (delErr) throw new Error(delErr.message)
  }

  let inserted = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE).map((row) => {
      const cef = String(row.cef)
      const saved = notesByCef.get(cef)
      const payload: Record<string, unknown> = {
        dr: row.dr || null,
        efp: row.efp || null,
        niveau_formation: row.niveau_formation || null,
        nom: row.nom,
        prenom: row.prenom,
        id_inscription_concours_national: row.id_inscription_concours_national,
        cef,
        niveau_scolaire: row.niveau_scolaire || null,
        moyenne: row.moyenne || null,
        branche: row.branche || null,
        categorie: row.categorie || null,
        filiere: row.filiere || null,
        numero_choix: row.numero_choix || null,
        classement: row.classement || null,
        statut: row.statut || null,
        tel_1: row.tel_1 || null,
        tel_2: row.tel_2 || null,
        valide: row.valide || null,
        absent: row.absent || null,
        updated_at: new Date().toISOString(),
      }

      if (saved) {
        payload.note_70 = saved.note_70
        payload.note_20 = saved.note_20
        payload.agent_id = saved.agent_id
        payload.saisi_le = saved.saisi_le
      } else if (row.note_70 != null) {
        payload.note_70 = row.note_70
        payload.note_20 = row.note_20
        payload.saisi_le = new Date().toISOString()
      }

      return payload
    })

    const { error } = await supabaseAdmin.from('candidats_notes_concours').insert(chunk)
    if (error) {
      errors.push(`Lot ${Math.floor(i / BATCH_SIZE) + 1} : ${error.message}`)
    } else {
      inserted += chunk.length
    }
  }

  return { inserted, total: rows.length, errors }
}
