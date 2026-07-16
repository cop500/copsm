import { NextResponse } from 'next/server'
import { verifyAdminFromRequest } from '@/lib/verifyAdminRequest'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseNotesConcoursWorkbook } from '@/lib/notesConcoursExcel'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const auth = await verifyAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Fichier Excel requis.' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const { rows, errors: parseErrors } = parseNotesConcoursWorkbook(buffer)

  if (parseErrors.length && !rows.length) {
    return NextResponse.json({ error: parseErrors.join(' ') }, { status: 400 })
  }

  let inserted = 0
  let updated = 0
  const upsertErrors: string[] = [...parseErrors]

  for (const row of rows) {
    const { data: existing } = await supabaseAdmin
      .from('candidats_notes_concours')
      .select('id, note_70, note_20, saisi_le')
      .eq('id_inscription_concours_national', row.id_inscription_concours_national as string)
      .maybeSingle()

    const payload: Record<string, unknown> = {
      dr: row.dr || null,
      efp: row.efp || null,
      niveau_formation: row.niveau_formation || null,
      nom: row.nom,
      prenom: row.prenom,
      id_inscription_concours_national: row.id_inscription_concours_national,
      cef: row.cef,
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

    if (existing?.saisi_le && existing.note_70 != null) {
      payload.note_70 = existing.note_70
      payload.note_20 = existing.note_20
    } else if (row.note_70 != null) {
      payload.note_70 = row.note_70
      payload.note_20 = row.note_20
      if (row.note_70 != null) payload.saisi_le = new Date().toISOString()
    }

    if (existing) {
      const { error } = await supabaseAdmin
        .from('candidats_notes_concours')
        .update(payload)
        .eq('id', existing.id)
      if (error) upsertErrors.push(`CEF ${row.cef}: ${error.message}`)
      else updated++
    } else {
      const { error } = await supabaseAdmin.from('candidats_notes_concours').insert(payload)
      if (error) upsertErrors.push(`CEF ${row.cef}: ${error.message}`)
      else inserted++
    }
  }

  return NextResponse.json({
    success: true,
    inserted,
    updated,
    total: rows.length,
    errors: upsertErrors.length ? upsertErrors : undefined,
    message: `Import terminé : ${inserted} ajout(s), ${updated} mise(s) à jour.`,
  })
}
